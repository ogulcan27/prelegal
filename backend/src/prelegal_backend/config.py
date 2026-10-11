"""Filesystem locations, overridable with environment variables."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

DB_PATH = Path(os.environ.get("PRELEGAL_DB_PATH", REPO_ROOT / "backend" / "prelegal.db"))
STATIC_DIR = Path(os.environ.get("PRELEGAL_STATIC_DIR", REPO_ROOT / "frontend" / "out"))
