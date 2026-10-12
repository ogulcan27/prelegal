import sqlite3
from contextlib import closing

from prelegal_backend.auth import hash_password, verify_password

ALICE = {"email": "Alice@Example.com", "password": "correct horse"}


def test_password_hash_round_trip():
    stored = hash_password("secret123")
    assert verify_password("secret123", stored)
    assert not verify_password("secret124", stored)
    assert stored != hash_password("secret123")


def test_sign_up_signs_the_user_in(anon_client):
    response = anon_client.post("/api/auth/signup", json=ALICE)
    assert response.status_code == 201
    assert response.json()["email"] == "alice@example.com"
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie
    assert anon_client.get("/api/auth/me").json()["email"] == "alice@example.com"


def test_sign_up_rejects_duplicate_email(anon_client):
    anon_client.post("/api/auth/signup", json=ALICE)
    response = anon_client.post("/api/auth/signup", json={**ALICE, "email": "alice@example.com"})
    assert response.status_code == 409


def test_sign_up_rejects_short_password_and_bad_email(anon_client):
    assert anon_client.post("/api/auth/signup", json={**ALICE, "password": "short"}).status_code == 422
    assert anon_client.post("/api/auth/signup", json={**ALICE, "email": "not-an-email"}).status_code == 422


def test_sign_in_checks_the_password(anon_client):
    anon_client.post("/api/auth/signup", json=ALICE)
    anon_client.post("/api/auth/signout")
    wrong = anon_client.post("/api/auth/signin", json={**ALICE, "password": "wrong password"})
    assert wrong.status_code == 401
    assert anon_client.get("/api/auth/me").status_code == 401
    right = anon_client.post("/api/auth/signin", json=ALICE)
    assert right.status_code == 200
    assert anon_client.get("/api/auth/me").status_code == 200


def test_unknown_email_gets_the_same_answer_as_a_wrong_password(anon_client):
    response = anon_client.post("/api/auth/signin", json=ALICE)
    assert response.status_code == 401
    assert response.json()["detail"] == "Wrong email or password."


def test_sign_out_ends_the_session(anon_client):
    anon_client.post("/api/auth/signup", json=ALICE)
    token = anon_client.cookies["prelegal_session"]
    assert anon_client.post("/api/auth/signout").status_code == 204
    assert anon_client.get("/api/auth/me").status_code == 401
    anon_client.cookies.set("prelegal_session", token)
    assert anon_client.get("/api/auth/me").status_code == 401


def test_chat_requires_sign_in(anon_client):
    response = anon_client.post("/api/chat", json={"messages": []})
    assert response.status_code == 401


def test_sign_in_with_a_short_password_is_just_a_wrong_password(anon_client):
    anon_client.post("/api/auth/signup", json=ALICE)
    response = anon_client.post("/api/auth/signin", json={**ALICE, "password": "short"})
    assert response.status_code == 401


def test_sessions_end_after_seven_days(anon_client, db_path):
    anon_client.post("/api/auth/signup", json=ALICE)
    with closing(sqlite3.connect(db_path)) as conn, conn:
        conn.execute("UPDATE sessions SET created_at = datetime('now', '-8 days')")
    assert anon_client.get("/api/auth/me").status_code == 401
