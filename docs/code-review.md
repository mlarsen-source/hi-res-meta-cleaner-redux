# Code Review

## Purpose

Reviews the **quality of the implementation** — correctness, performance, architectural
conventions, React patterns, and test coverage gaps.

**Does not:** summarize what changed. Does not generate a PR description or run tests
independently.

---

## Preparation

- Read `AGENTS.md` to load project conventions, architecture constraints, and hard rules.
- Run `git diff --name-only origin/main...HEAD` to enumerate changed files.
- Read all changed files and their direct importers one level deep.
- Identify existing patterns in adjacent files before flagging inconsistencies.
- Briefly state what changed, what depends on it, and what patterns exist in nearby code before
  listing findings.

Do not begin findings until this context step is complete.

## Scope

- Files changed in the branch (`git diff --name-only origin/main...HEAD`)
- Direct importers of changed exports (one level deep) for broken contracts
- Do not review unrelated legacy code or transitive consumers

---

## Review priorities

If only a small number of issues can be flagged, prioritize in this order.

### 1. Correctness

Check for:

- Logic errors, broken conditions, missing edge cases
- Incorrect prop or state flow
- Race conditions or unhandled promise rejections
- Missing error paths
- `await` expressions in Route Handlers that sit outside any try/catch — if the awaited call
  throws, the route bypasses the standard `{ error: string }` JSON shape and returns a raw
  Next.js 500; every async operation after the auth check must be covered by a catch block
- Resource allocations that require explicit cleanup — for any resource with a close/cancel
  method, verify cleanup fires on every exit path (success, throw, early return)

**Decision rule:** Flag if it can cause wrong behavior, data loss, or a crash under a realistic
input or state.

### 2. Runtime cost

For each changed function, identify whether it runs once, per render, per interaction, or per
item in a list.

Check for:

- Expensive work running more frequently than necessary
- Missing memoization where stable inputs cause repeated computation
- Unnecessary re-renders caused by unstable references

**Decision rule:** Flag only if it creates measurable waste at realistic scale.

### 3. Convention compliance

Check changed code against `AGENTS.md` conventions, specifically:

- Inline DB queries in Route Handlers instead of going through the model layer
- Missing `authenticateRequest` call at the top of protected Route Handlers
- Missing validation before touching the database or disk
- `any` types or `@ts-ignore` suppressions
- `console.log` in production code paths
- Deep relative imports where the `@/` alias works
- Missing `'use client'` directive on client components
- Exported async functions missing an explicit return type annotation

**Decision rule:** Flag if the code violates a documented convention, even if it works
correctly.

### 4. Database patterns

Run this section whenever the diff touches `app/lib/db/` or any Route Handler that calls
Sequelize directly.

Check for:

- Queries that do not scope by `user_id` on protected endpoints — a missing ownership check
  returns or mutates another user's data
- `findAll` / `findOne` calls missing a `where` clause on tables that have per-user data
- Missing transactions on multi-step writes (e.g. write file to disk, then create DB row, then
  create metadata row) — if step 2 or 3 fails, the handler must clean up step 1
- `upsert` calls where a plain `create` is intended (or vice versa) — verify the intent matches
  the method
- Raw SQL strings passed to `query()` with user-supplied values — must use parameterized queries
  or Sequelize operators, never string interpolation

**Decision rule:** Each check above is a correctness requirement. Flag every failure.

### 5. Security

Run this section whenever the diff contains a new or modified file under `app/api/`.

Check for:

- Auth check (`authenticateRequest`) is the first operation before any data access or side
  effect — an auth check after a DB read is a defect even if it eventually blocks the request
- All request body fields validated before use — unvalidated strings passed to DB queries or
  file paths are injection vectors
- Response status codes match `AGENTS.md` conventions (400, 401, 404, 409 — never 500 for
  expected errors)
- `Set-Cookie` headers use the `NextResponse` pattern, not `next/headers` cookies()
- File uploads: MIME type and size validated before writing to disk

### 6. React and front-end patterns

Check for:

- Inline functions returning JSX that behave like components but are not structured as
  components
- Components recreated every render without need
- `fetchWithAuth` used for all authenticated API calls (not bare `fetch`)
- Client components that import server-only modules (`fs`, `sequelize`, etc.)

### 7. Test coverage gaps

Check for missing coverage only when it affects confidence in changed behavior:

- A changed error path that has no test asserting the error response shape
- A new validation rule with no test for the rejection case
- A changed auth guard with no test for the 401 case

**Decision rule:** Flag only if it would realistically catch a regression in the changed code.

### 8. Comments

- Remove comments that only restate the code.
- Flag missing comments only when behavior is non-obvious, intentionally inconsistent, or likely
  to surprise a future reader.

---

## Validation

Run and report results for each:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

State pass / fail / not run (with reason) for each.

---

## Output

### Context

- What changed
- What consumes it
- Relevant patterns in adjacent code

### Validation results

- typecheck — pass / fail
- lint — pass / fail
- format — pass / fail
- tests — pass / fail
- build — pass / fail

### Findings

**Critical / High**

For each issue: severity, file and location, issue, why it matters, one-sentence
recommendation.

**Medium / Low**

Compact entries: `file:location` — issue description (severity)

### What could not be verified

At minimum include:

- Whether the change behaves correctly under concurrent requests (if applicable)
- Any consumer files that import changed exports but were not reviewed
- Visual or UI behavior that cannot be verified without running the app

### Verdict

- **Ship** — No issues, or only nitpicks
- **Ship with follow-ups** — Issues found that do not block merge
- **Fix before merge** — Correctness, reliability, or convention failures
- **Requires rework** — Fundamental approach problems
