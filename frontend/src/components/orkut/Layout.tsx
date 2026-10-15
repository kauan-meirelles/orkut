import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/orkut/Header";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#D4DFEE]" data-testid="layout">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
      <footer className="border-t border-[#B0C4DE] py-3 text-center text-[11px] text-[#4B6E9C]">
        orkut recriado com carinho · união, amor, crise de riso ·{" "}
        <Link to="/inicio" className="text-[#28589C] underline decoration-dotted hover:decoration-solid">
          voltar ao início
        </Link>
      </footer>
    </div>
  );
}