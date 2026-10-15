"""Depoimentos — friends write about you, you approve before it shows."""
from fastapi import APIRouter, Depends, HTTPException, Response
from pymongo import DESCENDING

from lib.auth import require_auth
from lib.db import db
from lib.joins import fix_dt, users_by_ids
from models.orkut import TestimonialIn, TestimonialOut, new_id, utcnow

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


async def _build(doc: dict) -> TestimonialOut:
    people = await users_by_ids([doc["author_id"], doc["about_user_id"]])
    return TestimonialOut(
        id=doc["id"],
        about_user_id=doc["about_user_id"],
        author=people[doc["author_id"]],
        about_user=people[doc["about_user_id"]],
        body=doc["body"],
        status=doc["status"],
        created_at=fix_dt(doc)["created_at"],
    )


@router.get("", response_model=list[TestimonialOut])
async def list_testimonials(
    user_id: str | None = None,
    author_id: str | None = None,
    status: str = "accepted",
):
    if author_id:
        query: dict = {"author_id": author_id}
    elif user_id:
        query = {"about_user_id": user_id}
    else:
        raise HTTPException(status_code=422, detail="informe user_id ou author_id")
    if status != "all":
        query["status"] = status
    docs = (
        await db.testimonials.find(query)
        .sort("created_at", DESCENDING)
        .to_list(200)
    )
    return [await _build(d) for d in docs]


@router.post("", response_model=TestimonialOut, status_code=201)
async def create_testimonial(payload: TestimonialIn, me: dict = Depends(require_auth)):
    about = await db.users.find_one({"id": payload.about_user_id})
    if not about:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if payload.about_user_id == me["id"]:
        raise HTTPException(status_code=400, detail="Você não pode escrever um depoimento sobre si mesmo")
    if not await db.friendships.find_one(
        {
            "status": "accepted",
            "$or": [
                {"requester_id": me["id"], "addressee_id": payload.about_user_id},
                {"requester_id": payload.about_user_id, "addressee_id": me["id"]},
            ],
        }
    ):
        raise HTTPException(status_code=403, detail="Só amigos podem escrever depoimentos")
    doc = {
        "id": new_id(),
        "about_user_id": payload.about_user_id,
        "author_id": me["id"],
        "body": payload.body.strip(),
        "status": "pending",
        "created_at": utcnow(),
    }
    await db.testimonials.insert_one(doc)
    return await _build(doc)


@router.post("/{testimonial_id}/accept", response_model=TestimonialOut)
async def accept_testimonial(testimonial_id: str, me: dict = Depends(require_auth)):
    doc = await db.testimonials.find_one({"id": testimonial_id})
    if not doc or doc["about_user_id"] != me["id"]:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado")
    await db.testimonials.update_one({"id": testimonial_id}, {"$set": {"status": "accepted"}})
    doc["status"] = "accepted"
    return await _build(doc)


@router.post("/{testimonial_id}/reject")
async def reject_testimonial(testimonial_id: str, me: dict = Depends(require_auth)):
    doc = await db.testimonials.find_one({"id": testimonial_id})
    if not doc or doc["about_user_id"] != me["id"]:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado")
    await db.testimonials.delete_one({"id": testimonial_id})
    return {"ok": True}


@router.delete("/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, me: dict = Depends(require_auth)):
    doc = await db.testimonials.find_one({"id": testimonial_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado")
    if me["id"] not in (doc["author_id"], doc["about_user_id"]):
        raise HTTPException(status_code=403, detail="Você não pode apagar este depoimento")
    await db.testimonials.delete_one({"id": testimonial_id})
    return Response(status_code=204)
