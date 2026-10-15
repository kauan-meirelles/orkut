import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { UserPublic } from "@/lib/types";

const SIZES = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-32 w-32",
} as const;

export function Avatar({
  user,
  size = "sm",
  className,
}: {
  user: Pick<UserPublic, "avatar_url" | "name" | "id">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <img
      src={user.avatar_url}
      alt={`foto de ${user.name}`}
      data-testid={`avatar-${user.id}`}
      className={cn(
        "rounded-[3px] border-2 border-white bg-[#EBF2FC] object-cover shadow-sm outline outline-1 outline-[#B0C4DE]",
        SIZES[size],
        className,
      )}
    />
  );
}

export function UserCard({ user, size = "sm" }: { user: UserPublic; size?: keyof typeof SIZES }) {
  return (
    <div
      className="flex w-full flex-col items-center gap-1 rounded-[3px] p-1 text-center"
      data-testid={`user-card-${user.id}`}
    >
      <Link
        to={`/perfil/${user.id}`}
        data-testid={`user-link-${user.id}`}
        className="flex flex-col items-center gap-1"
      >
        <Avatar user={user} size={size} />
        <span className="line-clamp-2 text-[11px] font-medium text-[#28589C] hover:underline">
          {user.name}
        </span>
      </Link>
    </div>
  );
}

export function UserRow({
  user,
  children,
  testid,
}: {
  user: UserPublic;
  children?: ReactNode;
  testid?: string;
}) {
  return (
    <div
      data-testid={testid}
      className="flex items-center gap-2 rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-2 py-1.5"
    >
      <Avatar user={user} size="xs" />
      <div className="min-w-0 flex-1">
        <Link
          to={`/perfil/${user.id}`}
          className="block truncate text-[13px] font-semibold text-[#28589C] hover:underline"
        >
          {user.name}
        </Link>
        {(user.city || user.country) && (
          <span className="block truncate text-[11px] text-[#4B6E9C]">
            {[user.city, user.country].filter(Boolean).join(", ")}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}