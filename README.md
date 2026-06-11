# Hi-Res Meta Cleaner Redux

A web app for music collectors and archivists to batch-manage audio file metadata. Upload audio
files, view and edit tags inline in a sortable table, and export cleaned files as a ZIP archive
with the updated metadata written back into the file headers.

## Quick Start

**Prerequisites:** Node.js 22+, MySQL 8.0+

```bash
# 1. Install dependencies
npm install

# 2. Set up your database
mysql -u root -p -e "CREATE DATABASE hi_res_meta_cleaner;"
mysql -u root -p -e "CREATE DATABASE hi_res_meta_cleaner_test;"  # for tests

# 3. Configure environment — copy and edit .env.local
# See the Environment Variables section below

# 4. Start the dev server
npm run dev
# App runs at http://localhost:3000
```

## Environment Variables

Create `.env.local` at the project root:

```
DATABASE_URL=mysql://user:pass@localhost:3306/hi_res_meta_cleaner
JWT_ACCESS_SECRET=<at-least-32-character-random-string>
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<different-at-least-32-character-random-string>
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

## Running Tests

```bash
# Run all Vitest tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Cypress E2E (requires dev server + DB running)
npm run dev          # in one terminal
npm run cy:open      # interactive Cypress runner
# or
npm run cy:run       # headless
# or
npm run test:e2e     # starts Next.js automatically, then runs Cypress
```

**Test database:** Integration tests use `DATABASE_URL` from your environment. Set it to a
separate test schema (e.g., `hi_res_meta_cleaner_test`) to avoid touching dev data.

## Quality Checks

All four must pass before any change is considered done:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint with next/core-web-vitals
npm test             # 49 Vitest tests
npm run build        # Production build
```

## Stack

| Concern        | Choice                                         |
| -------------- | ---------------------------------------------- |
| Framework      | Next.js 15 (App Router)                        |
| Language       | TypeScript                                     |
| Database       | MySQL 8 via Sequelize 6                        |
| Auth           | JWT in httpOnly cookies (access + refresh)     |
| File upload    | Native `request.formData()` in Route Handlers  |
| Metadata read  | `music-metadata`                               |
| Metadata write | `node-id3` (MP3 only; others copied unchanged) |
| ZIP export     | `archiver` via ReadableStream adapter          |
| Styling        | Tailwind CSS v4                                |
| Tests          | Vitest + Testing Library + Cypress             |
| CI             | GitHub Actions with MySQL service container    |

## Features

- Upload audio files (drag-and-drop or click-to-browse, up to 200 MB each)
- Automatic metadata extraction on upload
- Sortable collection table (click any column header)
- Inline metadata editing (click any cell — Enter to commit, Escape to cancel)
- ZIP export with updated ID3 tags written into file headers
- JWT authentication with silent access-token refresh
- Duplicate detection (within-batch and against existing collection)

## Project Structure

```
app/
  api/           Route Handlers — one folder per endpoint
  components/    React components
  hooks/         useCollection, useUpload
  lib/
    auth/        JWT helpers, hashPassword, authenticateRequest
    db/          Sequelize singleton + models
    metadata/    extractMetadata, writeMetadata
    download/    downloadService (ZIP streaming)
    utils/       formatters, mappers, objectHelpers, metadataFields
    client/      fetchWithAuth, fileUtils (browser-only)
  types/         Shared TypeScript interfaces
  login/         /login page
  register/      /register page
__tests__/       Vitest tests
cypress/         Cypress E2E tests
uploads/         Uploaded audio files (git-ignored)
temp/            Temp files during ZIP export (git-ignored)
```

## Documentation

- [SPEC.md](SPEC.md) — Full project specification: data model, API contract, edge cases, test inventory
- [AGENTS.md](AGENTS.md) — Project reference and agent workflow library index
- [docs/code-review.md](docs/code-review.md) — Code review workflow
- [docs/test-review.md](docs/test-review.md) — Test suite review workflow
- [docs/feature-plan.md](docs/feature-plan.md) — Feature planning workflow
- [docs/pr-description.md](docs/pr-description.md) — PR description generation workflow
