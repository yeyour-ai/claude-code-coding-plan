---
name: prompt-optimization
description: Optimize prompts for Coding Plan models (Qwen, GLM, Kimi, MiniMax)
user-invocable: false
---

# Prompt Optimization for Coding Plan

Use this skill to optimize user prompts before sending them to Coding Plan models.

## Prompt Compression Techniques

1. **Remove redundancy**: Eliminate repeated information or instructions
2. **Use concise language**: Replace verbose descriptions with precise technical terms
3. **Structure with headings**: Use markdown headings to organize complex requests
4. **Prioritize context**: Put the most important information first
5. **Specify constraints clearly**: Use bullet points for requirements

## Context Prioritization

Order information by importance:
1. Primary task/objective
2. Key constraints and requirements
3. Relevant context (files, functions, error messages)
4. Background information (if necessary)

## Model-Specific Formatting

### Qwen Models (qwen3.6-plus, qwen3-coder-next, etc.)
- Respond well to structured prompts with clear sections
- Use explicit formatting: "Step 1:", "Step 2:", etc.
- Specify output format expectations
- Example: "Analyze the code and provide: 1) Issues found, 2) Suggested fixes, 3) Code examples"

### GLM Models (glm-5, glm-4.7)
- Prefer direct, concise prompts
- Use natural language over excessive structure
- Specify the programming language explicitly
- Example: "Fix the Python bug in this function that causes..."

### Kimi Models (kimi-k2.5)
- Good at understanding context from longer prompts
- Can handle detailed explanations
- Use concrete examples when possible
- Example: "Refactor this code to improve performance. Current: 500ms, Target: <100ms"

### MiniMax Models (MiniMax-M2.5)
- Respond well to step-by-step instructions
- Use explicit success criteria
- Example: "Implement feature X. Success criteria: 1) Passes all tests, 2) No regressions, 3) Documented"

## Token Usage Optimization

1. **Avoid verbose examples**: Use minimal reproducible examples
2. **Skip obvious context**: Don't include information the model already knows
3. **Use references**: Reference files/functions instead of pasting full content
4. **Set clear scope**: Specify what to focus on and what to ignore

## Prompt Template

```
# Task
[Clear, concise statement of what needs to be done]

# Context
[Essential background information]

# Constraints
- [Requirement 1]
- [Requirement 2]

# Success Criteria
- [Criterion 1]
- [Criterion 2]

# Output Format
[Specify how the response should be structured]
```

## Usage Rules

- Only use this skill to shape the forwarded prompt text
- Do not use this skill to inspect the repository or reason through the problem
- Do not draft solutions or do any independent work beyond shaping the prompt
- Preserve the user's original intent completely
- Apply optimizations that reduce token usage without losing meaning
