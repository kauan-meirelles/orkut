"""Users, profiles, friendships and fans."""
import hashlib
import re

from fastapi import APIRouter, Depends, HTTPException, Response
from pymongo import ASCENDING, DESCENDING

from lib.auth import get_current_user, require_auth
from lib.db import db
from lib.joins import fix_dt, users_by_ids
from models.orkut import (
    FanToggleOut,
    FriendRequestOut,
    Meters,
    ProfileOut,
    ProfileUpdateIn,
    SearchUserOut,
    UserMe,
    UserPublic,
    new_id,
    utcnow,
)

router = APIRouter(prefix="/users", tags=["users"])
friendships_router = APIRouter(prefix="/friendships", tags=["friendships"])


def meters_for(uid: str) -> Meters:
    """Classic per-profile meters, deterministic from the id so they are stable."""
    digest = hashlib.sha256(uid.encode()).digest()
    return Meters(
        confiavel=40 + digest[0] % 61,
        legal=35 + digest[1] % 66,
        sexy=20 + digest[2] % 81,
    )


async def _resolve(user_id: str, me: dict | None) -> dict:
    real = me["id"] if user_id == "me" else user_id
    if not real:
        raise HTTPException(status_code=401, detail="Faça login para continuar")
    doc = await db.users.find_one({"id": real})
    if not doc:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return doc


@router.get("/search", response_model=list[SearchUserOut])
async def search_users(q: str = "", me: dict | None = Depends(get_current_user)):
    needle = q.strip()
    query: dict = {"name": {"$regex": re.escape(needle), "$options": "i"}} if needle else {}
    docs = await db.users.find(query).sort("name", ASCENDING).to_list(13)
    out: list[SearchUserOut] = []
    for d in docs:
        pub = UserPublic(**fix_dt(d))
        base = pub.model_dump()
        if me is None:
            out.append(SearchUserOut(**base, relation="none"))
        elif d["id"] == me["id"]:
            out.append(SearchUserOut(**base, relation="self"))
        else:
            link = await db.friendships.find_one(
                {
                    "$or": [
                        {"requester_id": me["id"], "addressee_id": d["id"]},
                        {"requester_id": d["id"], "addressee_id": me["id"]},
                    ]
                }
            )
            if link and link["status"] == "accepted":
                out.append(SearchUserOut(**base, relation="friends", friendship_id=link["id"]))
            elif link and link["addressee_id"] == me["id"]:
                out.append(SearchUserOut(**base, relation="incoming", friendship_id=link["id"]))
            elif link:
                out.append(SearchUserOut(**base, relation="outgoing"))
            else:
                out.append(SearchUserOut(**base, relation="none"))
    return out


@router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: str, me: dict | None = Depends(get_current_user)):
    doc = await _resolve(user_id, me)
    uid = doc["id"]
    friends_count = await db.friendships.count_documents(
        {"status": "accepted", "$or": [{"requester_id": uid}, {"addressee_id": uid}]}
    )
    fans_count = await db.fans.count_documents({"target_id": uid})
    scraps_count = await db.scraps.count_documents({"wall_user_id": uid})
    testimonials_count = await db.testimonials.count_documents(
        {"about_user_id": uid, "status": "accepted"}
    )
    communities_count = await db.community_members.count_documents({"user_id": uid})

    is_me = bool(me) and me["id"] == uid
    is_friend = False
    friendship_id = None
    incoming_request_id = None
    outgoing_request_id = None
    if me and not is_me:
        link = await db.friendships.find_one(
            {
                "$or": [
                    {"requester_id": me["id"], "addressee_id": uid},
                    {"requester_id": uid, "addressee_id": me["id"]},
                ]
            }
        )
        if link:
            if link["status"] == "accepted":
                is_friend, friendship_id = True, link["id"]
            elif link["addressee_id"] == me["id"]:
                incoming_request_id = link["id"]
            else:
                outgoing_request_id = link["id"]
    am_fan = bool(me) and bool(await db.fans.find_one({"user_id": me["id"], "target_id": uid}))

    return ProfileOut(
        user=UserPublic(**fix_dt(doc)),
        friends_count=friends_count,
        fans_count=fans_count,
        scraps_count=scraps_count,
        testimonials_count=testimonials_count,
        communities_count=communities_count,
        is_me=is_me,
        is_friend=is_friend,
        friendship_id=friendship_id,
        incoming_request_id=incoming_request_id,
        outgoing_request_id=outgoing_request_id,
        am_fan=am_fan,
        meters=meters_for(uid),
    )


@router.patch("/me", response_model=UserMe)
async def update_me(payload: ProfileUpdateIn, me: dict = Depends(require_auth)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": me["id"]}, {"$set": updates})
    doc = await db.users.find_one({"id": me["id"]})
    return UserMe(**fix_dt(doc))


@router.get("/{user_id}/friends", response_model=list[UserPublic])
async def list_friends(user_id: str):
    links = await db.friendships.find(
        {"status": "accepted", "$or": [{"requester_id": user_id}, {"addressee_id": user_id}]}
    ).to_list(500)
    other_ids = [l["addressee_id"] if l["requester_id"] == user_id else l["requester_id"] for l in links]
    people = await users_by_ids(other_ids)
    return [people[i] for i in other_ids if i in people]


@router.get("/{user_id}/fans", response_model=list[UserPublic])
async def list_fans(user_id: str):
    docs = await db.fans.find({"target_id": user_id}).sort("created_at", DESCENDING).to_list(200)
    people = await users_by_ids([d["user_id"] for d in docs])
    return [people[d["user_id"]] for d in docs if d["user_id"] in people]


@router.get("/{user_id}/communities", response_model=list[dict])
async def list_user_communities(user_id: str, me: dict | None = Depends(get_current_user)):
    from routers.communities import _community_out

    rows = await db.community_members.find({"user_id": user_id}).to_list(200)
    ids = [r["community_id"] for r in rows]
    docs = await db.communities.find({"id": {"$in": ids}}).to_list(len(ids) + 1)
    mine: set[str] = set()
    if me:
        rows_me = await db.community_members.find({"user_id": me["id"]}).to_list(500)
        mine = {r["community_id"] for r in rows_me}
    docs.sort(key=lambda d: d.get("member_count", 0), reverse=True)
    return [_community_out(d, d["id"] in mine).model_dump() for d in docs]


@router.post("/{user_id}/friend-request", status_code=201)
async def send_friend_request(user_id: str, me: dict = Depends(require_auth)):
    if user_id == me["id"]:
        raise HTTPException(status_code=400, detail="Você não pode se adicionar")
    if not await db.users.find_one({"id": user_id}):
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    existing = await db.friendships.find_one(
        {
            "$or": [
                {"requester_id": me["id"], "addressee_id": user_id},
                {"requester_id": user_id, "addressee_id": me["id"]},
            ]
        }
    )
    if existing:
        raise HTTPException(status_code=409, detail="Já existe um pedido ou amizade entre vocês")
    doc = {
        "id": new_id(),
        "requester_id": me["id"],
        "addressee_id": user_id,
        "status": "pending",
        "created_at": utcnow(),
    }
    await db.friendships.insert_one(doc)
    return {"id": doc["id"], "status": "pending"}


@router.delete("/{user_id}/friend")
async def unfriend(user_id: str, me: dict = Depends(require_auth)):
    await db.friendships.delete_one(
        {
            "$or": [
                {"requester_id": me["id"], "addressee_id": user_id},
                {"requester_id": user_id, "addressee_id": me["id"]},
            ]
        }
    )
    return Response(status_code=204)


@router.post("/{user_id}/fan", response_model=FanToggleOut)
async def toggle_fan(user_id: str, me: dict = Depends(require_auth)):
    if user_id == me["id"]:
        raise HTTPException(status_code=400, detail="Você não pode ser fã de si mesmo")
    if not await db.users.find_one({"id": user_id}):
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    existing = await db.fans.find_one({"user_id": me["id"], "target_id": user_id})
    if existing:
        await db.fans.delete_one({"id": existing["id"]})
    else:
        await db.fans.insert_one(
            {"id": new_id(), "user_id": me["id"], "target_id": user_id, "created_at": utcnow()}
        )
    fans_count = await db.fans.count_documents({"target_id": user_id})
    return FanToggleOut(am_fan=existing is None, fans_count=fans_count)


@friendships_router.get("/requests", response_model=list[FriendRequestOut])
async def list_requests(me: dict = Depends(require_auth)):
    links = (
        await db.friendships.find({"addressee_id": me["id"], "status": "pending"})
        .sort("created_at", DESCENDING)
        .to_list(100)
    )
    people = await users_by_ids([l["requester_id"] for l in links])
    return [
        FriendRequestOut(
            id=l["id"],
            requester=people[l["requester_id"]],
            created_at=fix_dt(l)["created_at"],
        )
        for l in links
        if l["requester_id"] in people
    ]


@friendships_router.post("/{friendship_id}/accept")
async def accept_request(friendship_id: str, me: dict = Depends(require_auth)):
    link = await db.friendships.find_one({"id": friendship_id})
    if not link or link["addressee_id"] != me["id"]:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.friendships.update_one({"id": friendship_id}, {"$set": {"status": "accepted"}})
    return {"ok": True}


@friendships_router.post("/{friendship_id}/reject")
async def reject_request(friendship_id: str, me: dict = Depends(require_auth)):
    link = await db.friendships.find_one({"id": friendship_id})
    if not link or link["addressee_id"] != me["id"]:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.friendships.delete_one({"id": friendship_id})
    return {"ok": True}