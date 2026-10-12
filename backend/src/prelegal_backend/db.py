"""Temporary SQLite database, rebuilt from scratch on every start."""

import sqlite3
from contextlib import closing
from pathlib import Path

from prelegal_backend import config

SCHEMA = """
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    fields TEXT NOT NULL,
    messages TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
"""


def reset_database(path: Path) -> None:
    """Delete any existing database at `path` and create a fresh schema."""
    path.unlink(missing_ok=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(path)) as conn:
        conn.executescript(SCHEMA)


def connect() -> closing[sqlite3.Connection]:
    """Connection to the app database, closed on exit. Use as `with connect() as conn, conn:` to also commit."""
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return closing(conn)
