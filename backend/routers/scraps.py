"""Recados — the classic public scrapbook wall."""
from fastapi import APIRouter, Depends, HTTPException, Response
from pymongo import DESCENDING

from lib.auth import require_auth
from lib.db import db
from lib.joins import fix_dt, users_by_ids
from models.orkut import ScrapIn, ScrapOut, UserPublic, new_id, utcnow

router = APIRouter(prefix="/scraps", tags=["scraps"])


@router.get("", response_model=list[ScrapOut])
async def list_scraps(user_id: str):
    docs = (
        await db.scraps.find({"wall_user_id": user_id})
        .sort("created_at", DESCENDING)
        .to_list(50)
    )
    people = await users_by_ids([d["author_id"] for d in docs])
    return [
        ScrapOut(
            id=d["id"],
            wall_user_id=d["wall_user_id"],
            author=people[d["author_id"]],
            body=d["body"],
            created_at=fix_dt(d)["created_at"],
        )
        for d in docs
        if d["author_id"] in people
    ]


@router.post("", response_model=ScrapOut, status_code=201)
async def create_scrap(payload: ScrapIn, me: dict = Depends(require_auth)):
    if not await db.users.find_one({"id": payload.wall_user_id}):
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    doc = {
        "id": new_id(),
        "wall_user_id": payload.wall_user_id,
        "author_id": me["id"],
        "body": payload.body.strip(),
        "created_at": utcnow(),
    }
    await db.scraps.insert_one(doc)
    return ScrapOut(
        id=doc["id"],
        wall_user_id=doc["wall_user_id"],
        author=UserPublic(**fix_dt(me)),
        body=doc["body"],
        created_at=doc["created_at"],
    )


@router.delete("/{scrap_id}")
async def delete_scrap(scrap_id: str, me: dict = Depends(require_auth)):
    doc = await db.scraps.find_one({"id": scrap_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Recado não encontrado")
    if me["id"] not in (doc["author_id"], doc["wall_user_id"]):
        raise HTTPException(status_code=403, detail="Você não pode apagar este recado")
    await db.scraps.delete_one({"id": scrap_id})
    return Response(status_code=204)
