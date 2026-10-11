import sqlite3
from contextlib import closing

from prelegal_backend.db import reset_database


def columns(path):
    with closing(sqlite3.connect(path)) as conn, conn:
        return [row[1] for row in conn.execute("PRAGMA table_info(users)")]


def test_creates_users_table(tmp_path):
    path = tmp_path / "nested" / "prelegal.db"
    reset_database(path)
    assert columns(path) == ["id", "email", "password_hash", "created_at"]


def test_reset_discards_existing_data(tmp_path):
    path = tmp_path / "prelegal.db"
    reset_database(path)
    with closing(sqlite3.connect(path)) as conn, conn:
        conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'x')")
    reset_database(path)
    with closing(sqlite3.connect(path)) as conn, conn:
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
