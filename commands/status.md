---
description: Show Coding Plan status, quota usage, and recent jobs
argument-hint: '[job-id] [--all] [--json]'
disable-model-invocation: true
allowed-tools: Bash
---

Show the status of Coding Plan including quota usage and recent jobs.

Raw slash-command arguments:
`$ARGUMENTS`

Execution rules:
- This command is read-only
- If a job-id is provided, show details for that specific job
- Otherwise, show recent jobs and quota usage
- Always run in foreground

Status flow:
- Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" status "$ARGUMENTS"
```
- Return the command output verbatim, exactly as-is
- Do not paraphrase or add commentary

Quota information:
- 5-hour rolling window: 6,000 requests
- Weekly limit: 45,000 requests  
- Monthly limit: 90,000 requests

Examples:
```bash
/coding-plan:status
/coding-plan:status task-abc123
/coding-plan:status --all
/coding-plan:status --json
```
