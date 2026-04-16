---
description: Delegate a task to Coding Plan models
argument-hint: '[--background] [--model <model>] [--effort <level>] [--resume|--fresh] [prompt]'
disable-model-invocation: true
allowed-tools: Bash
---

Delegate a task to Alibaba Coding Plan models.

Raw slash-command arguments:
`$ARGUMENTS`

Execution rules:
- This command forwards tasks to Coding Plan for execution
- A prompt is required unless `--resume` is specified
- Supports background and foreground execution
- Can continue previous tasks with `--resume` or start fresh with `--fresh`

Argument handling:
- Preserve the user's prompt text exactly
- Treat `--background`, `--model`, `--effort`, `--resume`, and `--fresh` as routing controls
- Do not include routing flags in the task text passed to Coding Plan

Execution mode rules:
- If the raw arguments include `--background`, run in background mode
- Otherwise, run in foreground mode

Foreground flow:
- Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" task "$ARGUMENTS"
```
- Return the command stdout verbatim, exactly as-is
- Do not paraphrase, summarize, or add commentary before or after it

Background flow:
- Launch the task with `Bash` in the background:
```typescript
Bash({
  command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" task "$ARGUMENTS"`,
  description: "Coding Plan task",
  run_in_background: true
})
```
- Do not call `BashOutput` or wait for completion in this turn
- After launching the command, tell the user: "Coding Plan task started in the background. Check `/coding-plan:status` for progress."

Command selection:
- Use `--model` to specify a particular model (qwen3.6-plus, qwen3-coder-next, etc.)
- Use `--effort` to control reasoning effort (none, minimal, low, medium, high, xhigh)
- Use `--resume` to continue the latest task
- Use `--fresh` to start a new task even if one exists

Safety rules:
- Default to write-capable mode unless the user explicitly asks for read-only behavior
- Preserve the user's task text as-is apart from stripping routing flags
- Do not inspect the repository or do any independent work beyond forwarding the task

Examples:
```bash
/coding-plan:task refactor the authentication module to use JWT tokens
/coding-plan:task --background investigate why the tests are failing
/coding-plan:task --model qwen3-coder-next --effort high optimize the database queries
/coding-plan:task --resume apply the top fix from the last run
/coding-plan:task --fresh start a new implementation
```
