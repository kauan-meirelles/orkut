"""Small server-side join helpers shared by routers."""
from datetime import datetime, timezone

from lib.db import db
from models.orkut import UserPublic


def fix_dt(doc: dict, *fields: str) -> dict:
    """Motor hands naive UTC datetimes back from BSON — normalise before Pydantic serialises."""
    for field in fields or ("created_at",):
        value = doc.get(field)
        if isinstance(value, datetime) and value.tzinfo is None:
            doc[field] = value.replace(tzinfo=timezone.utc)
    return doc


async def users_by_ids(ids) -> dict[str, UserPublic]:
    """One round-trip author join for lists: id -> UserPublic."""
    unique = list({i for i in ids if i})
    if not unique:
        return {}
    docs = await db.users.find({"id": {"$in": unique}}).to_list(len(unique) + 10)
    return {d["id"]: UserPublic(**fix_dt(d)) for d in docs}
