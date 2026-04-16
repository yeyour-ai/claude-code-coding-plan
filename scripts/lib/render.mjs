/**
 * Render setup report
 */
export function renderSetupReport(config, validationStatus) {
  const lines = [];
  
  lines.push("Coding Plan Configuration Status");
  lines.push("=".repeat(40));
  lines.push("");
  
  lines.push(`API Key: ${config.apiKey ? `${config.apiKey.substring(0, 10)}...${config.apiKey.substring(config.apiKey.length - 4)}` : "Not configured"}`);
  lines.push(`Base URL: ${config.baseUrl}`);
  lines.push(`Default Model: ${config.defaultModel}`);
  lines.push(`Usage Tracking: ${config.usageTracking ? "Enabled" : "Disabled"}`);
  lines.push("");
  
  if (validationStatus) {
    lines.push(`Validation: ${validationStatus.valid ? "✓ Valid" : "✗ Invalid"}`);
    if (validationStatus.message) {
      lines.push(`Message: ${validationStatus.message}`);
    }
    if (validationStatus.error) {
      lines.push(`Error: ${validationStatus.error}`);
    }
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render status report
 */
export function renderStatusReport(jobs, quota) {
  const lines = [];
  
  lines.push("Coding Plan Status");
  lines.push("=".repeat(40));
  lines.push("");
  
  // Quota information
  if (quota) {
    lines.push("Quota Usage:");
    lines.push(`  5-hour:   ${quota.fiveHour.used}/${quota.fiveHour.limit} (${quota.fiveHour.percentage.toFixed(1)}%) - ${quota.fiveHour.remaining} remaining`);
    lines.push(`  Weekly:   ${quota.weekly.used}/${quota.weekly.limit} (${quota.weekly.percentage.toFixed(1)}%) - ${quota.weekly.remaining} remaining`);
    lines.push(`  Monthly:  ${quota.monthly.used}/${quota.monthly.limit} (${quota.monthly.percentage.toFixed(1)}%) - ${quota.monthly.remaining} remaining`);
    lines.push("");
  }
  
  // Jobs
  lines.push(`Recent Jobs (${jobs.length}):`);
  lines.push("");
  
  if (jobs.length === 0) {
    lines.push("  No jobs found.");
  } else {
    for (const job of jobs) {
      const statusIcon = job.status === "completed" ? "✓" : 
                         job.status === "failed" ? "✗" : 
                         job.status === "cancelled" ? "⊘" : "⟳";
      
      lines.push(`  ${statusIcon} ${job.id}`);
      lines.push(`    Type: ${job.type}`);
      lines.push(`    Model: ${job.model}`);
      lines.push(`    Status: ${job.status}`);
      lines.push(`    Started: ${new Date(job.startTime).toLocaleString()}`);
      
      if (job.endTime) {
        lines.push(`    Ended: ${new Date(job.endTime).toLocaleString()}`);
      }
      
      lines.push(`    Requests: ${job.requestCount}`);
      lines.push("");
    }
  }
  
  return lines.join("\n");
}

/**
 * Render single job status
 */
export function renderJobStatus(job) {
  const lines = [];
  
  lines.push(`Job: ${job.id}`);
  lines.push("=".repeat(40));
  lines.push(`Type: ${job.type}`);
  lines.push(`Model: ${job.model}`);
  lines.push(`Status: ${job.status}`);
  lines.push(`Started: ${new Date(job.startTime).toLocaleString()}`);
  
  if (job.endTime) {
    lines.push(`Ended: ${new Date(job.endTime).toLocaleString()}`);
  }
  
  lines.push(`Requests: ${job.requestCount}`);
  lines.push(`Background: ${job.background ? "Yes" : "No"}`);
  lines.push("");
  
  if (job.prompt) {
    lines.push("Prompt:");
    lines.push(job.prompt.substring(0, 200) + (job.prompt.length > 200 ? "..." : ""));
    lines.push("");
  }
  
  if (job.result) {
    lines.push("Result:");
    lines.push(job.result);
  }
  
  if (job.error) {
    lines.push("Error:");
    lines.push(job.error);
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render review result
 */
export function renderReviewResult(review) {
  const lines = [];
  
  lines.push("Code Review Result");
  lines.push("=".repeat(40));
  lines.push("");
  
  if (typeof review === "string") {
    lines.push(review);
  } else if (review.content) {
    lines.push(review.content);
  } else {
    lines.push(JSON.stringify(review, null, 2));
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render task result
 */
export function renderTaskResult(result) {
  const lines = [];
  
  lines.push("Task Result");
  lines.push("=".repeat(40));
  lines.push("");
  
  if (typeof result === "string") {
    lines.push(result);
  } else if (result.content) {
    lines.push(result.content);
  } else if (result.message) {
    lines.push(result.message);
  } else {
    lines.push(JSON.stringify(result, null, 2));
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render cancel report
 */
export function renderCancelReport(cancelResult) {
  const lines = [];
  
  lines.push("Cancellation Report");
  lines.push("=".repeat(40));
  lines.push("");
  
  lines.push(`Job ID: ${cancelResult.jobId}`);
  lines.push(`Status: ${cancelResult.success ? "Cancelled" : "Failed"}`);
  
  if (cancelResult.message) {
    lines.push(`Message: ${cancelResult.message}`);
  }
  
  if (cancelResult.error) {
    lines.push(`Error: ${cancelResult.error}`);
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render model list
 */
export function renderModelList(models, currentModel) {
  const lines = [];
  
  lines.push("Available Models");
  lines.push("=".repeat(40));
  lines.push("");
  
  for (const model of models) {
    const isCurrent = model.name === currentModel;
    const prefix = isCurrent ? "→ " : "  ";
    const suffix = isCurrent ? " (current)" : "";
    
    lines.push(`${prefix}${model.name}${suffix}`);
    lines.push(`   ${model.description}`);
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Render quota warning
 */
export function renderQuotaWarning(quota, thresholds) {
  const warnings = [];
  
  if (quota.fiveHour.percentage >= thresholds.fiveHour * 100) {
    warnings.push(`⚠ 5-hour quota usage is at ${quota.fiveHour.percentage.toFixed(1)}%`);
  }
  
  if (quota.weekly.percentage >= thresholds.weekly * 100) {
    warnings.push(`⚠ Weekly quota usage is at ${quota.weekly.percentage.toFixed(1)}%`);
  }
  
  if (quota.monthly.percentage >= thresholds.monthly * 100) {
    warnings.push(`⚠ Monthly quota usage is at ${quota.monthly.percentage.toFixed(1)}%`);
  }
  
  if (warnings.length > 0) {
    return "\n" + warnings.join("\n") + "\n";
  }
  
  return "";
}

/**
 * Render error message
 */
export function renderError(message, details = null) {
  const lines = [];
  
  lines.push(`Error: ${message}`);
  
  if (details) {
    lines.push("");
    lines.push("Details:");
    lines.push(details);
  }
  
  lines.push("");
  return lines.join("\n");
}
