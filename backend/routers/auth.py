"""Auth routes — signup, login, logout, me. Sessions ride an httpOnly cookie."""
from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import (
    clear_session_cookie,
    get_current_user,
    hash_password,
    require_auth,
    set_session_cookie,
    verify_password,
)
from lib.db import db
from lib.joins import fix_dt
from models.orkut import LoginIn, SignupIn, UserMe, new_id, utcnow

router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
]


@router.post("/signup", response_model=UserMe, status_code=201)
async def signup(payload: SignupIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Este email já está cadastrado")
    avatar = DEFAULT_AVATARS[len(email) % len(DEFAULT_AVATARS)]
    doc = {
        "id": new_id(),
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "avatar_url": avatar,
        "frase": "",
        "about_me": "",
        "city": "",
        "country": "",
        "created_at": utcnow(),
    }
    await db.users.insert_one(doc)
    set_session_cookie(response, doc["id"])
    return UserMe(**fix_dt(doc))


@router.post("/login", response_model=UserMe)
async def login(payload: LoginIn, response: Response):
    doc = await db.users.find_one({"email": payload.email.lower()})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    set_session_cookie(response, doc["id"])
    return UserMe(**fix_dt(doc))


@router.post("/logout")
async def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserMe)
async def me(user: dict = Depends(require_auth)):
    return UserMe(**fix_dt(user))
