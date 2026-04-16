import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Ensure we're in a git repository
 */
export function ensureGitRepository(cwd) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf-8" });
  
  if (result.error) {
    throw new Error("git is not installed. Install Git and retry.");
  }
  
  if (result.status !== 0) {
    throw new Error("This command must run inside a Git repository.");
  }
  
  return result.stdout.trim();
}

/**
 * Get repository root
 */
export function getRepoRoot(cwd) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf-8" });
  
  if (result.status !== 0) {
    throw new Error("Not a git repository");
  }
  
  return result.stdout.trim();
}

/**
 * Resolve review target (working tree or branch diff)
 */
export async function resolveReviewTarget(cwd, options = {}) {
  const repoRoot = ensureGitRepository(cwd);
  
  if (options.base) {
    // Branch review
    const mergeBase = spawnSync("git", ["merge-base", "HEAD", options.base], { 
      cwd, 
      encoding: "utf-8" 
    });
    
    if (mergeBase.status !== 0) {
      throw new Error(`Cannot find merge base with ${options.base}`);
    }
    
    return {
      type: "branch",
      base: options.base,
      mergeBase: mergeBase.stdout.trim(),
      commitRange: `${mergeBase.stdout.trim()}..HEAD`,
      reviewRange: `${options.base}...HEAD`
    };
  }
  
  // Working tree review
  return {
    type: "working-tree",
    base: null
  };
}

/**
 * Collect review context (git status, diffs, etc.)
 */
export async function collectReviewContext(cwd, reviewTarget) {
  const parts = [];
  
  if (reviewTarget.type === "branch") {
    // Branch diff
    const diff = spawnSync("git", [
      "diff",
      "--unified=5",
      reviewTarget.reviewRange
    ], { 
      cwd, 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    parts.push(`## Branch Diff (${reviewTarget.base}...HEAD)`);
    parts.push("```diff");
    parts.push(diff.stdout || "(no changes)");
    parts.push("```");
  } else {
    // Working tree context
    const status = spawnSync("git", [
      "status",
      "--short",
      "--untracked-files=all"
    ], { 
      cwd, 
      encoding: "utf-8" 
    });
    
    const stagedDiff = spawnSync("git", [
      "diff",
      "--cached",
      "--unified=5"
    ], { 
      cwd, 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
    });
    
    const unstagedDiff = spawnSync("git", [
      "diff",
      "--unified=5"
    ], { 
      cwd, 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
    });
    
    parts.push("## Git Status");
    parts.push("```");
    parts.push(status.stdout.trim() || "(no changes)");
    parts.push("```");
    parts.push("");
    
    parts.push("## Staged Changes");
    parts.push("```diff");
    parts.push(stagedDiff.stdout || "(no staged changes)");
    parts.push("```");
    parts.push("");
    
    parts.push("## Unstaged Changes");
    parts.push("```diff");
    parts.push(unstagedDiff.stdout || "(no unstaged changes)");
    parts.push("```");
  }
  
  return parts.join("\n");
}

/**
 * Get list of changed files
 */
export function getChangedFiles(cwd, options = {}) {
  const files = new Set();
  
  if (options.base) {
    // Branch diff files
    const result = spawnSync("git", [
      "diff",
      "--name-only",
      `${options.base}...HEAD`
    ], { cwd, encoding: "utf-8" });
    
    if (result.status === 0) {
      result.stdout.trim().split("\n").filter(Boolean).forEach(f => files.add(f));
    }
  } else {
    // Working tree files
    const status = spawnSync("git", [
      "status",
      "--short",
      "--untracked-files=all"
    ], { cwd, encoding: "utf-8" });
    
    if (status.status === 0) {
      const lines = status.stdout.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          files.add(parts[1]);
        }
      }
    }
  }
  
  return Array.from(files);
}
