# Workflow Authoring Guide

Reference document for writing new workflow documents and agent skills for this project.
Not an invocable workflow — use this when creating or revising docs in this library.

---

## Standards this project follows

| Standard                     | Governed by                                     | What it covers                                                                 |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| AGENTS.md                    | Agentic AI Foundation (AAIF) / Linux Foundation | Project-level agent instruction file format and conventions                    |
| Model Context Protocol (MCP) | AAIF / Linux Foundation                         | Protocol for tool/resource/prompt definitions; informs documentation structure |
| Agent Skills (SKILL.md)      | Anthropic                                       | Reusable, auto-discoverable skill format for Claude Code and Claude API        |

The AAIF is a directed fund of the Linux Foundation, co-founded by Anthropic, OpenAI, and
Block. MCP and AGENTS.md were donated to the AAIF in December 2025 and are now governed as
open, vendor-neutral standards.

---

## Authoritative references

### AGENTS.md specification

**URL:** https://agents.md/

The canonical community specification for `AGENTS.md`. Key rules:

- Plain Markdown, no required schema or frontmatter
- Place the primary file at the repository root; subdirectory overrides supported
- Exact commands at the top — most impactful single pattern
- Sections commonly included: project overview, build/test commands, conventions, security,
  PR guidelines, workflow library
- Treat as living documentation; update when project constraints change

---

### Model Context Protocol specification

**URL:** https://modelcontextprotocol.io/specification/2025-11-25

The authoritative protocol spec (version 2025-11-25). Relevant to documentation structure:

- **Prompts** (templated workflows) map conceptually to the `docs/*.md` workflow documents
- Prompt objects define `name`, `description`, and `arguments` — these concepts inform how
  workflow docs should open (clear name, one-sentence purpose, stated inputs)
- **Tools** and **Resources** define capability boundaries — useful mental model for scoping
  what a workflow doc should and should not do
- Uses RFC 2119 keyword conventions (MUST / SHOULD / MAY) for constraint language

---

### Claude Agent Skills overview

**URL:** https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

Explains the SKILL.md system — how skills differ from workflow documents:

- Skills use YAML frontmatter (`name`, `description`) and are auto-discovered at startup
- Workflow docs in this project are intentionally not skills — they are agent-neutral and
  invoked explicitly, not auto-triggered
- Useful reference if the project ever needs Claude-specific auto-discoverable capabilities

---

### Claude Skill authoring best practices

**URL:** https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

Practical authoring guidance applicable to any agent documentation, not just SKILL.md:

- **Concise is key** — every token competes with conversation history; challenge each piece
  of information with "does the agent really need this?"
- **Progressive disclosure** — SKILL.md (or a workflow doc) is an overview that points to
  detail files; keep the main file under ~500 lines
- **Consistent terminology** — choose one term per concept and use it throughout
- **Description quality** — write in third person; include what the doc does AND when to use it
- **Avoid time-sensitive information** — use "current method" / "old patterns" sections instead
  of date-bounded conditionals
- **Test with representative tasks** — evaluate against real usage, not imagined requirements

---

## Conventions for this project's workflow documents

All workflow docs in `docs/` follow this consistent structure:

```
# [Short imperative title]

## Purpose
What the workflow does. What it explicitly does NOT do.

## Preparation
What to load or check before starting (e.g., read AGENTS.md, run git commands).

## Scope          (where applicable)
What files or areas to cover, and what to exclude.

## [Workflow content sections]
Numbered priorities, checklists, steps, or criteria specific to this workflow.

## Output
The required output structure — headings, format, verdict categories, etc.

## Constraints    (where applicable)
What the workflow must not do.
```

Key rules:

- Agent-neutral: no vendor-specific instructions, no Claude-only syntax
- Reference `AGENTS.md` (not `agents.md`) for project conventions
- Invoke via: `Use docs/<filename>.md and [task description].`
- Add new workflows to the Workflow Library table in `AGENTS.md`
