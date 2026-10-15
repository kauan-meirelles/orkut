"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "users": [
        IndexModel([("email", ASCENDING)], name="email_unique", unique=True),
        IndexModel([("name", ASCENDING)], name="name_asc"),
    ],
    "friendships": [
        IndexModel(
            [("requester_id", ASCENDING), ("addressee_id", ASCENDING)],
            name="pair_unique",
            unique=True,
        ),
        IndexModel([("addressee_id", ASCENDING), ("status", ASCENDING)], name="addressee_status"),
        IndexModel([("requester_id", ASCENDING), ("status", ASCENDING)], name="requester_status"),
    ],
    "scraps": [
        IndexModel([("wall_user_id", ASCENDING), ("created_at", DESCENDING)], name="wall_created"),
    ],
    "testimonials": [
        IndexModel(
            [("about_user_id", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)],
            name="about_status_created",
        ),
        IndexModel([("author_id", ASCENDING)], name="author"),
    ],
    "fans": [
        IndexModel(
            [("user_id", ASCENDING), ("target_id", ASCENDING)], name="fan_pair_unique", unique=True
        ),
        IndexModel([("target_id", ASCENDING)], name="target"),
    ],
    "communities": [
        IndexModel([("member_count", DESCENDING)], name="member_count_desc"),
        IndexModel([("name", ASCENDING)], name="name_asc"),
    ],
    "community_members": [
        IndexModel(
            [("community_id", ASCENDING), ("user_id", ASCENDING)],
            name="member_unique",
            unique=True,
        ),
        IndexModel([("user_id", ASCENDING)], name="user"),
    ],
    "community_posts": [
        IndexModel([("community_id", ASCENDING), ("created_at", DESCENDING)], name="community_created"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)