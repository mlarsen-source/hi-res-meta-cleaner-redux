# Working with Claude Code — Hi-Res Meta Cleaner Redux

This document describes how to use Claude Code effectively on this codebase: which workflows
to follow, what to delegate versus what to own, and where to apply extra scrutiny.

---

## Foundational Principle

Claude Code works best when given a clear spec and explicit layer-by-layer tasks. It will fill
in implementation details, write boilerplate, and iterate on failures — but it cannot derive
intent from context alone. Always give it the what and the why; let it figure out the how.

---

## Workflow 1 — Spec-First for New Features

Before adding any significant feature:

1. Write or update `SPEC.md` to cover the feature: behavior, edge cases, data shape, API
   contract, and test scenarios.
2. Review the spec for ambiguity: anywhere vague enough that the agent could build something
   you didn't mean is a gap to close before handing it over.
3. Hand the spec to the agent with a clear scope boundary: "Implement X as described in SPEC.md
   §N. Do not touch Y or Z."

**Checkpoint:** Read the generated code before building on top of it. Structural mistakes are
cheapest to fix before they become load-bearing.

---

## Workflow 2 — Layer-by-Layer Implementation

Build changes one layer at a time, bottom to top:

```
1. Database models / migrations
2. Auth utilities and shared lib
3. API route handlers
4. Front-end components and hooks
5. Tests
```

Tell the agent to complete one layer before starting the next. Do not let it partially implement
two layers at once — integration errors compound quickly.

**Spot-check each layer before proceeding:**

- Database layer: does the schema match `SPEC.md §3` exactly?
- Auth helpers: does the refresh fallback work correctly?
- Route handlers: are error shapes consistent (`{ error: string }` everywhere)?
- Upload handler: does it check within-batch duplicates before DB before writing disk?

---

## Workflow 3 — Test-Driven Verification

Supply the test scenarios; let the agent write the test code.

The test case inventory lives in `SPEC.md §9`. Hand the agent specific scenarios:

> "Write Vitest integration tests for `/api/upload`. Scenarios: (1) valid MP3 returns 201 with
> metadata shape, (2) non-audio file returns 400, (3) duplicate filename returns 409. Do not
> add scenarios I didn't list."

**Before trusting test results, audit the tests:**

- Does each test actually assert a meaningful condition, or does it just call the function?
- Are integration tests calling the real route handler export, not a mock wrapper?
- Are Cypress tests visiting real pages and interacting with real DOM elements?

After adding any feature, run the full suite — not just the new tests.

---

## Workflow 4 — Tricky Areas Requiring Extra Attention

These areas of the codebase are most likely to go wrong. Apply extra scrutiny when touching them.

### File upload (no multer)

Route Handlers use `request.formData()` and `file.arrayBuffer()`. Multer does not work here.
**Verify:** `app/api/upload/route.ts` has no multer import.

### ZIP streaming (no `archive.pipe(res)`)

The download service uses a `ReadableStream` adapter — archiver data events feed the controller,
and the response is `new NextResponse(stream)`. See `app/lib/download/downloadService.ts`.
**Verify:** Run the download endpoint against a real file and confirm the ZIP arrives intact
and temp files are cleaned up afterward.

### Sequelize singleton in dev

`app/lib/db/sequelize.ts` attaches the instance to `global` to survive hot-reloads.
**Verify:** Edit a file while dev is running, hot-reload, confirm no "too many connections" error.

### node-id3 non-MP3 fallback

`node-id3.write()` must only be called for `audio/mpeg` files. All other types fall back to
`fs.copyFile`. The `type` field in the metadata table is the gate.
**Verify:** Upload a FLAC file, download it, confirm it is byte-identical to the original.

---

## Workflow 5 — Quality Gate

No change is done until all four pass:

```bash
npm run typecheck   # zero errors
npm run lint        # zero warnings
npm test            # all tests pass
npm run build       # production build succeeds
```

Read the raw output — not just the agent's summary of it.

---

## Effective Prompting Patterns

**Layer handoff:**

> "The database models and auth utilities are complete. Now implement the shared lib:
> responseMappers, objectHelpers, metadataFields, formatters, extractMetadata, writeMetadata,
> downloadService. Do not touch route handlers or the front-end yet."

**Test scenario handoff:**

> "Write Vitest unit tests for `hashPassword.ts`. Scenarios: (1) hashing produces a bcrypt
> string, (2) `verifyPassword` returns true for correct input, (3) returns false for wrong input.
> Do not add scenarios I didn't list."

**Tricky area direction:**

> "The download endpoint must stream a ZIP. `archive.pipe(res)` does not exist in Route
> Handlers. Use a ReadableStream with a start(controller) function that drives the archiver:
> enqueue on data, close on end, error on error. Return new NextResponse(stream)."

**Correction:**

> "The upload handler is using multer. That does not work in a Route Handler. Rewrite it using
> request.formData() and file.arrayBuffer() as specified in SPEC.md §6."

---

## What Requires Human Judgment

- **Intent** — The agent implements what the spec says, not what you meant. Gaps in the spec
  produce plausible-but-wrong implementations.
- **Browser verification** — The agent cannot confirm the UI works in a real browser. Test the
  golden path manually after any front-end change.
- **Test integrity** — The agent will write hollow tests if given no scenario list. Audit every
  test file.
- **Architectural reach** — The agent optimizes locally. It cannot see that a choice in the
  upload handler will make integration tests harder three layers later.
- **Domain verification** — Whether the ZIP actually plays in a media player; whether metadata
  was written correctly into the file header — these require manual testing with real audio files.
