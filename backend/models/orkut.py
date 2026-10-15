"""Pydantic models for the Orkut app — keep the TS mirrors in frontend/src/lib/types.ts in sync."""
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Meters(BaseModel):
    confiavel: int
    legal: int
    sexy: int


class UserPublic(BaseModel):
    id: str
    name: str
    avatar_url: str
    frase: str = ""
    about_me: str = ""
    city: str = ""
    country: str = ""
    created_at: datetime


class UserMe(UserPublic):
    email: EmailStr


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=60)
    frase: str | None = Field(default=None, max_length=120)
    about_me: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=60)
    country: str | None = Field(default=None, max_length=60)
    avatar_url: str | None = Field(default=None, max_length=400)


class ProfileOut(BaseModel):
    user: UserPublic
    friends_count: int
    fans_count: int
    scraps_count: int
    testimonials_count: int
    communities_count: int
    is_me: bool
    is_friend: bool
    friendship_id: str | None = None
    incoming_request_id: str | None = None
    outgoing_request_id: str | None = None
    am_fan: bool
    meters: Meters


class SearchUserOut(UserPublic):
    relation: str  # self | friends | incoming | outgoing | none
    friendship_id: str | None = None


class FriendRequestOut(BaseModel):
    id: str
    requester: UserPublic
    created_at: datetime


class FanToggleOut(BaseModel):
    am_fan: bool
    fans_count: int


class ScrapIn(BaseModel):
    wall_user_id: str
    body: str = Field(min_length=1, max_length=2000)


class ScrapOut(BaseModel):
    id: str
    wall_user_id: str
    author: UserPublic
    body: str
    created_at: datetime


class TestimonialIn(BaseModel):
    about_user_id: str
    body: str = Field(min_length=1, max_length=2000)


class TestimonialOut(BaseModel):
    id: str
    about_user_id: str
    author: UserPublic
    about_user: UserPublic
    body: str
    status: str  # pending | accepted
    created_at: datetime


class CommunityIn(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    description: str = Field(default="", max_length=500)
    category: str = "Outros"
    icon_url: str = Field(default="", max_length=400)


class CommunityOut(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon_url: str
    owner_id: str
    member_count: int
    created_at: datetime
    is_member: bool = False


class CommunityDetailOut(CommunityOut):
    is_owner: bool = False
    members: list[UserPublic] = []


class CommunityPostIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommunityPostOut(BaseModel):
    id: str
    community_id: str
    author: UserPublic
    body: str
    created_at: datetime
