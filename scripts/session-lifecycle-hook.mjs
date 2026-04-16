#!/usr/bin/env node

import process from "node:process";
import { loadConfig, getApiKey } from "./lib/config.mjs";
import { loadQuota, estimateQuotaUsage } from "./lib/state.mjs";

const event = process.argv[2];

if (!event) {
  console.error("Usage: node session-lifecycle-hook.mjs <SessionStart|SessionEnd>");
  process.exit(1);
}

async function handleSessionStart() {
  try {
    const config = loadConfig();
    const apiKey = getApiKey(config);

    if (!apiKey) {
      // Coding Plan not configured, silent exit
      process.exit(0);
    }

    // Check quota status
    const quota = loadQuota();
    const quotaEstimate = estimateQuotaUsage(quota);

    // Check if any quota is approaching limits
    const warnings = [];
    
    if (quotaEstimate.fiveHour.percentage >= 80) {
      warnings.push(`5-hour quota: ${quotaEstimate.fiveHour.percentage.toFixed(1)}% used`);
    }
    
    if (quotaEstimate.weekly.percentage >= 80) {
      warnings.push(`Weekly quota: ${quotaEstimate.weekly.percentage.toFixed(1)}% used`);
    }
    
    if (quotaEstimate.monthly.percentage >= 80) {
      warnings.push(`Monthly quota: ${quotaEstimate.monthly.percentage.toFixed(1)}% used`);
    }

    if (warnings.length > 0) {
      console.log("Coding Plan quota warnings:");
      warnings.forEach(w => console.log(`  - ${w}`));
    }

    process.exit(0);
  } catch (error) {
    // Silent failure for hooks
    process.exit(0);
  }
}

async function handleSessionEnd() {
  try {
    // Cleanup temporary files if needed
    // Log session summary if needed
    process.exit(0);
  } catch (error) {
    // Silent failure for hooks
    process.exit(0);
  }
}

async function main() {
  switch (event) {
    case "SessionStart":
      await handleSessionStart();
      break;
    case "SessionEnd":
      await handleSessionEnd();
      break;
    default:
      console.error(`Unknown event: ${event}`);
      process.exit(1);
  }
}

main();
