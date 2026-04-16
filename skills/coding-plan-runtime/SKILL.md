---
name: coding-plan-runtime
description: Internal helper contract for calling the coding-plan-companion runtime from Claude Code
user-invocable: false
---

# Coding Plan Runtime

Use this skill only inside the `coding-plan:coding-plan-task` subagent.

Primary helper:
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/coding-plan-companion.mjs" task "<raw arguments>"`

Execution rules:
- The task subagent is a forwarder, not an orchestrator. Its only job is to invoke `task` once and return that stdout unchanged.
- Prefer the helper over hand-rolled API calls or any other Bash activity.
- Do not call `setup`, `review`, `status`, `model`, or `cancel` from `coding-plan:coding-plan-task`.
- Use `task` for every delegation request, including diagnosis, planning, research, and explicit fix requests.
- You may use the `prompt-optimization` skill to rewrite the user's request into a tighter Coding Plan prompt before the single `task` call.
- That prompt drafting is the only Claude-side work allowed. Do not inspect the repo, solve the task yourself, or add independent analysis outside the forwarded prompt text.
- Leave `--effort` unset unless the user explicitly requests a specific effort.
- Leave model unset by default. Add `--model` only when the user explicitly asks for one.

Command selection:
- Use exactly one `task` invocation per delegation handoff.
- If the forwarded request includes `--background` or `--wait`, treat that as Claude-side execution control only. Strip it before calling `task`, and do not treat it as part of the natural-language task text.
- If the forwarded request includes `--model`, pass it through to `task`.
- If the forwarded request includes `--effort`, pass it through to `task`.
- If the forwarded request includes `--resume`, strip that token from the task text and continue the latest task.
- If the forwarded request includes `--fresh`, strip that token from the task text and start a fresh run.
- `--resume`: always continue the latest task, even if the request text is ambiguous.
- `--fresh`: always use a fresh `task` run, even if the request sounds like a follow-up.
- `--effort`: accepted values are `none`, `minimal`, `low`, `medium`, `high`, `xhigh`.

Safety rules:
- Default to write-capable Coding Plan work in `coding-plan:coding-plan-task` unless the user explicitly asks for read-only behavior.
- Preserve the user's task text as-is apart from stripping routing flags.
- Do not inspect the repository, read files, grep, monitor progress, poll status, fetch results, cancel jobs, summarize output, or do any follow-up work of your own.
- Return the stdout of the `task` command exactly as-is.
- If the Bash call fails or Coding Plan cannot be invoked, return nothing.
