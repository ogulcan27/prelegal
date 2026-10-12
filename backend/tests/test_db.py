import sqlite3
from contextlib import closing

from prelegal_backend.db import reset_database


def columns(path, table):
    with closing(sqlite3.connect(path)) as conn, conn:
        return [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]


def test_creates_tables(tmp_path):
    path = tmp_path / "nested" / "prelegal.db"
    reset_database(path)
    assert columns(path, "users") == ["id", "email", "password_hash", "created_at"]
    assert columns(path, "sessions") == ["token_hash", "user_id", "created_at"]
    assert columns(path, "documents") == [
        "id", "user_id", "document_type", "title", "fields", "messages", "created_at", "updated_at",
    ]


def test_reset_discards_existing_data(tmp_path):
    path = tmp_path / "prelegal.db"
    reset_database(path)
    with closing(sqlite3.connect(path)) as conn, conn:
        conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'x')")
    reset_database(path)
    with closing(sqlite3.connect(path)) as conn, conn:
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
