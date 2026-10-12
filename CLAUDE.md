# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation: sign up / sign in, an AI chat that drafts any of the supported documents (all templates in catalog.json), per-user saved documents that can be reopened, and a draft disclaimer on screen and in every PDF; served by FastAPI in Docker. The database is still reset on every start.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use LiteLLM via OpenRouter to the `nvidia/nemotron-3-super-120b-a12b:free` model (model constant in `backend/src/prelegal_backend/chat.py`). Use Structured Outputs so that you can interpret the results and populate fields in the legal document.

Why not the original choice (verified 2026-10-12): Cerebras does not serve `nemotron-3-ultra-550b-a55b`, and its free variant is served only by NVIDIA without structured-output support. Nemotron Super free supports structured outputs. The `.claude/skills/cerebras/SKILL.md` file is empty.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

Status 2026-10-12: KAN-2 to KAN-6 are merged to `main` and marked Done in Jira. KAN-7 is In Progress in Jira; its PR (branch `feature/KAN-7-users-and-polish`) waits for review and the owner's browser check. Feature branches are kept on purpose (owner's choice).

### Completed (KAN-2, KAN-3)
- Common Paper templates in templates/ and catalog.json
- Mutual NDA creator: manual form (replaced by AI chat in KAN-5), live preview, PDF download (Next.js)

### Completed (KAN-4) - V1 foundation (merged to main, PR #6)
- Next.js static export (`frontend/out`) served by FastAPI at localhost:8000
- Fake login at `/` (replaced by real sign in in KAN-7)
- FastAPI backend (`backend/`, uv project) with stdlib sqlite3
- SQLite DB deleted and recreated on every start (tables: see KAN-7)
- Multi-stage Dockerfile (Node frontend build + Python backend)
- Start/stop scripts for Mac, Linux, Windows in scripts/; Mac scripts delegate to the Linux ones; start passes `.env` to the container if present

### Completed (KAN-5) - AI chat for the Mutual NDA (merged to main, PR #7)
- Freeform chat replaces the manual form (`NdaForm` deleted); chat on the left, live preview + Download PDF on the right
- Fixed greeting in the frontend (`GREETING` in `lib/chat.ts`); no LLM call on page load
- `POST /api/chat`: the browser sends the whole conversation and the current fields each turn (KAN-7 adds `documentId` and saving)
- The AI returns the reply with the complete field set (structured output via Pydantic models)
- LLM call times out after 60 s; on a failed request the chat shows an error and puts the user's text back in the input

### Completed (KAN-6) - All supported document types (merged to main, PR #8)
- `documents.json` (repo root) is the catalog used by backend and frontend: id, name, description, template, two party roles, key terms (key, label, hint). Term labels match the `*_link` spans in the templates
- Chat flow: no document yet -> `SelectReply` call; once chosen, a per-document reply model (built with `create_model`) fills the fields in the same turn; the AI can switch documents (fields start fresh)
- Unsupported requests: the AI says it cannot generate them and offers the closest supported document
- `focus`: the AI names the fields it is asking about (enum of valid keys per document); the preview highlights them in accent yellow and scrolls to the first
- Mutual NDA keeps its dedicated model, preview and PDF (real Common Paper cover page); the other 10 documents use a generated cover page (Key Terms + parties/signature table) followed by the parsed standard terms
- Layout: page fills the screen; chat about 40% wide with a 4-line, auto-growing input; preview scrolls on its own
- Verified by the owner in the browser (layout, yellow highlight and scroll)

### KAN-7 - Multiple users and final polish (PR open)
- Sign up (`/signup/`) and sign in (`/`): email + password (min 8 characters on sign up), scrypt hash (stdlib), opaque session token in an HttpOnly SameSite=Lax cookie `prelegal_session`; the `sessions` table stores only its SHA-256; sessions end on sign out or after 7 days
- DB tables: `users`, `sessions`, `documents` (owner, type, title, fields JSON, messages JSON, ISO UTC timestamps); all reset on every start, so accounts and documents last until the next restart
- Auto-save: `/api/chat` saves the document for the user after each AI reply once the document type is known (insert on the first save, update after); the response carries `documentId`; the browser keeps it and rewrites the address to `/editor/?id=N` so a reload reopens it
- My documents (`/documents/`): newest first; a row opens `/editor/?id=N`, which restores the chat and preview so the user can continue
- Disclaimer (`DISCLAIMER` in `lib/documents.ts`): next to the preview, on the sign-in pages, and in the footer of every PDF page
- Polish: brand colors as Tailwind tokens (`accent`, `primary`, `secondary`, `navy`, `muted` in `globals.css`), app header with nav, email and sign out, split-screen sign-in pages, `Logo`
- `/api/chat` limits: at most 200 messages of at most 10,000 characters each

### Not built yet
- Persistent database (the DB resets on every start, as the ticket allows)

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/signup`, `POST /api/auth/signin` - Body `{email, password}`; set the session cookie; return `{id, email}` (409 duplicate email, 401 wrong email or password)
- `POST /api/auth/signout` (204), `GET /api/auth/me` (`{id, email}` or 401)
- `POST /api/chat` - Signed in. Body `{messages, documentType, fields, documentId}` (null before a document is chosen / saved); returns `{reply, documentType, fields, focus, documentId}`; 404 for another user's `documentId`
- `GET /api/documents` - Signed in. `[{id, title, documentType, updatedAt}]`, newest first
- `GET /api/documents/{id}` - Signed in. Adds `fields` and `messages`; 404 if not the user's

## Implementation Details

- Backend modules (`backend/src/prelegal_backend/`): `config.py` (paths from `PRELEGAL_DB_PATH`, `PRELEGAL_STATIC_DIR`; loads `.env`), `db.py` (`SCHEMA`, `reset_database`, `connect`), `auth.py` (password hash, sessions, `current_user` / `CurrentUser` dependency, `/api/auth/*` router), `documents.py` (`save_document`, `get_document`, `/api/documents` router), `chat.py` (`MODEL`, `DOCUMENTS` from documents.json, Pydantic models, AI instructions, `next_turn`), `main.py` (lifespan resets DB, routers, `/api/chat` with save, `StaticFiles` mount at `/` registered last)
- Frontend routes: `src/app/page.tsx` (sign in) and `src/app/signup/page.tsx` (`AuthPage` + `AuthForm`); route group `src/app/(app)/` with `layout.tsx` (`AppShell`: session check, header) for `documents/page.tsx` (My documents, `DocumentList`) and `editor/page.tsx` (`Editor` reads `?id=` once, then `DocumentBuilder` = `DocumentChat` + `NdaPreview` or `GenericPreview` + `DownloadButton` + `Disclaimer`); `trailingSlash: true`, so link to `/documents/`, `/editor/`, `/signup/`
- Links that open the editor from the editor ("New document") are plain `<a>` (full page load), because `Editor` reads `?id=` only on mount
- `lib/api.ts`: `api()` for all JSON calls; a 401 outside `/api/auth/` sends the browser to `/` (session ended); `lib/auth.ts`, `lib/saved-documents.ts`, `lib/chat.ts` build on it
- The signed-in header height is `--spacing-header` in `globals.css` (`h-header`); the editor uses it to fill the rest of the screen
- Frontend libs: `lib/documents.ts` (catalog types, `focusKeyForLabel`), `lib/generic-template.ts` (parser for non-NDA templates), `lib/load-template.ts` (reads documents.json and templates at build time); shared preview parts in `components/preview-parts.tsx`, shared PDF font/styles/signature table in `components/pdf-parts.tsx`, shared generated-cover texts in `lib/documents.ts`
- Static export cannot use `cacheComponents`, PPR or `"use cache"` (build fails); server components run once at build time
- Close SQLite connections with `contextlib.closing(...)`; `with sqlite3.connect()` does not close, and Windows then locks the file
- `.env` must be `KEY=value` with no spaces around `=` (Docker `--env-file` rejects spaces)
- `.gitattributes` keeps `*.sh` files LF so they run on Mac/Linux
- Tests: `uv run pytest` in `backend/` (conftest points the env vars at temp dirs; `client` is signed in, `anon_client` is not; LLM faked in `test_chat.py` and `test_documents.py`), `uv run pytest -m live` for the real-LLM test, `npm test` and `npm run lint` in `frontend/` (component tests use `src/test-utils.tsx`; a mocked `useRouter` must return one stable object, or effects that depend on the router run again)
- `config.py` loads the repo `.env` for local runs; in Docker the start scripts pass it with `--env-file`
- The Pydantic `NdaData`/`GenericData` in `chat.py` mirror the TypeScript types in `frontend/src/lib/nda.ts` and `lib/documents.ts`; `ChatRequest`/`ChatResponse` mirror `lib/chat.ts`; `DocumentSummary`/`SavedDocument` (`documents.py`) mirror `lib/saved-documents.ts`; `User` (`auth.py`) mirrors `lib/auth.ts`; NDA focus keys (`NDA_FOCUS_KEYS`) match the `focus` values in `coverSections`; change both sides together
- `conftest.py` sets the test env vars at import time, because `chat.py` imports `config` (which reads them once) when test modules are collected
- OpenRouter free models allow 50 requests per day per account (resets 00:00 UTC); each chat turn uses 1-2 requests. Adding 10 credits raises the free limit to 1000/day
- The frontend calls `/api/chat` with a relative URL, so `npm run dev` alone has no backend; build and run the backend (or Docker) to use the chat
- Deferred from review: run the container as a non-root user and add a Docker `HEALTHCHECK` (KAN-4); server-side merge if the AI drops field values, and rate limits on `/api/chat` (KAN-5); in about 1 of 10 turns the AI returns empty party company names while the rest is correct (seen on first turns; the next turn usually refills them) - try a stronger prompt rule or a server-side check (KAN-6); a lost reply on the first save can make a duplicate document on retry, two tabs on one document overwrite each other, and `#888888` small text is below WCAG AA contrast (owner's palette decision) (KAN-7)
