import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CODING_PLAN_DIR = path.join(os.homedir(), ".coding-plan");
const CONFIG_FILE = path.join(CODING_PLAN_DIR, "config.json");
const PROJECT_CONFIG_FILE = ".coding-plan/config.json";

const DEFAULT_CONFIG = {
  apiKey: "",
  baseUrl: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
  defaultModel: "qwen3.6-plus",
  usageTracking: true,
  quotaWarnings: {
    fiveHour: 0.8,
    weekly: 0.8,
    monthly: 0.8
  }
};

const VALID_MODELS = new Set([
  "qwen3.6-plus",
  "kimi-k2.5",
  "glm-5",
  "MiniMax-M2.5",
  "qwen3.5-plus",
  "qwen3-max-2026-01-23",
  "qwen3-coder-next",
  "qwen3-coder-plus",
  "glm-4.7"
]);

/**
 * Load configuration from user-level or project-level config
 */
export function loadConfig(workspaceRoot = null) {
  // Try project-level config first
  if (workspaceRoot) {
    const projectConfigPath = path.join(workspaceRoot, PROJECT_CONFIG_FILE);
    if (fs.existsSync(projectConfigPath)) {
      try {
        const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, "utf-8"));
        return { ...DEFAULT_CONFIG, ...projectConfig };
      } catch (error) {
        console.error(`Warning: Failed to parse project config: ${error.message}`);
      }
    }
  }

  // Fall back to user-level config
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch (error) {
      console.error(`Warning: Failed to parse user config: ${error.message}`);
    }
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to user-level config
 */
export function saveConfig(config) {
  if (!fs.existsSync(CODING_PLAN_DIR)) {
    fs.mkdirSync(CODING_PLAN_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Validate API key format (should be sk-sp-xxxxx)
 */
export function validateApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, error: "API key is required" };
  }

  if (!apiKey.startsWith("sk-sp-")) {
    return { valid: false, error: "Invalid API key format. Coding Plan API keys start with 'sk-sp-'" };
  }

  if (apiKey.length < 10) {
    return { valid: false, error: "API key is too short" };
  }

  return { valid: true };
}

/**
 * Validate model name
 */
export function validateModel(model) {
  if (!model) {
    return { valid: false, error: "Model name is required" };
  }

  if (!VALID_MODELS.has(model)) {
    return {
      valid: false,
      error: `Invalid model '${model}'. Valid models: ${Array.from(VALID_MODELS).join(", ")}`
    };
  }

  return { valid: true };
}

/**
 * Get the current API key from config or environment
 */
export function getApiKey(config = null) {
  if (!config) {
    config = loadConfig();
  }

  // Check environment variable first
  const envApiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  if (envApiKey && envApiKey.startsWith("sk-sp-")) {
    return envApiKey;
  }

  return config.apiKey;
}

/**
 * Get the base URL from config or environment
 */
export function getBaseUrl(config = null) {
  if (!config) {
    config = loadConfig();
  }

  // Check environment variable first
  const envBaseUrl = process.env.ANTHROPIC_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  return config.baseUrl;
}

/**
 * Get the model to use (from args, config, or environment)
 */
export function getModel(requestedModel = null, config = null) {
  if (!config) {
    config = loadConfig();
  }

  // Check environment variable
  const envModel = process.env.ANTHROPIC_MODEL;
  if (envModel && VALID_MODELS.has(envModel)) {
    return envModel;
  }

  // Check requested model
  if (requestedModel && VALID_MODELS.has(requestedModel)) {
    return requestedModel;
  }

  // Fall back to config default
  return config.defaultModel;
}

/**
 * Initialize config with API key
 */
export function initializeConfig(apiKey, model = null) {
  const config = loadConfig();
  config.apiKey = apiKey;

  if (model) {
    const validation = validateModel(model);
    if (!validation.valid) {
      return validation;
    }
    config.defaultModel = model;
  }

  saveConfig(config);
  return { valid: true };
}

/**
 * Reset configuration
 */
export function resetConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Get config file path
 */
export function getConfigPath() {
  return CONFIG_FILE;
}
