"""Filesystem locations, overridable with environment variables. Loads the repo .env for local runs."""

import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(REPO_ROOT / ".env")

DB_PATH = Path(os.environ.get("PRELEGAL_DB_PATH", REPO_ROOT / "backend" / "prelegal.db"))
STATIC_DIR = Path(os.environ.get("PRELEGAL_STATIC_DIR", REPO_ROOT / "frontend" / "out"))
