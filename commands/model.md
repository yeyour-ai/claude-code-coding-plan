---
description: List available models or switch the default model
argument-hint: '[model-name]'
disable-model-invocation: true
allowed-tools: Bash
---

List available Coding Plan models or switch the default model.

Raw slash-command arguments:
`$ARGUMENTS`

Execution rules:
- This command manages model selection
- If no model name is provided, list all available models
- If a model name is provided, switch to that model
- Always run in foreground

Model flow:
- Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" model "$ARGUMENTS"
```
- Return the command output verbatim, exactly as-is
- Do not paraphrase or add commentary

Available models:
- qwen3.6-plus (recommended, supports image understanding)
- kimi-k2.5 (supports image understanding)
- glm-5
- MiniMax-M2.5
- qwen3.5-plus (supports image understanding)
- qwen3-max-2026-01-23
- qwen3-coder-next
- qwen3-coder-plus
- glm-4.7

Examples:
```bash
/coding-plan:model
/coding-plan:model qwen3.6-plus
/coding-plan:model qwen3-coder-next
```
