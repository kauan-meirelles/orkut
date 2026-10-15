"""Auth helpers: pbkdf2 password hashing, JWT session cookies, current-user dependencies."""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db

pwd_context = CryptContext(schemes=["pbkdf2_sha256"])

COOKIE_NAME = "orkut_session"
MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 dias


def get_secret() -> str:
    return (
        os.environ.get("SESSION_SECRET")
        or os.environ.get("JWT_SECRET")
        or "orkut_classic_secret_key_2026_abc123"
    )


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_token(user_id: str) -> str:
    secret = get_secret()
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(seconds=MAX_AGE_SECONDS)}
    return jwt.encode(payload, secret, algorithm="HS256")


def set_session_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        create_token(user_id),
        max_age=MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


async def get_current_user(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE_NAME)
    secret = get_secret()
    if not token or not secret:
        return None
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    user = await db.users.find_one({"id": payload.get("sub")})
    return user


async def require_auth(user: dict | None = Depends(get_current_user)) -> dict:
    if user is None:
        raise HTTPException(status_code=401, detail="Faça login para continuar")
    return user