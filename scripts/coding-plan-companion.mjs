#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parseArgs, splitRawArgumentString } from "./lib/args.mjs";
import {
  sendCodingPlanRequest,
  validateApiKey,
  estimateQuotaUsage,
  getAvailableModels,
  withRetry
} from "./lib/api.mjs";
import {
  loadConfig,
  saveConfig,
  validateApiKey as validateApiKeyFormat,
  validateModel,
  getApiKey,
  getBaseUrl,
  getModel,
  initializeConfig,
  resetConfig
} from "./lib/config.mjs";
import {
  generateJobId,
  createJobRecord,
  loadJob,
  updateJobStatus,
  listJobs,
  findLatestJob,
  loadQuota,
  incrementRequestCount
} from "./lib/state.mjs";
import {
  renderSetupReport,
  renderStatusReport,
  renderJobStatus,
  renderReviewResult,
  renderTaskResult,
  renderCancelReport,
  renderModelList,
  renderQuotaWarning,
  renderError
} from "./lib/render.mjs";
import {
  createJobRecord as createTrackedJob,
  runTrackedJob
} from "./lib/tracked-jobs.mjs";

const ROOT_DIR = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_STATUS_WAIT_TIMEOUT_MS = 240000;
const DEFAULT_STATUS_POLL_INTERVAL_MS = 2000;
const VALID_EFFORTS = new Set(["none", "minimal", "low", "medium", "high", "xhigh"]);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/coding-plan-companion.mjs setup [--api-key <key>] [--model <model>] [--reset] [--json]",
      "  node scripts/coding-plan-companion.mjs review [--wait|--background] [--base <ref>] [--model <model>]",
      "  node scripts/coding-plan-companion.mjs task [--background] [--model <model>] [--effort <level>] [--resume|--fresh] [prompt]",
      "  node scripts/coding-plan-companion.mjs status [job-id] [--all] [--json]",
      "  node scripts/coding-plan-companion.mjs model [model-name]",
      "  node scripts/coding-plan-companion.mjs cancel [job-id]"
    ].join("\n")
  );
}

function outputResult(value, asJson) {
  if (asJson) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    process.stdout.write(value);
  }
}

function normalizeArgv(argv) {
  if (argv.length === 1) {
    const [raw] = argv;
    if (!raw || !raw.trim()) {
      return [];
    }
    return splitRawArgumentString(raw);
  }
  return argv;
}

function parseCommandInput(argv, config = {}) {
  return parseArgs(normalizeArgv(argv), config);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleSetup(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    valueOptions: ["api-key", "model"],
    booleanOptions: ["reset", "json"]
  });

  const asJson = options.json || false;

  try {
    // Handle reset
    if (options.reset) {
      resetConfig();
      const result = { success: true, message: "Configuration reset successfully" };
      outputResult(asJson ? result : renderSetupReport({ apiKey: "", baseUrl: "https://coding.dashscope.aliyuncs.com/apps/anthropic", defaultModel: "qwen3.6-plus" }, { valid: true, message: "Configuration reset" }), asJson);
      return;
    }

    const config = loadConfig();

    // Update API key if provided
    if (options["api-key"]) {
      const validation = validateApiKeyFormat(options["api-key"]);
      if (!validation.valid) {
        const error = { success: false, error: validation.error };
        outputResult(asJson ? error : renderError(validation.error), asJson);
        process.exit(1);
      }
      config.apiKey = options["api-key"];
    }

    // Update model if provided
    if (options.model) {
      const validation = validateModel(options.model);
      if (!validation.valid) {
        const error = { success: false, error: validation.error };
        outputResult(asJson ? error : renderError(validation.error), asJson);
        process.exit(1);
      }
      config.defaultModel = options.model;
    }

    // Save config if changed
    if (options["api-key"] || options.model) {
      saveConfig(config);
    }

    // Validate API key if present
    let validationStatus = null;
    if (config.apiKey) {
      validationStatus = await validateApiKey(config.apiKey, config.baseUrl, config.defaultModel);
    }

    const report = renderSetupReport(config, validationStatus);
    const jsonReport = {
      config: {
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : null,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel
      },
      validation: validationStatus
    };

    outputResult(asJson ? jsonReport : report, asJson);
  } catch (error) {
    const errorResult = { success: false, error: error.message };
    outputResult(asJson ? errorResult : renderError(error.message), asJson);
    process.exit(1);
  }
}

async function handleReview(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    valueOptions: ["base", "model"],
    booleanOptions: ["wait", "background", "json"]
  });

  const asJson = options.json || false;
  const config = loadConfig();
  const apiKey = getApiKey(config);

  if (!apiKey) {
    const error = "API key not configured. Run setup first.";
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  const model = getModel(options.model, config);
  const workspaceRoot = process.cwd();

  // Collect git context
  const { collectReviewContext, resolveReviewTarget } = await import("./lib/git.mjs");
  
  let reviewTarget;
  try {
    reviewTarget = await resolveReviewTarget(workspaceRoot, {
      base: options.base || null
    });
  } catch (error) {
    outputResult(asJson ? { success: false, error: error.message } : renderError(error.message), asJson);
    process.exit(1);
  }

  const reviewContext = await collectReviewContext(workspaceRoot, reviewTarget);
  
  // Build review prompt
  const systemPrompt = "You are an expert code reviewer. Review the provided code changes and provide constructive feedback on code quality, potential bugs, performance issues, and best practices. Be thorough but concise.";
  
  const userPrompt = `Please review the following code changes:\n\n${reviewContext}`;

  const foreground = options.wait || !options.background;

  if (foreground) {
    try {
      const response = await withRetry(async () => {
        return sendCodingPlanRequest(
          [{ role: "user", content: userPrompt }],
          model,
          {
            apiKey,
            baseUrl: getBaseUrl(config),
            system: systemPrompt,
            maxTokens: 4096
          }
        );
      });

      const reviewText = response.content?.[0]?.text || JSON.stringify(response);
      incrementRequestCount(1);
      
      const result = renderReviewResult(reviewText);
      outputResult(asJson ? { success: true, result: reviewText } : result, asJson);
    } catch (error) {
      outputResult(asJson ? { success: false, error: error.message } : renderError(error.message), asJson);
      process.exit(1);
    }
  } else {
    // Background mode - this would be handled by Claude Code's background task mechanism
    console.log("Background review initiated. Use /coding-plan:status to check progress.");
  }
}

async function handleTask(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    valueOptions: ["model", "effort"],
    booleanOptions: ["background", "resume", "fresh", "json"]
  });

  const asJson = options.json || false;
  const config = loadConfig();
  const apiKey = getApiKey(config);

  if (!apiKey) {
    const error = "API key not configured. Run setup first.";
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  const model = getModel(options.model, config);
  const prompt = positionals.join(" ").trim();

  if (!prompt && !options.resume) {
    const error = "Task prompt is required.";
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  const foreground = !options.background;

  if (foreground) {
    try {
      const response = await withRetry(async () => {
        return sendCodingPlanRequest(
          [{ role: "user", content: prompt }],
          model,
          {
            apiKey,
            baseUrl: getBaseUrl(config),
            maxTokens: 8192,
            temperature: 0.7
          }
        );
      });

      const resultText = response.content?.[0]?.text || JSON.stringify(response);
      incrementRequestCount(1);
      
      const result = renderTaskResult(resultText);
      outputResult(asJson ? { success: true, result: resultText } : result, asJson);
    } catch (error) {
      outputResult(asJson ? { success: false, error: error.message } : renderError(error.message), asJson);
      process.exit(1);
    }
  } else {
    console.log("Background task initiated. Use /coding-plan:status to check progress.");
  }
}

async function handleStatus(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    booleanOptions: ["all", "json"]
  });

  const asJson = options.json || false;
  const jobId = positionals[0];

  // Show specific job
  if (jobId) {
    const job = loadJob(jobId);
    if (!job) {
      const error = `Job ${jobId} not found`;
      outputResult(asJson ? { success: false, error } : renderError(error), asJson);
      process.exit(1);
    }

    const report = renderJobStatus(job);
    outputResult(asJson ? { success: true, job } : report, asJson);
    return;
  }

  // Show all jobs and quota
  const jobs = listJobs({ all: options.all, limit: 10 });
  const quota = loadQuota();
  const quotaEstimate = estimateQuotaUsage(quota);

  const report = renderStatusReport(jobs, quotaEstimate);
  outputResult(asJson ? { success: true, jobs, quota: quotaEstimate } : report, asJson);
}

async function handleModel(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    booleanOptions: ["json"]
  });

  const asJson = options.json || false;
  const config = loadConfig();
  const models = getAvailableModels();

  // Show current model if no argument
  if (positionals.length === 0) {
    const report = renderModelList(models, config.defaultModel);
    outputResult(asJson ? { success: true, currentModel: config.defaultModel, models } : report, asJson);
    return;
  }

  // Switch model
  const newModel = positionals[0];
  const validation = validateModel(newModel);

  if (!validation.valid) {
    outputResult(asJson ? { success: false, error: validation.error } : renderError(validation.error), asJson);
    process.exit(1);
  }

  config.defaultModel = newModel;
  saveConfig(config);

  const message = `Model switched to ${newModel}`;
  outputResult(asJson ? { success: true, model: newModel } : message + "\n", asJson);
}

async function handleCancel(argv) {
  const { options, positionals } = parseCommandInput(argv, {
    booleanOptions: ["json"]
  });

  const asJson = options.json || false;
  const jobId = positionals[0] || (findLatestJob()?.id);

  if (!jobId) {
    const error = "No job ID provided and no active jobs found";
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  const job = loadJob(jobId);
  if (!job) {
    const error = `Job ${jobId} not found`;
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    const error = `Job ${jobId} is already ${job.status}`;
    outputResult(asJson ? { success: false, error } : renderError(error), asJson);
    process.exit(1);
  }

  // Cancel the job
  updateJobStatus(jobId, "cancelled");

  const report = renderCancelReport({ jobId, success: true, message: "Job cancelled" });
  outputResult(asJson ? { success: true, jobId, message: "Job cancelled" } : report, asJson);
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case "setup":
        await handleSetup(commandArgs);
        break;
      case "review":
        await handleReview(commandArgs);
        break;
      case "task":
        await handleTask(commandArgs);
        break;
      case "status":
        await handleStatus(commandArgs);
        break;
      case "model":
        await handleModel(commandArgs);
        break;
      case "cancel":
        await handleCancel(commandArgs);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
