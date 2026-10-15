import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiError } from "@/lib/api";
import type { UserMe } from "@/lib/types";

// The session is an httpOnly cookie the backend owns; this hook just asks who it belongs to.
// A 401 resolves to null instead of throwing so logged-out states render the login page.
export function useMe() {
  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await apiGet<UserMe>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  return { me: q.data ?? null, isLoading: q.isLoading };
}
