import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const CODING_PLAN_DIR = path.join(os.homedir(), ".coding-plan");
const JOBS_DIR = path.join(CODING_PLAN_DIR, "jobs");
const QUOTA_FILE = path.join(CODING_PLAN_DIR, "quota.json");

/**
 * Generate a unique job ID
 */
export function generateJobId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex");
  return `cp-${timestamp}-${random}`;
}

/**
 * Initialize jobs directory
 */
function ensureJobsDir() {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

/**
 * Create a new job record
 */
export function createJobRecord(type, model, prompt, options = {}) {
  const jobId = generateJobId();
  const job = {
    id: jobId,
    type, // "review" or "task"
    model,
    status: "pending", // pending, running, completed, failed, cancelled
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
 * Save job to file
 */
export function saveJob(job) {
  ensureJobsDir();
  const jobFile = path.join(JOBS_DIR, `${job.id}.json`);
  
  try {
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2), "utf-8");
  } catch (error) {
    // If directory doesn't exist, recreate it
    if (error.code === 'ENOENT') {
      fs.mkdirSync(JOBS_DIR, { recursive: true });
      fs.writeFileSync(jobFile, JSON.stringify(job, null, 2), "utf-8");
    } else {
      throw error;
    }
  }
}

/**
 * Load job from file
 */
export function loadJob(jobId) {
  const jobFile = path.join(JOBS_DIR, `${jobId}.json`);
  
  if (!fs.existsSync(jobFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(jobFile, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load job ${jobId}: ${error.message}`);
    return null;
  }
}

/**
 * Update job status
 */
export function updateJobStatus(jobId, status, updates = {}) {
  const job = loadJob(jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.status = status;
  Object.assign(job, updates);

  if (status === "completed" || status === "failed" || status === "cancelled") {
    job.endTime = new Date().toISOString();
  }

  saveJob(job);
  return job;
}

/**
 * List all jobs
 */
export function listJobs(options = {}) {
  ensureJobsDir();
  
  const {
    limit = 20,
    status = null,
    type = null,
    all = false
  } = options;

  const files = fs.readdirSync(JOBS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .reverse();

  const jobs = [];
  
  for (const file of files) {
    if (jobs.length >= limit && !all) {
      break;
    }

    const jobFile = path.join(JOBS_DIR, file);
    try {
      const content = fs.readFileSync(jobFile, "utf-8");
      const job = JSON.parse(content);

      if (status && job.status !== status) {
        continue;
      }

      if (type && job.type !== type) {
        continue;
      }

      jobs.push(job);
    } catch (error) {
      console.error(`Failed to load job file ${file}: ${error.message}`);
    }
  }

  return jobs;
}

/**
 * Find the latest job
 */
export function findLatestJob(type = null) {
  const jobs = listJobs({ limit: 1, type });
  return jobs.length > 0 ? jobs[0] : null;
}

/**
 * Load quota tracking data
 */
export function loadQuota() {
  if (!fs.existsSync(QUOTA_FILE)) {
    return {
      fiveHourCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      lastReset: {
        fiveHour: Date.now(),
        weekly: Date.now(),
        monthly: Date.now()
      }
    };
  }

  try {
    const content = fs.readFileSync(QUOTA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load quota: ${error.message}`);
    return {
      fiveHourCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      lastReset: {
        fiveHour: Date.now(),
        weekly: Date.now(),
        monthly: Date.now()
      }
    };
  }
}

/**
 * Save quota tracking data
 */
export function saveQuota(quota) {
  if (!fs.existsSync(CODING_PLAN_DIR)) {
    fs.mkdirSync(CODING_PLAN_DIR, { recursive: true });
  }

  fs.writeFileSync(QUOTA_FILE, JSON.stringify(quota, null, 2), "utf-8");
}

/**
 * Increment request count
 */
export function incrementRequestCount(count = 1) {
  const quota = loadQuota();
  
  // Reset counters if needed
  resetQuotaIfNeeded(quota);
  
  quota.fiveHourCount += count;
  quota.weeklyCount += count;
  quota.monthlyCount += count;
  
  saveQuota(quota);
  return quota;
}

/**
 * Reset quota counters if time windows have passed
 */
function resetQuotaIfNeeded(quota) {
  const now = Date.now();
  
  // Reset 5-hour counter (5 hours = 18000000 ms)
  if (now - quota.lastReset.fiveHour >= 18000000) {
    quota.fiveHourCount = 0;
    quota.lastReset.fiveHour = now;
  }
  
  // Reset weekly counter (7 days = 604800000 ms)
  if (now - quota.lastReset.weekly >= 604800000) {
    quota.weeklyCount = 0;
    quota.lastReset.weekly = now;
  }
  
  // Reset monthly counter (30 days = 2592000000 ms)
  if (now - quota.lastReset.monthly >= 2592000000) {
    quota.monthlyCount = 0;
    quota.lastReset.monthly = now;
  }
}

/**
 * Get job file path
 */
export function getJobFilePath(jobId) {
  return path.join(JOBS_DIR, `${jobId}.json`);
}

/**
 * Delete a job
 */
export function deleteJob(jobId) {
  const jobFile = getJobFilePath(jobId);
  
  if (fs.existsSync(jobFile)) {
    fs.unlinkSync(jobFile);
    return true;
  }
  
  return false;
}
