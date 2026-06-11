# Feature Plan

## Purpose

Produces a **structured implementation plan before any code is written** for non-trivial
features — covering scope, data model changes, a complete file manifest, implementation order,
integration points, and verification steps.

**Does not:** write code, make implementation decisions, or review existing code. Use this for
planning-heavy work — not for every small or isolated fix.

---

## Preparation

Read `AGENTS.md` to load project conventions, architecture constraints, and the existing data
model. Read `SPEC.md` to understand the current feature set and confirmed design decisions.

---

## Plan contents

Include all of the following:

### 1. Context

Why the change is being made. What user-facing behavior it adds or changes.

### 2. Data model changes

- New tables or columns required
- Changes to existing Sequelize models in `app/lib/db/models/`
- Whether a migration script is needed or if Sequelize `sync` handles it

### 3. API changes

- New or modified Route Handlers (`app/api/`)
- Request/response shape for each
- Auth requirements (protected or public)
- Validation rules

### 4. Complete file manifest

Every new or changed file, grouped by category:

- **Database / models** — `app/lib/db/`
- **Auth / lib** — `app/lib/auth/`, `app/lib/metadata/`, `app/lib/download/`, `app/lib/utils/`
- **Route Handlers** — `app/api/`
- **Components** — `app/components/`
- **Hooks** — `app/hooks/`
- **Pages** — `app/login/`, `app/register/`, `app/page.tsx`
- **Types** — `app/types/`
- **Tests** — `__tests__/`, `cypress/`

### 5. Implementation order

Phased sequence of work — bottom to top:

1. Data model / DB changes
2. Shared lib (auth helpers, utilities, metadata, download)
3. Route Handlers
4. Front-end components and hooks
5. Tests

Rationale: each layer depends only on layers below it. Do not implement two layers in parallel.

### 6. Integration points

Where the new code connects to existing systems:

- Which existing Route Handlers or models are affected
- Whether `authenticateRequest` needs to be called (all protected routes)
- Whether the upload or download flow is touched (note ZIP streaming and file cleanup
  requirements from `AGENTS.md`)
- Whether new Sequelize associations or scopes are needed

### 7. Verification steps

How the change will be validated end to end:

- Which Vitest unit tests are needed
- Which Vitest integration tests are needed (list the specific scenarios)
- Whether React Testing Library integration tests are needed
- Whether Cypress E2E tests are needed
- Manual verification steps (e.g. upload a real file and confirm metadata appears correctly)

---

## Output

Present the plan as a structured document using the section headings above. Be specific —
name actual files, actual route paths, actual model fields. Vague plans produce vague
implementations.

After presenting the plan, ask: "Does this plan match the intended scope? Any sections to
adjust before work begins?"

Do not start writing code until the plan is confirmed.
