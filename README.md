# Coding Plan Plugin for Claude Code

Use Alibaba Bailian Coding Plan from inside Claude Code for code reviews or to delegate tasks to various AI models.

This plugin enables Claude Code users to leverage Alibaba's Coding Plan subscription service, providing access to top-tier models including Qwen, GLM, Kimi, and MiniMax at a fixed monthly cost.

## What You Get

- `/coding-plan:setup` for configuring your Coding Plan API key and default model
- `/coding-plan:review` for code reviews using Coding Plan models
- `/coding-plan:task` for delegating tasks to Coding Plan models
- `/coding-plan:status` for checking quota usage and job history
- `/coding-plan:model` for switching between available models
- `/coding-plan:cancel` for cancelling background jobs

## Requirements

- **Alibaba Cloud Coding Plan subscription.**
  - Subscribe at the [Coding Plan page](https://www.aliyun.com/benefit/scene/codingplan)
  - Usage will consume your Coding Plan quota (6,000 requests/5h, 45,000/week, 90,000/month)
- **Node.js 18.0 or later**

## Available Models

Coding Plan provides access to multiple top-tier models:

- **qwen3.6-plus** (recommended, supports image understanding)
- **kimi-k2.5** (supports image understanding)
- **glm-5**
- **MiniMax-M2.5**
- **qwen3.5-plus** (supports image understanding)
- **qwen3-max-2026-01-23**
- **qwen3-coder-next**
- **qwen3-coder-plus**
- **glm-4.7**

## Install

Install the plugin in Claude Code:

```bash
/plugin install coding-plan
```

Reload plugins:

```bash
/reload-plugins
```

Then run:

```bash
/coding-plan:setup --api-key sk-sp-xxxxx
```

Replace `sk-sp-xxxxx` with your Coding Plan专属 API Key from the [Coding Plan page](https://www.aliyun.com/benefit/scene/codingplan).

## Setup

### Get Your API Key

1. Visit the [Coding Plan page](https://www.aliyun.com/benefit/scene/codingplan)
2. Subscribe to a plan (Pro plan recommended)
3. Copy your专属 API Key (format: `sk-sp-xxxxx`)
4. Note the专属 Base URL: `https://coding.dashscope.aliyuncs.com/apps/anthropic`

**Important**: Do not confuse the Coding Plan API key (`sk-sp-xxxxx`) with the regular Bailian API key (`sk-xxxxx`). They are not interchangeable.

### Configure the Plugin

```bash
/coding-plan:setup --api-key sk-sp-xxxxx --model qwen3.6-plus
```

This will:
- Validate your API key format
- Test the connection to Coding Plan
- Set your default model
- Save the configuration to `~/.coding-plan/config.json`

### Verify Setup

```bash
/coding-plan:status
```

This shows your current configuration and quota usage.

## Usage

### `/coding-plan:review`

Runs a code review using your configured Coding Plan model on your current work.

Use it when you want:
- A review of your current uncommitted changes
- A review of your branch compared to a base branch like `main`

Use `--base <ref>` for branch review. It also supports `--wait` and `--background`.

Examples:

```bash
/coding-plan:review
/coding-plan:review --base main
/coding-plan:review --background
/coding-plan:review --model qwen3-coder-next
```

This command is read-only and will not perform any changes. When run in the background you can use [`/coding-plan:status`](#coding-planstatus) to check on the progress and [`/coding-plan:cancel`](#coding-plancancel) to cancel the ongoing task.

### `/coding-plan:task`

Delegates a task to Coding Plan models.

Use it when you want Coding Plan to:
- Investigate a bug
- Try a fix
- Refactor code
- Implement a feature
- Continue a previous task

It supports `--background`, `--wait`, `--model`, `--effort`, `--resume`, and `--fresh`.

Examples:

```bash
/coding-plan:task investigate why the tests started failing
/coding-plan:task fix the failing test with the smallest safe patch
/coding-plan:task --resume apply the top fix from the last run
/coding-plan:task --model qwen3-coder-next --effort high optimize the database queries
/coding-plan:task --background investigate the regression
```

**Notes:**

- If you do not pass `--model`, the plugin uses your configured default model
- Follow-up task requests can continue the latest Coding Plan work in the repo
- `--effort` controls reasoning effort: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`

### `/coding-plan:status`

Shows running and recent Coding Plan jobs for the current repository, plus quota usage.

Examples:

```bash
/coding-plan:status
/coding-plan:status task-abc123
/coding-plan:status --all
```

Use it to:
- Check progress on background work
- See the latest completed job
- Confirm whether a task is still running
- Monitor your quota usage (5-hour, weekly, monthly)

### `/coding-plan:model`

Lists available models or switches the default model.

Examples:

```bash
/coding-plan:model
/coding-plan:model qwen3.6-plus
/coding-plan:model qwen3-coder-next
```

### `/coding-plan:cancel`

Cancels an active background Coding Plan job.

Examples:

```bash
/coding-plan:cancel
/coding-plan:cancel task-abc123
```

### `/coding-plan:setup`

Manages Coding Plan configuration.

```bash
/coding-plan:setup --api-key sk-sp-xxxxx
/coding-plan:setup --model qwen3-coder-next
/coding-plan:setup --reset
```

## Quota Management

Coding Plan has three quota windows:

- **5-hour rolling**: 6,000 requests (resets continuously)
- **Weekly**: 45,000 requests (resets every Monday 00:00 UTC+8)
- **Monthly**: 90,000 requests (resets on subscription date)

The plugin tracks your usage locally and warns you when approaching limits (80% threshold).

### Estimate Request Costs

- Simple tasks: ~5-10 requests
- Complex tasks: ~10-30+ requests
- Code reviews: ~5-15 requests depending on change size

### Check Quota Status

```bash
/coding-plan:status
```

Look for the "Quota Usage" section to see your current consumption.

## Typical Flows

### Review Before Shipping

```bash
/coding-plan:review
```

### Hand A Problem To Coding Plan

```bash
/coding-plan:task investigate why the build is failing in CI
```

### Start Something Long-Running

```bash
/coding-plan:review --background
/coding-plan:task --background investigate the flaky test
```

Then check in with:

```bash
/coding-plan:status
```

### Switch Models for Different Tasks

```bash
/coding-plan:model qwen3-coder-next
/coding-plan:task optimize this algorithm

/coding-plan:model kimi-k2.5
/coding-plan:review --base main
```

## Configuration

### Config File Location

- User-level: `~/.coding-plan/config.json`
- Project-level: `.coding-plan/config.json`

### Configuration Schema

```json
{
  "apiKey": "sk-sp-xxxxx",
  "baseUrl": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
  "defaultModel": "qwen3.6-plus",
  "usageTracking": true,
  "quotaWarnings": {
    "fiveHour": 0.8,
    "weekly": 0.8,
    "monthly": 0.8
  }
}
```

### Environment Variables

The plugin respects these environment variables:

- `ANTHROPIC_AUTH_TOKEN`: Coding Plan API key (overrides config)
- `ANTHROPIC_BASE_URL`: Base URL (overrides config)
- `ANTHROPIC_MODEL`: Default model (overrides config)

## FAQ

### Do I need a separate Coding Plan subscription?

Yes. This plugin requires an active Alibaba Cloud Coding Plan subscription. [Subscribe here](https://www.aliyun.com/benefit/scene/codingplan).

### Will it use my existing Bailian API key?

No. Coding Plan uses a专属 API key (`sk-sp-xxxxx`) that is separate from the regular Bailian API key (`sk-xxxxx`). Do not mix them up.

### Can I use different models for different tasks?

Yes. Use `/coding-plan:model <model-name>` to switch models, or specify `--model` with individual commands.

### How do I know how much quota I have left?

Run `/coding-plan:status` to see your current quota usage for all three windows (5-hour, weekly, monthly).

### What happens when I exceed my quota?

Requests will fail until the quota window resets. The plugin warns you at 80% usage to help you plan accordingly.

### Can I use this plugin for automated API calls?

No. Coding Plan's terms of service prohibit using the API key for automated scripts or non-interactive batch calls. Only use it through interactive tools like Claude Code.

### Is my code sent to Alibaba Cloud?

Yes. Code sent to Coding Plan models will be processed on Alibaba Cloud servers. Review the [Alibaba Cloud service agreement](https://www.aliyun.com) for data usage policies.

## Troubleshooting

### API Key Validation Failed

Ensure your API key:
- Starts with `sk-sp-` (not just `sk-`)
- Is from the Coding Plan page (not regular Bailian)
- Has not been reset or revoked

### Connection Errors

Check:
- Your internet connection
- The base URL is `https://coding.dashscope.aliyuncs.com/apps/anthropic`
- No firewall blocking the connection

### Model Not Found

Verify:
- The model name is exactly as listed in the available models
- The model is included in your Coding Plan tier (qwen3.6-plus requires Pro plan)

### Quota Exceeded

Wait for the quota window to reset:
- 5-hour quota: resets continuously (5 hours after each request)
- Weekly quota: resets every Monday 00:00 (UTC+8)
- Monthly quota: resets on your subscription date

## License

Apache-2.0

## Support

For issues with:
- **Plugin**: File an issue in the plugin repository
- **Coding Plan subscription**: Contact Alibaba Cloud support
- **Model quality**: Provide feedback through the Coding Plan console
