import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/lib/useMe";

// Gate for the logged-in area: splash while checking, login page when there is no session.
export function RequireAuth() {
  const { me, isLoading } = useMe();
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#D4DFEE]">
        <div
          className="rounded-[4px] border border-[#B0C4DE] bg-white px-6 py-4 text-[13px] text-[#4B6E9C] shadow"
          data-testid="auth-loading"
        >
          carregando o orkut<span className="animate-pulse">...</span>
        </div>
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  return <Outlet />;
}