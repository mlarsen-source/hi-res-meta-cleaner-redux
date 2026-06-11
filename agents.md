# Hi-Res Meta Cleaner Redux — Agent Reference

Hi-Res Meta Cleaner Redux is a Next.js web application for uploading, managing, and editing
metadata tags on high-resolution audio files. Users upload audio files, edit tags inline in a
sortable table, and export cleaned files as a ZIP archive with updated metadata written back
into the file headers.

This file is the authoritative, agent-neutral reference for this codebase. Read it before
starting any work. The `docs/` directory contains on-demand workflow documents.

---

## Commands

```bash
# Development
npm run dev           # Start Next.js dev server on :3000

# Quality gate (run all before declaring anything done)
npm run format:check  # Prettier formatting check
npm run typecheck     # tsc --noEmit — must pass with zero errors
npm run lint          # ESLint with next/core-web-vitals + next/typescript
npm run build         # Production build — must succeed

# Testing
npm test              # Run all Vitest unit + integration tests
npm run test:watch    # Watch mode
npm run cy:open       # Open Cypress interactively (needs dev server running)
npm run cy:run        # Run Cypress headlessly (needs dev server running)
npm run test:e2e      # Starts Next.js then runs Cypress (still needs DB)

# Tooling
npm run format        # Auto-fix formatting with Prettier
npm run secrets       # Run gitleaks secret scan (requires gitleaks installed)
```

---

## Project Layout

```
app/
  api/               Route Handlers — one folder per endpoint
  components/        Shared React components
  hooks/             Custom React hooks
  lib/
    auth/            JWT helpers, hashPassword, authenticateRequest
    db/
      sequelize.ts   Singleton connection (dev hot-reload safe)
      models/        Sequelize models with TypeScript class syntax
    metadata/        extractMetadata.ts, writeMetadata.ts
    download/        downloadService.ts (archiver ZIP streaming)
    utils/           formatters, objectHelpers, metadataFields, responseMappers
    client/          fetchWithAuth, fileUtils (browser-only)
  types/             Shared TypeScript interfaces
  login/             /login page
  register/          /register page
  layout.tsx         Root layout with AuthProvider + NavBar
  page.tsx           Home page (/ route)
__tests__/           Vitest unit + integration tests
cypress/             Cypress E2E tests
docs/                Agent workflow documents
uploads/             Uploaded audio files (git-ignored, created at runtime)
temp/                Temp files during ZIP download (git-ignored, created at runtime)
```

---

## Architecture Constraints

### Sequelize in Next.js dev mode

`app/lib/db/sequelize.ts` attaches the Sequelize instance to `global` to survive hot-reloads.
Do not create a new `Sequelize(...)` outside of this module.

### File uploads in Route Handlers

Use `await request.formData()` and `formData.getAll('files')`. Each entry is a Web API `File`.
Call `file.arrayBuffer()` then `Buffer.from(...)` to write to disk. Do not use multer.

### ZIP streaming in Route Handlers

Return a `new NextResponse(readableStream, { headers })`. Drive archiver events through a
`ReadableStream` controller. See `app/lib/download/downloadService.ts` for the pattern.

### Cookie handling

Set cookies by returning `NextResponse` with explicit `Set-Cookie` headers built by
`serializeCookie()` in `app/lib/auth/jwt.ts`. Do not use `next/headers` cookies() for writes
in Route Handlers — it is for Server Components.

### Authentication

Every protected route handler must call `authenticateRequest(request)` as its first operation,
before any data access or side effect. If `isAuthError(result)` is true, return the error
response immediately. If `result.newAccessCookie` is set, include it in the response
`Set-Cookie` header (silent refresh of expired access token).

### Database security

All queries on tables with per-user data must scope by `user_id`. Never interpolate user-
supplied values into SQL strings — use parameterized queries or Sequelize operators. Multi-step
writes (file + DB row + metadata row) require a transaction; on any failure, clean up all disk
files written in the same request before returning the error.

### Metadata write (node-id3)

Only writes ID3v2 (MP3). For non-MP3 files, `writeMetadata.ts` copies the file unchanged. The
stored `type` field in the metadata table decides the code path. Do not re-encode audio.

### Validation and error responses

Validate all request bodies before touching the database or disk. Return 400 for bad input,
401 for auth failures, 404 for not-found (own resource), 409 for conflicts (duplicate
filename). Never return 500 for expected error conditions.

---

## Code Conventions

- TypeScript strict mode is enabled. Fix all type errors — do not use `any` or `@ts-ignore`.
- No comments unless the why is non-obvious.
- No `console.log` in production code paths.
- Prefer `async/await` over promise chains.
- Imports use `@/` alias for absolute paths from project root.
- All API responses are JSON except the download endpoint which streams a ZIP.
- Error responses always have shape `{ error: string }`.
- Success responses for collections are arrays; for single mutations are `{ message: string }`.

---

## Testing Rules

- Run `npm test` after every significant change. Tests must pass before moving on.
- Integration tests for route handlers: import the `GET`/`POST` export directly, call with a
  mock `NextRequest`, assert the `NextResponse`.
- Do not mock the database in integration tests — use the real DB with a test schema. Set
  `DATABASE_URL` to a test schema in the test environment.
- Vitest environment is `jsdom` (configured in `vitest.config.ts`) — suitable for React hooks
  and component tests without any per-file override.
- Cypress E2E tests require both Next.js and the MySQL DB running.
- Keep test timeouts aggressive: Vitest default is 10 s, Cypress command timeout is 8 s.

---

## Known Tricky Areas

1. **ZIP streaming** — `archive.pipe(res)` does not exist in Route Handlers. See
   `app/lib/download/downloadService.ts` for the `ReadableStream` adapter.
2. **Sequelize hot-reload singleton** — Already handled in `sequelize.ts`. Do not change the
   global attachment pattern.
3. **node-id3 non-MP3 fallback** — Check `type` field before calling write; fall back to
   `fs.copyFile` for non-MP3 files.
4. **Upload body size** — `next.config.ts` raises the limit via
   `experimental.serverActions.bodySizeLimit`. Route Handlers are governed by this in Next.js
   App Router.
5. **Duplicate detection** — Check within-batch duplicates first, then DB duplicates, before
   writing any file to disk. On any failure, delete all files written so far in this request.

---

## Workflow Library

On-demand workflows for recurring tasks. Invoke explicitly — they do not run automatically.

When writing a new workflow or skill, see [docs/workflow-authoring.md](docs/workflow-authoring.md)
for the structure conventions and links to the authoritative standards this library follows.

| Workflow                                         | Purpose                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| [docs/code-review.md](docs/code-review.md)       | Reviews implementation correctness, conventions, and test coverage gaps |
| [docs/test-review.md](docs/test-review.md)       | Reviews test simplicity, readability, and scope                         |
| [docs/feature-plan.md](docs/feature-plan.md)     | Produces a structured plan before code is written                       |
| [docs/pr-description.md](docs/pr-description.md) | Generates PR-ready description text from the final diff                 |

### Invocation

```
Use docs/code-review.md and review the changes on this branch against main.

Use docs/test-review.md and review the existing test suite.

Use docs/feature-plan.md and plan the implementation for this feature.

Use docs/pr-description.md and generate a PR description for this branch against main.
```
