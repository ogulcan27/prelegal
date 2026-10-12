# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation: a fake login and an AI chat that drafts any of the supported documents (all templates in catalog.json), served by FastAPI in Docker. Real authentication and document persistence are not built yet.

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

Status 2026-10-12: KAN-2 to KAN-6 are merged to `main` and marked Done in Jira; local `main` is in sync with GitHub. No ticket is in progress. Feature branches are kept on purpose (owner's choice).

### Completed (KAN-2, KAN-3)
- Common Paper templates in templates/ and catalog.json
- Mutual NDA creator: manual form (replaced by AI chat in KAN-5), live preview, PDF download (Next.js)

### Completed (KAN-4) - V1 foundation (merged to main, PR #6)
- Next.js static export (`frontend/out`) served by FastAPI at localhost:8000
- Fake login at `/`: any email and password go to the document creator (now `/documents/`, was `/nda/`); no authentication yet
- FastAPI backend (`backend/`, uv project) with stdlib sqlite3
- SQLite DB deleted and recreated with a `users` table on every start (unused until real auth)
- Multi-stage Dockerfile (Node frontend build + Python backend)
- Start/stop scripts for Mac, Linux, Windows in scripts/; Mac scripts delegate to the Linux ones; start passes `.env` to the container if present

### Completed (KAN-5) - AI chat for the Mutual NDA (merged to main, PR #7)
- Freeform chat replaces the manual form (`NdaForm` deleted); chat on the left, live preview + Download PDF on the right
- Fixed greeting in the frontend (`GREETING` in `lib/chat.ts`); no LLM call on page load
- `POST /api/chat`: stateless; the browser sends the whole conversation and the current fields each turn
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

### Not built yet
- Real sign up / sign in, document persistence, chat history across reloads

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/chat` - Body `{messages, documentType, fields}` (both null before a document is chosen); returns `{reply, documentType, fields, focus}`

## Implementation Details

- Backend modules (`backend/src/prelegal_backend/`): `config.py` (paths from `PRELEGAL_DB_PATH`, `PRELEGAL_STATIC_DIR`; loads `.env`), `db.py` (`reset_database`), `chat.py` (`MODEL`, `DOCUMENTS` from documents.json, Pydantic models, AI instructions, `next_turn`), `main.py` (lifespan resets DB, `/api/*` routes, `StaticFiles` mount at `/` registered last)
- Frontend routes: `src/app/page.tsx` (login, `LoginForm`), `src/app/documents/page.tsx` (`DocumentBuilder` = `DocumentChat` + `NdaPreview` or `GenericPreview` + `DownloadButton`); `trailingSlash: true`, so link to `/documents/`
- Frontend libs: `lib/documents.ts` (catalog types, `focusKeyForLabel`), `lib/generic-template.ts` (parser for non-NDA templates), `lib/load-template.ts` (reads documents.json and templates at build time); shared preview parts in `components/preview-parts.tsx`, shared PDF font/styles/signature table in `components/pdf-parts.tsx`, shared generated-cover texts in `lib/documents.ts`
- Static export cannot use `cacheComponents`, PPR or `"use cache"` (build fails); server components run once at build time
- Close SQLite connections with `contextlib.closing(...)`; `with sqlite3.connect()` does not close, and Windows then locks the file
- `.env` must be `KEY=value` with no spaces around `=` (Docker `--env-file` rejects spaces)
- `.gitattributes` keeps `*.sh` files LF so they run on Mac/Linux
- Tests: `uv run pytest` in `backend/` (conftest points the env vars at temp dirs; LLM faked in `test_chat.py`), `uv run pytest -m live` for the real-LLM test, `npm test` and `npm run lint` in `frontend/`
- `config.py` loads the repo `.env` for local runs; in Docker the start scripts pass it with `--env-file`
- The Pydantic `NdaData`/`GenericData` in `chat.py` mirror the TypeScript types in `frontend/src/lib/nda.ts` and `lib/documents.ts`; NDA focus keys (`NDA_FOCUS_KEYS`) match the `focus` values in `coverSections`; change both sides together
- `conftest.py` sets the test env vars at import time, because `chat.py` imports `config` (which reads them once) when test modules are collected
- OpenRouter free models allow 50 requests per day per account (resets 00:00 UTC); each chat turn uses 1-2 requests. Adding 10 credits raises the free limit to 1000/day
- The frontend calls `/api/chat` with a relative URL, so `npm run dev` alone has no backend; build and run the backend (or Docker) to use the chat
- Deferred from review: run the container as a non-root user and add a Docker `HEALTHCHECK` (KAN-4); server-side merge if the AI drops field values, and request size/rate limits on `/api/chat` once real auth exists (KAN-5); in about 1 of 10 turns the AI returns empty party company names while the rest is correct (seen on first turns; the next turn usually refills them) - try a stronger prompt rule or a server-side check (KAN-6)
