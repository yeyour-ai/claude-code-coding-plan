---
description: Cancel an active background Coding Plan job
argument-hint: '[job-id]'
disable-model-invocation: true
allowed-tools: Bash
---

Cancel an active background Coding Plan job.

Raw slash-command arguments:
`$ARGUMENTS`

Execution rules:
- This command cancels running jobs
- If a job-id is provided, cancel that specific job
- If no job-id is provided, cancel the latest active job
- Always run in foreground

Cancel flow:
- Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" cancel "$ARGUMENTS"
```
- Return the command output verbatim, exactly as-is
- Do not paraphrase or add commentary

Notes:
- Only running or pending jobs can be cancelled
- Already completed, failed, or cancelled jobs cannot be cancelled again
- Cancellation is immediate and cannot be undone

Examples:
```bash
/coding-plan:cancel
/coding-plan:cancel task-abc123
```
