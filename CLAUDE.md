# Hi-Res Meta Cleaner Redux — Claude Code Instructions

## Project Overview

Next.js (App Router) monorepo. The API lives in `app/api/` as Route Handlers. The front-end
lives in `app/` as pages and components. TypeScript throughout. MySQL via Sequelize.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on :3000

# Quality checks (run all before declaring anything done)
npm run typecheck    # tsc --noEmit — must pass with zero errors
npm run lint         # ESLint with next/core-web-vitals + next/typescript
npm run build        # Production build — must succeed

# Testing
npm test             # Run all Vitest unit + integration tests
npm run test:watch   # Watch mode
npm run cy:open      # Open Cypress interactively (needs dev server running)
npm run cy:run       # Run Cypress headlessly (needs dev server running)
npm run test:e2e     # Starts Next.js then runs Cypress (still needs DB)
```

## Project Layout

```
app/
  api/               Next.js Route Handlers — one folder per endpoint
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
  types/             Shared TypeScript interfaces
  login/             /login page
  register/          /register page
  layout.tsx         Root layout with AuthProvider + NavBar
  page.tsx           Home page (/ route)
__tests__/           Vitest unit + integration tests
cypress/             Cypress E2E tests
uploads/             Uploaded audio files (git-ignored, created at runtime)
temp/                Temp files during ZIP download (git-ignored, created at runtime)
```

## Architecture Decisions and Constraints

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

Every protected route handler calls `authenticateRequest(request)` at the top. If `isAuthError(result)`
is true, return the error response immediately. If `result.newAccessCookie` is set, include it in
the response `Set-Cookie` header (silent refresh of expired access token).

### node-id3 for metadata write

Only writes ID3v2 (MP3). For non-MP3 files, `writeMetadata.ts` copies the file unchanged. The
stored `type` field in the metadata table is used to decide. Do not re-encode audio.

### Validation

All request bodies are validated inside the route handler before touching the database or disk.
Return 400 for bad input, 401 for auth failures, 404 for not-found (own resource), 409 for
conflicts (duplicate filename). Never return 500 for expected error conditions.

## Testing Rules

- Run `npm test` after every significant change. Tests must pass before moving on.
- Integration tests for route handlers: import the `GET`/`POST` export directly, call with a mock
  `NextRequest`, assert the `NextResponse`.
- Do not mock the database in integration tests — use the real DB with a test database. Set
  `DATABASE_URL` to a test schema in the test environment.
- Vitest environment is `jsdom` (configured in `vitest.config.ts`) — suitable for React hooks and
  component tests without any per-file override.
- Cypress E2E tests require both Next.js and the MySQL DB running.
- Keep test timeouts aggressive: Vitest default is 10 s, Cypress command timeout is 8 s.

## Code Conventions

- TypeScript strict mode is enabled. Fix all type errors — do not use `any` or `@ts-ignore`.
- No comments unless the why is non-obvious.
- No `console.log` in production code paths.
- Prefer `async/await` over promise chains.
- Imports use `@/` alias for absolute paths from project root.
- All API responses are JSON except the download endpoint which streams a ZIP.
- Error responses always have shape `{ error: string }`.
- Success responses for collections are arrays; for single mutations are `{ message: string }`.

## Known Tricky Areas

1. **ZIP streaming** — The archiver `pipe` pattern does not exist in Route Handlers. See
   `app/lib/download/downloadService.ts` for the `ReadableStream` adapter.
2. **Sequelize hot-reload singleton** — Already handled in `sequelize.ts`. Do not change the
   global attachment pattern.
3. **node-id3 type-only for non-MP3** — Check `type` field before calling write; fall back to
   `fs.copyFile` for non-MP3 files.
4. **Upload body size** — `next.config.ts` raises the limit via
   `experimental.serverActions.bodySizeLimit`. Route Handlers are governed by this as well in
   Next.js 15 when using the App Router.
5. **Duplicate detection** — Check within-batch duplicates first, then DB duplicates, before
   writing any file to disk. On any failure, delete all files written so far in this request.
