// Hand-written mirrors of the Pydantic models in backend/models/orkut.py — nothing infers
// across the HTTP boundary, so keep this file in sync with that one in the same edit.
export interface Meters {
  confiavel: number;
  legal: number;
  sexy: number;
}

export interface UserPublic {
  id: string;
  name: string;
  avatar_url: string;
  frase: string;
  about_me: string;
  city: string;
  country: string;
  created_at: string;
}

export interface UserMe extends UserPublic {
  email: string;
}

export type Relation = "self" | "friends" | "incoming" | "outgoing" | "none";

export interface SearchUser extends UserPublic {
  relation: Relation;
  friendship_id: string | null;
}

export interface Profile {
  user: UserPublic;
  friends_count: number;
  fans_count: number;
  scraps_count: number;
  testimonials_count: number;
  communities_count: number;
  is_me: boolean;
  is_friend: boolean;
  friendship_id: string | null;
  incoming_request_id: string | null;
  outgoing_request_id: string | null;
  am_fan: boolean;
  meters: Meters;
}

export interface FriendRequest {
  id: string;
  requester: UserPublic;
  created_at: string;
}

export interface FanToggle {
  am_fan: boolean;
  fans_count: number;
}

export interface Scrap {
  id: string;
  wall_user_id: string;
  author: UserPublic;
  body: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  about_user_id: string;
  author: UserPublic;
  about_user: UserPublic;
  body: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_url: string;
  owner_id: string;
  member_count: number;
  created_at: string;
  is_member: boolean;
}

export interface CommunityDetail extends Community {
  is_owner: boolean;
  members: UserPublic[];
}

export interface CommunityPost {
  id: string;
  community_id: string;
  author: UserPublic;
  body: string;
  created_at: string;
}