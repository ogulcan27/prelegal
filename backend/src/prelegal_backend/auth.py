"""Sign up, sign in and sign out with scrypt password hashes and a session cookie."""

import hashlib
import hmac
import os
import secrets
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from prelegal_backend.db import connect

COOKIE = "prelegal_session"
COOKIE_MAX_AGE = 7 * 24 * 3600

router = APIRouter(prefix="/api/auth")


class Credentials(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class NewAccount(Credentials):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)
    password: str = Field(min_length=8, max_length=128)


class User(BaseModel):
    id: int
    email: str


def hash_password(password: str) -> str:
    """Salted scrypt hash, stored as `salt$hash` in hex."""
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split("$")
    candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
    return hmac.compare_digest(candidate.hex(), digest)


def token_hash(token: str) -> str:
    """Sessions are stored by token hash, so the database never holds a usable token."""
    return hashlib.sha256(token.encode()).hexdigest()


def start_session(response: Response, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    with connect() as conn, conn:
        conn.execute("INSERT INTO sessions (token_hash, user_id) VALUES (?, ?)", (token_hash(token), user_id))
    response.set_cookie(COOKIE, token, max_age=COOKIE_MAX_AGE, httponly=True, samesite="lax")


def current_user(prelegal_session: Annotated[str | None, Cookie()] = None) -> User:
    """The signed-in user; 401 without a session cookie, or with one that ended or is older than its max age."""
    if prelegal_session:
        with connect() as conn:
            row = conn.execute(
                "SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id"
                " WHERE token_hash = ? AND sessions.created_at > datetime('now', ?)",
                (token_hash(prelegal_session), f"-{COOKIE_MAX_AGE} seconds"),
            ).fetchone()
        if row:
            return User(**row)
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please sign in.")


CurrentUser = Annotated[User, Depends(current_user)]


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def sign_up(credentials: NewAccount, response: Response) -> User:
    email = credentials.email.strip().lower()
    try:
        with connect() as conn, conn:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, hash_password(credentials.password))
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    start_session(response, cursor.lastrowid)
    return User(id=cursor.lastrowid, email=email)


@router.post("/signin")
def sign_in(credentials: Credentials, response: Response) -> User:
    email = credentials.email.strip().lower()
    with connect() as conn:
        row = conn.execute("SELECT id, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not verify_password(credentials.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong email or password.")
    start_session(response, row["id"])
    return User(id=row["id"], email=email)


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def sign_out(response: Response, prelegal_session: Annotated[str | None, Cookie()] = None) -> None:
    if prelegal_session:
        with connect() as conn, conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(prelegal_session),))
    response.delete_cookie(COOKIE, httponly=True, samesite="lax")


@router.get("/me")
def me(user: CurrentUser) -> User:
    return user
