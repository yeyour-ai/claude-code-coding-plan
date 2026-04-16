import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 300000; // 5 minutes

/**
 * Send a request to Coding Plan API (Anthropic-compatible)
 */
export async function sendCodingPlanRequest(messages, model, options = {}) {
  const {
    apiKey,
    baseUrl,
    maxTokens = 4096,
    temperature = 0.7,
    system = null,
    onProgress = null
  } = options;

  const url = new URL(baseUrl);
  const isHttps = url.protocol === "https:";
  const client = isHttps ? https : http;

  const body = {
    model: model,
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature
  };

  if (system) {
    body.system = system;
  }

  if (options.stream && onProgress) {
    return streamRequest(client, url, apiKey, body, onProgress);
  }

  return nonStreamRequest(client, url, apiKey, body);
}

/**
 * Non-streaming request
 */
function nonStreamRequest(client, url, apiKey, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(JSON.stringify(body))
      }
    };

    const req = client.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Streaming request
 */
function streamRequest(client, url, apiKey, body, onProgress) {
  return new Promise((resolve, reject) => {
    body.stream = true;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(JSON.stringify(body))
      }
    };

    const req = client.request(options, (res) => {
      let buffer = "";
      let fullContent = "";

      res.on("data", (chunk) => {
        buffer += chunk;
        processStreamData(buffer, (event, data) => {
          if (event === "content_block_delta" && data.delta?.text) {
            fullContent += data.delta.text;
            if (onProgress) {
              onProgress(data.delta.text, fullContent);
            }
          }
        });
      });

      res.on("end", () => {
        resolve({
          content: [{ type: "text", text: fullContent }],
          role: "assistant",
          model: body.model
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Process SSE stream data
 */
function processStreamData(buffer, callback) {
  const lines = buffer.split("\n");
  
  // Keep the last line if it's incomplete
  if (!buffer.endsWith("\n")) {
    buffer = lines.pop();
  } else {
    buffer = "";
  }

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(data);
        callback(parsed.type, parsed);
      } catch (error) {
        // Skip invalid JSON
      }
    }
  }

  return buffer;
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey, baseUrl, model) {
  try {
    const response = await sendCodingPlanRequest(
      [{ role: "user", content: "Say 'OK' in one word." }],
      model,
      {
        apiKey,
        baseUrl,
        maxTokens: 10
      }
    );

    if (response.content && response.content[0]?.text) {
      return { valid: true, message: "API key is valid" };
    }

    return { valid: false, error: "Unexpected response format" };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Estimate quota usage based on request count
 * Coding Plan limits: 6000/5h, 45000/week, 90000/month
 */
export function estimateQuotaUsage(requestCounts) {
  const {
    fiveHourCount = 0,
    weeklyCount = 0,
    monthlyCount = 0
  } = requestCounts;

  return {
    fiveHour: {
      used: fiveHourCount,
      limit: 6000,
      remaining: Math.max(0, 6000 - fiveHourCount),
      percentage: (fiveHourCount / 6000) * 100
    },
    weekly: {
      used: weeklyCount,
      limit: 45000,
      remaining: Math.max(0, 45000 - weeklyCount),
      percentage: (weeklyCount / 45000) * 100
    },
    monthly: {
      used: monthlyCount,
      limit: 90000,
      remaining: Math.max(0, 90000 - monthlyCount),
      percentage: (monthlyCount / 90000) * 100
    }
  };
}

/**
 * Get list of available models
 */
export function getAvailableModels() {
  return [
    { name: "qwen3.6-plus", description: "Qwen 3.6 Plus (recommended, supports image understanding)", provider: "Qwen" },
    { name: "kimi-k2.5", description: "Kimi K2.5 (supports image understanding)", provider: "Moonshot" },
    { name: "glm-5", description: "GLM 5", provider: "Zhipu" },
    { name: "MiniMax-M2.5", description: "MiniMax M2.5", provider: "MiniMax" },
    { name: "qwen3.5-plus", description: "Qwen 3.5 Plus (supports image understanding)", provider: "Qwen" },
    { name: "qwen3-max-2026-01-23", description: "Qwen 3 Max", provider: "Qwen" },
    { name: "qwen3-coder-next", description: "Qwen 3 Coder Next", provider: "Qwen" },
    { name: "qwen3-coder-plus", description: "Qwen 3 Coder Plus", provider: "Qwen" },
    { name: "glm-4.7", description: "GLM 4.7", provider: "Zhipu" }
  ];
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, retries = MAX_RETRIES, delay = RETRY_DELAY_MS) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}
