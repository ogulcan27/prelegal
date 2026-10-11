# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation is the V1 foundation: a fake login and the manual Mutual NDA creator, served by FastAPI in Docker. AI chat, real authentication and the other document types are not built yet.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `nvidia/nemotron-3-ultra-550b-a55b:free` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

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

### Completed (KAN-2, KAN-3)
- Common Paper templates in templates/ and catalog.json
- Mutual NDA creator: manual form, live preview, PDF download (Next.js)

### Completed (KAN-4) - V1 foundation
- Next.js static export (`frontend/out`) served by FastAPI at localhost:8000
- Fake login at `/`: any email and password go to the NDA creator at `/nda/`; no authentication yet
- FastAPI backend (`backend/`, uv project) with stdlib sqlite3
- SQLite DB deleted and recreated with a `users` table on every start (unused until real auth)
- Multi-stage Dockerfile (Node frontend build + Python backend)
- Start/stop scripts for Mac, Linux, Windows in scripts/ (pass `.env` to the container if present)

### Not built yet
- AI chat, real sign up / sign in, document persistence, other document types

### Current API Endpoints
- `GET /api/health` - Health check
