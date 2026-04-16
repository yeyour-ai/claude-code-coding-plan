# Installation Guide

## Prerequisites

1. Node.js 18.0 or later
2. Alibaba Cloud Coding Plan subscription
3. Claude Code installed

## Installation Steps

### Step 1: Add Marketplace (First time only)

In Claude Code, run:

```bash
/plugin marketplace add https://github.com/yeyour-ai/claude-code-coding-plan
```

### Step 2: Install Plugin

```bash
/plugin install coding-plan
```

### Step 3: Reload Plugins

```bash
/reload-plugins
```

### Step 4: Setup Coding Plan

```bash
/coding-plan:setup --api-key sk-sp-xxxxx
```

Replace `sk-sp-xxxxx` with your Coding Plan API key from https://www.aliyun.com/benefit/scene/codingplan

## Verify Installation

Check plugin status:

```bash
/coding-plan:status
```

List available models:

```bash
/coding-plan:model
```

## Quick Start

### Code Review

```bash
/coding-plan:review
```

### Delegate Task

```bash
/coding-plan:task investigate why the tests are failing
```

### Check Status

```bash
/coding-plan:status
```

## Troubleshooting

### Plugin not found

Make sure you added the marketplace first:
```bash
/plugin marketplace add https://github.com/yeyour-ai/claude-code-coding-plan
```

### API Key invalid

Ensure your API key:
- Starts with `sk-sp-` (not just `sk-`)
- Is from Coding Plan page (not regular Bailian)
- Has not been reset or revoked

### Commands not available

Reload plugins:
```bash
/reload-plugins
```

## Available Commands

- `/coding-plan:setup` - Configure API key and model
- `/coding-plan:review` - Code review using Coding Plan models
- `/coding-plan:task` - Delegate tasks to Coding Plan
- `/coding-plan:status` - Check quota and job status
- `/coding-plan:model` - Switch models
- `/coding-plan:cancel` - Cancel background jobs

## Support

- GitHub Issues: https://github.com/yeyour-ai/claude-code-coding-plan/issues
- Documentation: See README.md
