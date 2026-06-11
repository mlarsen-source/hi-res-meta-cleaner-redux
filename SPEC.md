# Hi-Res Meta Cleaner Redux - Project Specification

---

## 1. What the Tool Is

Hi-Res Meta Cleaner Redux is a web application for music collectors and archivists who need to
batch-manage the metadata tags embedded in audio files. Users upload audio files, see the embedded
tags pulled into a sortable table, edit any field inline or in bulk, and export the cleaned files
as a ZIP archive with the updated tags written back into the file headers.

Target users: music collectors with large personal libraries, archivists digitizing audio
collections, and anyone who finds per-file metadata editing tools too slow.

The front-end pages and the API live in the same Next.js codebase, share TypeScript types
end-to-end, and are developed and deployed together.

---

## 2. How It Should Work

### Data Model

Three tables. Sequelize models with TypeScript types.

**users**

| Column        | Type                          | Notes  |
| ------------- | ----------------------------- | ------ |
| user_id       | INT PK AUTO_INCREMENT         |        |
| email         | VARCHAR(255) UNIQUE NOT NULL  |        |
| password_hash | VARCHAR(255) NOT NULL         | bcrypt |
| first_name    | VARCHAR(100) NOT NULL         |        |
| last_name     | VARCHAR(100) NOT NULL         |        |
| created_at    | DATETIME NOT NULL DEFAULT NOW |        |

**audio_files**

| Column            | Type                          | Notes                   |
| ----------------- | ----------------------------- | ----------------------- |
| file_id           | INT PK AUTO_INCREMENT         |                         |
| user_id           | INT NOT NULL FK -> users      |                         |
| filename          | VARCHAR(255) NOT NULL         | UUID-prefixed disk name |
| original_filename | VARCHAR(255) NOT NULL         | User-facing name        |
| upload_date       | DATETIME NOT NULL DEFAULT NOW |                         |

**metadata**

| Column       | Type                                  | Notes                     |
| ------------ | ------------------------------------- | ------------------------- |
| metadata_id  | INT PK AUTO_INCREMENT                 |                           |
| file_id      | INT UNIQUE NOT NULL FK -> audio_files | One-to-one                |
| title        | VARCHAR(255)                          |                           |
| artist       | VARCHAR(255)                          |                           |
| album        | VARCHAR(255)                          |                           |
| year         | INT                                   |                           |
| genre        | VARCHAR(100)                          |                           |
| track        | INT                                   |                           |
| comment      | TEXT                                  |                           |
| album_artist | VARCHAR(255)                          |                           |
| composer     | VARCHAR(255)                          |                           |
| discnumber   | INT                                   |                           |
| type         | VARCHAR(50)                           | MIME type / format string |
| size         | VARCHAR(50)                           | Human-readable file size  |

### API Routes

All routes return JSON. Auth routes set/clear httpOnly cookies. Protected routes require a valid
`accessToken` cookie; if missing or expired the handler attempts a silent refresh before
proceeding. A failed refresh returns 401.

**Auth**

| Method | Path         | Body                                       | Response                                      |
| ------ | ------------ | ------------------------------------------ | --------------------------------------------- |
| POST   | /api/user    | `{ firstName, lastName, email, password }` | 201 user object                               |
| POST   | /api/login   | `{ email, password }`                      | 200 + sets accessToken + refreshToken cookies |
| POST   | /api/logout  | none                                       | 200 + clears cookies                          |
| POST   | /api/refresh | none (reads refreshToken cookie)           | 200 + sets new accessToken cookie             |

**Protected**

| Method | Path          | Body                               | Response                                                |
| ------ | ------------- | ---------------------------------- | ------------------------------------------------------- |
| POST   | /api/upload   | multipart/form-data, field `files` | 201 array of `{ file_id, original_filename, metadata }` |
| GET    | /api/metadata | none                               | 200 array of all user files with metadata               |
| POST   | /api/update   | `{ file_id, [...metadataFields] }` | 200                                                     |
| POST   | /api/download | `{ fileIds: number[] }`            | ZIP stream                                              |

**Validation rules**

- Register: all four fields required; email must be valid format; password min 8 chars
- Upload: each file must be audio/\* MIME type; max 200 MB per file; max 20 files per request
- Update: `file_id` required INT; known metadata field names only; year and track must be integers
- Download: `fileIds` must be a non-empty array of integers

### Auth Flow

Access token: JWT, 1-hour expiry, httpOnly cookie.
Refresh token: JWT, 7-day expiry, httpOnly cookie.

Login issues both cookies. Every protected route handler calls `authenticateRequest(request)` at
the top, which extracts the access token and verifies it. If the access token is missing or
expired, it attempts a silent refresh using the refresh token cookie before proceeding. If the
refresh also fails, it returns 401. If a new access token is issued, the handler includes it in
the response `Set-Cookie` header.

### File Upload Flow

1. Route handler receives `request.formData()`.
2. Iterates `formData.getAll('files')` - each entry is a Web API `File`.
3. Validates MIME type and size before touching disk.
4. Checks for within-batch duplicates (same original name appears twice in the request).
5. Checks database for existing file with same `original_filename` for this user.
6. Writes each file to `./uploads/<uuid>-<originalname>` using `fs/promises.writeFile`.
7. Creates `audio_files` row.
8. Extracts metadata with `music-metadata` from the disk file.
9. Upserts `metadata` row.
10. Returns the combined record.

On any failure: delete all disk files written so far in this request before returning the error.

### Download Flow

1. Validate `fileIds` array from body.
2. Query `audio_files JOIN metadata WHERE user_id = ? AND file_id IN (?)`.
3. For each file: copy `./uploads/<filename>` to `./temp/<timestamp>-<filename>`, then write
   updated tags using `node-id3` (MP3 only; non-MP3 files are copied unchanged).
4. Pipe all temp files into an `archiver` ZIP stream.
5. Stream the ZIP directly to the response via a `ReadableStream` adapter.
6. On archive `end` or `error`, delete temp files.

### Front-End

Three pages:

- `/` - home: shows upload area and collection table if logged in; login prompt if not
- `/login` - login form
- `/register` - register form

**Key components**

- `NavBar` - links to home; logout button when authenticated
- `AuthProvider` - context holding `{ user_id, email }` and exposing `logout()`
- `UploadSection` - drag-and-drop or click-to-browse; shows per-file progress and errors
- `CollectionTable` - sortable table; clicking a cell opens an inline edit input
- `FileRow` - single row; handles inline edit commit via POST to `/api/update`

**Key hooks**

- `useCollection` - fetches `/api/metadata` on mount; provides `files`, `loading`, `error`, `refresh()`
- `useUpload` - wraps the upload flow; returns `upload(files)`, `uploading`, `errors`

**Client-side auth**

`fetchWithAuth` wrapper: on 401, calls `/api/refresh`, retries once, then redirects to `/login`.

### Edge Cases and Tricky Parts

**File upload body size** - The default Next.js body limit must be raised in `next.config.ts`.
Test with a real large file to confirm the limit is honored.

**Sequelize singleton in dev** - Next.js hot-reloads cause Sequelize to re-initialize. The
`sequelize.ts` module attaches the instance to `global` to survive hot-reloads. Do not change
this pattern or create a `new Sequelize(...)` elsewhere.

**ZIP streaming in Route Handlers** - Express `archive.pipe(res)` does not exist here. The
download service uses a `ReadableStream` adapter that drives the archiver through stream events
and returns a `NextResponse`. See `app/lib/download/downloadService.ts`.

**Temp file cleanup on ZIP errors** - If the archive errors mid-stream, temp files must still
be deleted even though the response has already started.

**Duplicate detection order** - Within-batch duplicates must be checked first, then DB
duplicates, before any file is written to disk.

**node-id3 and non-MP3 files** - `node-id3` only writes ID3 tags. For FLAC, AAC, WAV, and
other formats, the download handler must detect the file type from the stored `type` field and
fall back to a plain file copy.

**Cookie writes in Route Handlers** - Use `NextResponse` with explicit `Set-Cookie` headers.
Do not use `next/headers` cookies() for writes - that API is for Server Components.

### Out of Scope

- Album art management
- External metadata lookup (MusicBrainz, etc.)
- Automated capitalization / whitespace normalization
- FLAC/AAC metadata write (download copies file unchanged for non-MP3)
- Docker / docker-compose
- OAuth / social login

### Environment Variables

```
DATABASE_URL=mysql://user:pass@localhost:3306/hi_res_meta_cleaner
JWT_ACCESS_SECRET=...
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 3. The Stack

| Concern        | Choice                                        | Reason                                          |
| -------------- | --------------------------------------------- | ----------------------------------------------- |
| Framework      | Next.js (App Router)                          | Front-end + API in one project                  |
| Language       | TypeScript throughout                         | Shared types, compiler catches contract drift   |
| Database       | MySQL via Sequelize                           | Relational model fits the data; familiar ORM    |
| Auth           | JWT in httpOnly cookies (access + refresh)    | Stateless, works across API routes              |
| File upload    | Native `request.formData()` in Route Handlers | No multer; Next.js handles multipart            |
| File storage   | `./uploads/` dir at project root              | Simple local storage                            |
| Metadata read  | `music-metadata`                              | Broad format support for reading                |
| Metadata write | `node-id3`                                    | Writes ID3v2 tags without re-encoding; MP3 only |
| ZIP export     | `archiver`                                    | Streaming ZIP                                   |
| Styling        | Tailwind CSS                                  | Utility-first                                   |
| Testing        | Vitest + Testing Library + Cypress            | Unit, integration, and E2E coverage             |

`node-id3` writes ID3v2 tags directly to MP3 files without re-encoding - faster and lossless
compared to a re-encoding pipeline. Trade-off: MP3 only. For other formats, download falls back
to a plain file copy.

---

## 4. How It Should Be Tested

The suite must pass with `npm test` before any feature is considered done.

### Unit tests (Vitest)

**Auth and utilities**

- `hashPassword` / `verifyPassword` round-trip; wrong password returns false
- JWT generate and verify round-trip; expired token throws; wrong secret throws
- `formatFileSize`: bytes -> human-readable for zero, sub-KB, and large values
- `removeEmptyFields`: strips null and undefined; keeps zeros and empty strings
- `responseMappers`: output shape matches expected
- `isAudioFile`: true for audio/\*; false for image, video, application
- `splitFilenameAndExtension`: handles no extension, multiple dots, hidden files

**Hooks and client utilities (jsdom)**

- `useCollection`: calls `/api/metadata` on mount; updates state; sets error on failure
- `useUpload`: posts FormData; handles 409 duplicate; handles non-audio rejection
- `fetchWithAuth`: retries once on 401 via `/api/refresh`; redirects on second 401
- `handleFileChange`: filters non-audio files from a FileList

### Integration tests (Vitest - call Route Handler exports directly)

**Registration and login**

- Valid body -> 201 with user object (no password_hash in response)
- Duplicate email -> 409
- Missing field -> 400
- Valid login -> 200 with cookies set
- Wrong password -> 401; unknown email -> 401

**Upload**

- No auth -> 401
- Valid MP3 -> 201 with metadata shape
- Non-audio file -> 400
- Duplicate filename for same user -> 409

**Metadata**

- No auth -> 401
- With auth -> 200 array

**Update**

- Valid body -> 200
- File belonging to different user -> 404
- Invalid field name -> 400

**Download**

- Valid file IDs -> ZIP content-type response
- Empty array -> 400
- File IDs belonging to different user -> 404

**Auth**

- Valid refresh token -> 200 with new access cookie
- Expired refresh token -> 401
- Logout -> 200 and clears cookies

### Integration tests (React Testing Library)

- Login page: renders; submits; redirects on success; shows error on 401
- Register page: renders; submits; shows validation errors; redirects on 201
- Home (signed out): shows login prompt; no upload area or table
- Home (signed in): shows upload area and collection
- Upload-to-collection: upload fires; collection refreshes; new row appears
- Duplicate upload: shows error message; collection unchanged
- Inline edit: click cell -> input; change value -> blur -> POST fires; cell shows new value

### Cypress E2E

- Signed-out home: shows login prompt; no table visible
- Register: fills form -> submits -> lands on home with collection visible
- Login: fills credentials -> submits -> lands on home
- Invalid login: shows error; stays on login page
- Logout: clicks logout -> returns to login prompt

### Quality checks

- `npm run typecheck` - zero errors
- `npm run lint` - zero warnings
- `npm run build` - production build succeeds
