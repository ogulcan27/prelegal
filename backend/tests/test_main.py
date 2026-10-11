import sqlite3
from contextlib import closing


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_startup_creates_database(client, db_path):
    with closing(sqlite3.connect(db_path)) as conn, conn:
        tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    assert "users" in tables


def test_serves_login_page_at_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "login" in response.text


def test_serves_nda_page(client):
    response = client.get("/nda/")
    assert response.status_code == 200
    assert "nda" in response.text


def test_redirects_nda_without_trailing_slash(client):
    response = client.get("/nda", follow_redirects=False)
    assert response.status_code in (307, 308)
    assert response.headers["location"].endswith("/nda/")


def test_unknown_path_returns_404_page(client):
    response = client.get("/missing")
    assert response.status_code == 404
    assert "not found" in response.text
