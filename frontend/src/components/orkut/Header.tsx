import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/orkut/Logo";
import { endSession } from "@/lib/session";
import { useMe } from "@/lib/useMe";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", testid: "nav-inicio" },
  { to: "/perfil/me", label: "Meu perfil", testid: "nav-perfil" },
  { to: "/recados", label: "Recados", testid: "nav-recados" },
  { to: "/amigos", label: "Amigos", testid: "nav-amigos" },
  { to: "/comunidades", label: "Comunidades", testid: "nav-comunidades" },
];

// Barra branca como no orkut original: logo rosa à esquerda, botões escuros de navegação, busca à direita.
export function Header() {
  const { me } = useMe();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#D5DAE3] bg-white shadow-[0_1px_4px_rgba(40,50,70,0.12)]"
      data-testid="header"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link to="/inicio" className="flex items-baseline gap-2" data-testid="header-logo-link">
          <Logo />
          <span className="hidden text-[11px] text-[#8A93A6] md:inline">
            união, amor, crise de riso
          </span>
        </Link>

        <form
          className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xs"
          data-testid="header-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              navigate(`/amigos?q=${encodeURIComponent(q.trim())}`);
              setQ("");
            }
          }}
        >
          <Input
            data-testid="header-search-input"
            placeholder="buscar usuários..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 border-[#C9D0DC] bg-white text-[13px] placeholder:text-[#8A93A6]"
          />
        </form>

        <nav className="flex flex-wrap items-center gap-1 text-[13px]">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/inicio" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={cn(
                  "rounded-[4px] bg-[#46536B] px-2.5 py-1 font-medium text-white transition-colors duration-150 hover:bg-[#333F54] active:translate-y-px",
                  active && "bg-[#EC008C] hover:bg-[#C70077]",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {me && (
            <Link
              to={`/perfil/${me.id}`}
              data-testid="header-user-badge"
              className="flex items-center gap-1.5 rounded-[3px] px-1 py-0.5 transition-colors duration-150 hover:bg-[#F1F3F8]"
            >
              <img
                src={me.avatar_url}
                alt={`foto de ${me.name}`}
                className="h-7 w-7 rounded-[3px] border border-[#D5DAE3] object-cover"
              />
              <span className="hidden text-[12px] font-medium text-[#333F54] sm:inline">
                {me.name}
              </span>
            </Link>
          )}
          <Button
            variant="secondary"
            size="xs"
            data-testid="header-logout-btn"
            onClick={() => void endSession()}
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
