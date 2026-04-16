import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { generateJobId, saveJob, updateJobStatus, incrementRequestCount } from "./state.mjs";

/**
 * Create a job record for tracking
 */
export function createJobRecord(type, model, prompt, options = {}) {
  const jobId = generateJobId();
  const job = {
    id: jobId,
    type,
    model,
    status: "pending",
    prompt,
    result: null,
    error: null,
    startTime: new Date().toISOString(),
    endTime: null,
    requestCount: 0,
    background: options.background || false,
    workspaceRoot: options.workspaceRoot || process.cwd()
  };

  saveJob(job);
  return job;
}

/**
 * Create a progress reporter for background jobs
 */
export function createProgressReporter(jobId, onProgress = null) {
  let progressLines = [];
  
  return {
    update(message, data = null) {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}`;
      progressLines.push(logEntry);
      
      if (onProgress) {
        onProgress(message, data);
      }
    },
    
    getLog() {
      return progressLines.join("\n");
    }
  };
}

/**
 * Run a tracked job with proper state management
 */
export async function runTrackedJob(jobId, type, model, taskFn, options = {}) {
  const onProgress = options.onProgress || null;
  const reporter = createProgressReporter(jobId, onProgress);
  
  try {
    // Update status to running
    updateJobStatus(jobId, "running");
    reporter.update("Job started");
    
    // Execute the task
    const result = await taskFn(reporter);
    
    // Update request count
    const requestCount = result.requestCount || 1;
    incrementRequestCount(requestCount);
    
    // Update job with result
    updateJobStatus(jobId, "completed", {
      result: result.output || result,
      requestCount: requestCount,
      endTime: new Date().toISOString()
    });
    
    reporter.update("Job completed");
    
    return {
      jobId,
      success: true,
      result: result.output || result
    };
  } catch (error) {
    // Update job with error
    updateJobStatus(jobId, "failed", {
      error: error.message,
      endTime: new Date().toISOString()
    });
    
    reporter.update(`Job failed: ${error.message}`);
    
    return {
      jobId,
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a job log file
 */
export function createJobLogFile(jobId, content) {
  const jobsDir = path.join(process.env.HOME, ".coding-plan", "jobs");
  const logFile = path.join(jobsDir, `${jobId}.log`);
  
  fs.writeFileSync(logFile, content, "utf-8");
  return logFile;
}

/**
 * Append to job log file
 */
export function appendJobLog(jobId, line) {
  const jobsDir = path.join(process.env.HOME, ".coding-plan", "jobs");
  const logFile = path.join(jobsDir, `${jobId}.log`);
  
  fs.appendFileSync(logFile, `${line}\n`, "utf-8");
}

/**
 * Get current ISO timestamp
 */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Session ID environment variable
 */
export const SESSION_ID_ENV = "CODING_PLAN_SESSION_ID";
