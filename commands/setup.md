---
description: Set up and configure Alibaba Coding Plan
argument-hint: '[--api-key <key>] [--model <model>] [--reset]'
disable-model-invocation: true
allowed-tools: Bash
---

Configure the Alibaba Coding Plan integration.

Raw slash-command arguments:
`$ARGUMENTS`

Execution rules:
- This command configures the Coding Plan API key and default model
- If `--api-key` is provided, validate and save it
- If `--model` is provided, set it as the default model
- If `--reset` is provided, clear all configuration
- Always run in foreground

Setup flow:
- Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" setup "$ARGUMENTS"
```
- Return the command output verbatim, exactly as-is
- Do not paraphrase or add commentary

Configuration notes:
- Coding Plan API keys start with `sk-sp-`
- Base URL is fixed to `https://coding.dashscope.aliyuncs.com/apps/anthropic`
- Available models: qwen3.6-plus, kimi-k2.5, glm-5, MiniMax-M2.5, qwen3.5-plus, qwen3-max-2026-01-23, qwen3-coder-next, qwen3-coder-plus, glm-4.7

Examples:
```bash
/coding-plan:setup --api-key sk-sp-xxxxx
/coding-plan:setup --api-key sk-sp-xxxxx --model qwen3.6-plus
/coding-plan:setup --model qwen3-coder-next
/coding-plan:setup --reset
```
