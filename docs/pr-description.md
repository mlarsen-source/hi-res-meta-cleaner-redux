# PR Description Generator

## Purpose

Generates PR-ready text — a one-paragraph summary, a grouped file-by-file change list, a
change-overview table, and linked issue callouts — based strictly on the final diff between the
current branch and `main`. Output is formatted for direct paste into a GitHub PR description.

**Does not:** review code quality, flag issues, make recommendations, or describe anything not
visible in the final diff.

---

## Context isolation (must happen first)

This workflow operates on the final diff only. Prior conversation, earlier commits, or
approaches that were tried and abandoned must not influence the output. PR reviewers see only
the final diff.

Before doing anything else:

1. **Discard prior context.** Do not reference anything from previous conversation turns.
   Treat the final diff as the only source of truth.
2. **Re-fetch the diff fresh** against `main`. Do not rely on a diff viewed earlier.
3. **Verify before mentioning.** If something (a file, function, behavior) is not in the
   freshly fetched diff, it does not exist for the purposes of this output.

If running inside a longer conversation, start by explicitly acknowledging the reset:
_"Re-fetching the final diff against main and ignoring prior conversation context."_

---

## Pre-generation phase

Before producing any output, complete this phase. Structure: **explain → run → report → confirm**.

**Announce upfront** what you are about to check:

> _"Before generating, I'll run a few git checks to confirm the diff target, whether this branch
> depends on another branch merging first, and whether there are any linked GitHub issues."_

**Then run:**

```bash
git branch --show-current
git rev-parse origin/main
git merge-base origin/main HEAD
git log --oneline origin/main..HEAD
```

**From the output, determine as facts — do not ask the developer to confirm these:**

- **Target branch:** always `main`
- **Branch base:** compare the `merge-base` SHA to `git rev-parse origin/main`. If equal, no
  dependency. If not equal, run `git branch -r --points-at <merge-base-sha>` to identify the
  dependency branch.
- **Linked issues:** scan the branch name and commit messages for GitHub issue patterns (`#NNN`
  or `GH-NNN`). If found, record them. If none found, record as none.

**Report findings in a single message.** Example:

> _"Findings: target is main · branch was created from main directly (no dependencies) ·
> issue detected: #42 · no additional issue references in commits."_

**Then ask one question only** — the only thing git cannot tell you:
_"Are there any additional issues to link beyond #42, or is that complete?"_
If no issues were detected: _"Are there any GitHub issues to link, or should this PR have none?"_

---

## Strict rules

- Use only the final diff between the current branch and `main`
- Do not mention anything added and later removed — reviewers only see the final diff
- Do not speculate, infer intent, or describe possible behavior
- Do not mention files, functions, or details not in the final diff
- **The file-by-file changes section is mandatory.** Every file gets its own bullet. Every
  bullet states both what changed and why. Never omit, batch, or collapse files.
- **The change-overview table is mandatory.** Columns are chosen to fit the actual work in the
  diff — do not force an API-style table onto non-API work.
- **No test plan section.** Testing is the developer's responsibility before submission.
- When generating output, return exactly one markdown code block and nothing else.

---

## Required output format

```md
## PR title

type: Short descriptive title

<!-- With a linked issue: "fix #42: Short descriptive title" -->
<!-- type follows: feat, fix, chore, refactor, docs, ci, test -->
<!-- Omit "Depends on" if no dependencies -->
<!-- Omit "Linked issues" if no issues -->
<!-- Omit "Target branch" — this project always targets main -->

## Depends on

- #<PR number or branch> — <one sentence on why this PR must merge first>

## Linked issues

- #NNN — <optional short description>

## Summary

<one paragraph only, maximum 4 sentences, naming specific files/systems/behaviors changed>

## <Heading chosen to fit the work — e.g. "Files changed", "Routes wired up", "Config changes">

| <Column A> | <Column B> | <Column C if needed> |
| ---------- | ---------- | -------------------- |
| <cell>     | <cell>     | <cell>               |

## File-by-file changes

### <Group name>

- `path/to/file.ext`: <what changed and why it was necessary>

### <Next group name>

- `path/to/file.ext`: <what changed and why it was necessary>
```

---

## Formatting requirements

### PR title

- Plain text, no backticks. With a linked issue use `fix #42: Short title`. Without an issue
  use `type: Short title`.
- `type`: `feat`, `fix`, `chore`, `refactor`, `docs`, `ci`, `test`
- Max ~70 characters total
- This line is pasted directly as the GitHub PR title

### Depends on

- Omit entirely if no dependencies. Do not write "None."
- One bullet per dependency; include the branch or PR number and a one-sentence reason.

### Linked issues

- Omit entirely if no linked issues. Do not write "None."
- One bullet per issue. GitHub will auto-close issues prefixed with `closes`, `fixes`, or
  `resolves` — note that in the bullet if applicable.

### Summary

- One paragraph, max 4 sentences
- Must name specific components, routes, or behaviors — no generic sentences
- Only describe what is visible in the final diff

### Change-overview table

Choose columns and heading to fit the actual work. Examples by PR type:

| PR type              | Heading example      | Column ideas                          |
| -------------------- | -------------------- | ------------------------------------- |
| API / route work     | "Routes changed"     | Route, method, what it does, auth     |
| Front-end components | "Components touched" | Component, change type, affected page |
| Config / CI          | "Config changes"     | File, what changed, why               |
| Dependency updates   | "Packages"           | Package, old version, new version     |
| Refactor             | "Modules refactored" | Module, change type, reason           |

Rules:

- Rows represent units of behavior, not files — do not mirror the file-by-file list row for row
- Every cell must be grounded in the diff
- One row is acceptable for a small PR — do not pad
- Never include env var values, secrets, or sample values in any cell

### File-by-file changes

Group files under subheadings inferred from their paths. Common groups for this codebase:

- **Route handlers** — `app/api/**/route.ts`
- **Front-end pages** — `app/login/`, `app/register/`, `app/page.tsx`, `app/layout.tsx`
- **Components** — `app/components/`
- **Hooks** — `app/hooks/`
- **Auth / lib** — `app/lib/auth/`
- **Database / models** — `app/lib/db/`
- **Metadata / download** — `app/lib/metadata/`, `app/lib/download/`
- **Utilities** — `app/lib/utils/`, `app/lib/client/`
- **Types** — `app/types/`
- **Tests** — `__tests__/`, `cypress/`
- **Configuration** — `*.config.ts`, `*.config.mjs`, `.prettierrc`, `.prettierignore`
- **CI** — `.github/workflows/`
- **Documentation** — `*.md`
- **Dependencies** — `package.json`, `package-lock.json`

Rules:

- Every file in the diff gets exactly one bullet
- Each bullet states both what changed and why — one sentence
- For renamed/moved files: `` `old/path` → `new/path`: <sentence> ``
- Sort alphabetically by path within each group

---

## Do not

- Do not include text before or after the code block in the final output
- Do not generate output before completing the pre-generation phase and receiving confirmation
- Do not reference anything from prior conversation not in the final diff
- Do not write "None" in any section — omit the section entirely
- Do not include a test plan or testing-related section
- Do not batch or omit individual files in the file-by-file section
- Do not force API-style columns onto non-API work in the change-overview table
- Do not make the change-overview table a row-per-file restatement of the file-by-file section
- Do not write a generic summary — name the actual systems and behaviors changed
