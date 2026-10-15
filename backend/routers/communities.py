"""Comunidades — directory, membership and forum posts."""
import re

from fastapi import APIRouter, Depends, HTTPException, Response
from pymongo import ASCENDING, DESCENDING

from lib.auth import get_current_user, require_auth
from lib.db import db
from lib.joins import fix_dt, users_by_ids
from models.orkut import (
    CommunityDetailOut,
    CommunityIn,
    CommunityOut,
    CommunityPostIn,
    CommunityPostOut,
    new_id,
    utcnow,
)

router = APIRouter(prefix="/communities", tags=["communities"])

ICON_PRESETS = [
    "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
]


def _community_out(doc: dict, is_member: bool) -> CommunityOut:
    return CommunityOut(**fix_dt(doc), is_member=is_member)


@router.get("", response_model=list[CommunityOut])
async def list_communities(q: str = "", me: dict | None = Depends(get_current_user)):
    needle = q.strip()
    query: dict = {"name": {"$regex": re.escape(needle), "$options": "i"}} if needle else {}
    docs = await db.communities.find(query).sort("member_count", DESCENDING).to_list(100)
    mine: set[str] = set()
    if me:
        rows = await db.community_members.find({"user_id": me["id"]}).to_list(500)
        mine = {r["community_id"] for r in rows}
    return [_community_out(d, d["id"] in mine) for d in docs]


@router.get("/mine", response_model=list[CommunityOut])
async def my_communities(me: dict = Depends(require_auth)):
    rows = await db.community_members.find({"user_id": me["id"]}).to_list(500)
    ids = [r["community_id"] for r in rows]
    docs = await db.communities.find({"id": {"$in": ids}}).to_list(len(ids) + 1)
    return [_community_out(d, True) for d in docs]


@router.post("", response_model=CommunityOut, status_code=201)
async def create_community(payload: CommunityIn, me: dict = Depends(require_auth)):
    name = payload.name.strip()
    if await db.communities.find_one({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}):
        raise HTTPException(status_code=409, detail="Já existe uma comunidade com este nome")
    icon = payload.icon_url or ICON_PRESETS[len(name) % len(ICON_PRESETS)]
    doc = {
        "id": new_id(),
        "name": name,
        "description": payload.description.strip(),
        "category": payload.category,
        "icon_url": icon,
        "owner_id": me["id"],
        "member_count": 1,
        "created_at": utcnow(),
    }
    await db.communities.insert_one(doc)
    await db.community_members.insert_one(
        {
            "id": new_id(),
            "community_id": doc["id"],
            "user_id": me["id"],
            "role": "owner",
            "joined_at": utcnow(),
        }
    )
    return _community_out(doc, is_member=True)


@router.get("/{community_id}", response_model=CommunityDetailOut)
async def get_community(community_id: str, me: dict | None = Depends(get_current_user)):
    doc = await db.communities.find_one({"id": community_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Comunidade não encontrada")
    member_rows = (
        await db.community_members.find({"community_id": community_id})
        .sort("joined_at", ASCENDING)
        .to_list(13)
    )
    people = await users_by_ids([r["user_id"] for r in member_rows])
    is_member = bool(me) and bool(
        await db.community_members.find_one({"community_id": community_id, "user_id": me["id"]})
    )
    return CommunityDetailOut(
        **fix_dt(doc),
        is_member=is_member,
        is_owner=bool(me) and doc["owner_id"] == me["id"],
        members=[people[r["user_id"]] for r in member_rows if r["user_id"] in people],
    )


@router.post("/{community_id}/join", response_model=CommunityOut)
async def join_community(community_id: str, me: dict = Depends(require_auth)):
    doc = await db.communities.find_one({"id": community_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Comunidade não encontrada")
    if not await db.community_members.find_one({"community_id": community_id, "user_id": me["id"]}):
        await db.community_members.insert_one(
            {
                "id": new_id(),
                "community_id": community_id,
                "user_id": me["id"],
                "role": "member",
                "joined_at": utcnow(),
            }
        )
        await db.communities.update_one({"id": community_id}, {"$inc": {"member_count": 1}})
    doc = await db.communities.find_one({"id": community_id})
    return _community_out(doc, is_member=True)


@router.post("/{community_id}/leave", response_model=CommunityOut)
async def leave_community(community_id: str, me: dict = Depends(require_auth)):
    doc = await db.communities.find_one({"id": community_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Comunidade não encontrada")
    if doc["owner_id"] == me["id"]:
        raise HTTPException(status_code=400, detail="Donos não abandonam a própria comunidade")
    result = await db.community_members.delete_one({"community_id": community_id, "user_id": me["id"]})
    if result.deleted_count:
        await db.communities.update_one({"id": community_id}, {"$inc": {"member_count": -1}})
    doc = await db.communities.find_one({"id": community_id})
    return _community_out(doc, is_member=False)


@router.delete("/{community_id}")
async def delete_community(community_id: str, me: dict = Depends(require_auth)):
    doc = await db.communities.find_one({"id": community_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Comunidade não encontrada")
    if doc["owner_id"] != me["id"]:
        raise HTTPException(status_code=403, detail="Só o dono pode excluir a comunidade")
    await db.communities.delete_one({"id": community_id})
    await db.community_members.delete_many({"community_id": community_id})
    await db.community_posts.delete_many({"community_id": community_id})
    return Response(status_code=204)


@router.get("/{community_id}/posts", response_model=list[CommunityPostOut])
async def list_posts(community_id: str):
    docs = (
        await db.community_posts.find({"community_id": community_id})
        .sort("created_at", DESCENDING)
        .to_list(100)
    )
    people = await users_by_ids([d["author_id"] for d in docs])
    return [
        CommunityPostOut(
            id=d["id"],
            community_id=d["community_id"],
            author=people[d["author_id"]],
            body=d["body"],
            created_at=fix_dt(d)["created_at"],
        )
        for d in docs
        if d["author_id"] in people
    ]


@router.post("/{community_id}/posts", response_model=CommunityPostOut, status_code=201)
async def create_post(community_id: str, payload: CommunityPostIn, me: dict = Depends(require_auth)):
    doc = await db.communities.find_one({"id": community_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Comunidade não encontrada")
    if not await db.community_members.find_one({"community_id": community_id, "user_id": me["id"]}):
        raise HTTPException(status_code=403, detail="Participe da comunidade para publicar no fórum")
    post = {
        "id": new_id(),
        "community_id": community_id,
        "author_id": me["id"],
        "body": payload.body.strip(),
        "created_at": utcnow(),
    }
    await db.community_posts.insert_one(post)
    return CommunityPostOut(
        id=post["id"],
        community_id=community_id,
        author=(await users_by_ids([me["id"]]))[me["id"]],
        body=post["body"],
        created_at=post["created_at"],
    )
