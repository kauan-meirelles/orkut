import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { DEMO_ACCOUNTS, errMessage } from "@/lib/orkut";
import { useMe } from "@/lib/useMe";
import type { UserMe } from "@/lib/types";
import { Logo } from "@/components/orkut/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Login no espírito do orkut original (card da marca + acesso à direita + "ENTRAR JÁ"),
// com acabamento moderno: cantos arredondados, sombras suaves e acento rosa.
const FOOTER_LINKS = ["Sobre o Orkut", "Centro de segurança", "Privacidade", "Termos"];

export default function Login() {
  const { me, isLoading } = useMe();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) => apiPost<UserMe>("/auth/login", body),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Bem-vindo(a) de volta, ${user.name}!`);
      navigate("/inicio");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const signup = useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      apiPost<UserMe>("/auth/signup", body),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Conta criada. Bem-vindo(a), ${user.name}!`);
      navigate("/inicio");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#E8EBF2]">
        <div
          className="rounded-[4px] border border-[#D5DAE3] bg-white px-6 py-4 text-[13px] text-[#5C6B84] shadow"
          data-testid="login-loading"
        >
          carregando o orkut<span className="animate-pulse">...</span>
        </div>
      </div>
    );
  }
  if (me) return <Navigate to="/inicio" replace />;

  return (
    <div className="flex min-h-svh flex-col bg-[#E8EBF2]" data-testid="login-page">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10">
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* card da marca — logo rosa + os três clássicos "Conecta-se / Conheça / Compartilhe" */}
          <section
            className="flex flex-col justify-center rounded-2xl border border-[#D5DAE3] bg-white px-8 py-12 shadow-[0_2px_12px_rgba(40,50,70,0.08)]"
            data-testid="login-brand-card"
          >
            <div className="flex items-start justify-center gap-2">
              <Logo size="lg" />
              <span className="mt-1 text-[13px] text-[#8A93A6]">beta</span>
            </div>

            <div className="mt-10 flex flex-col gap-3.5 text-center text-[15px] leading-relaxed text-[#333F54]">
              <p>
                <strong className="font-bold text-[#EC008C]">Conecta-se</strong> aos seus amigos e
                familiares usando recados e mensagens instantâneas
              </p>
              <p>
                <strong className="font-bold text-[#EC008C]">Conheça</strong> novas pessoas através
                de amigos de seus amigos e comunidades
              </p>
              <p>
                <strong className="font-bold text-[#EC008C]">Compartilhe</strong> seus vídeos, fotos
                e paixões em um só lugar
              </p>
            </div>

            <div className="mt-10 border-t border-dotted border-[#D5DAE3] pt-6">
              <p className="text-center text-[12px] text-[#8A93A6]" data-testid="login-demo-hint">
                quer sentir a nostalgia agora? entre com uma conta demo:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {DEMO_ACCOUNTS.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    data-testid={`demo-login-${d.email.split("@")[0]}`}
                    disabled={login.isPending}
                    onClick={() => login.mutate({ email: d.email, password: "senha123" })}
                    className="flex items-center gap-2 rounded-full border border-[#D5DAE3] bg-[#F1F3F8] py-1 pl-1 pr-3 transition-all duration-150 hover:border-[#EC008C]/40 hover:bg-white hover:shadow-sm active:translate-y-px disabled:opacity-50"
                  >
                    <img
                      src={d.avatar_url}
                      alt={`foto de ${d.name}`}
                      className="h-7 w-7 rounded-full border border-[#D5DAE3] object-cover"
                    />
                    <span className="text-[12px] font-semibold text-[#333F54]">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* coluna de acesso */}
          <div className="flex flex-col gap-4">
            <section
              className="rounded-2xl border border-[#D5DAE3] bg-white px-6 py-7 shadow-[0_2px_12px_rgba(40,50,70,0.08)]"
              data-testid="login-card"
            >
              {mode === "login" ? (
                <>
                  <h1
                    className="text-center text-[15px] font-semibold text-[#333F54]"
                    data-testid="login-card-title"
                  >
                    Acesse o orkut com a sua conta
                  </h1>
                  <form
                    className="mt-5 flex flex-col gap-4"
                    data-testid="login-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      login.mutate({ email: loginEmail, password: loginPassword });
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        data-testid="login-email-input"
                        type="email"
                        required
                        placeholder="voce@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password-input"
                        type="password"
                        required
                        placeholder="sua senha"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full transition-all duration-150 hover:brightness-95 active:translate-y-px"
                      data-testid="login-submit-btn"
                      disabled={login.isPending}
                    >
                      {login.isPending ? "Entrando..." : "Login"}
                    </Button>
                  </form>
                  <button
                    type="button"
                    className="retro-link mx-auto mt-4 block text-[13px]"
                    data-testid="login-forgot-link"
                    onClick={() =>
                      toast.info("Dica: as contas de demonstração usam a senha senha123 :)")
                    }
                  >
                    Não consegue acessar a sua conta?
                  </button>
                </>
              ) : (
                <>
                  <h1
                    className="text-center text-[15px] font-semibold text-[#333F54]"
                    data-testid="signup-card-title"
                  >
                    Crie a sua conta no orkut
                  </h1>
                  <form
                    className="mt-5 flex flex-col gap-4"
                    data-testid="signup-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      signup.mutate({ name: signupName, email: signupEmail, password: signupPassword });
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-name">Seu nome</Label>
                      <Input
                        id="signup-name"
                        data-testid="signup-name-input"
                        required
                        minLength={2}
                        placeholder="Como você aparece no orkut"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        data-testid="signup-email-input"
                        type="email"
                        required
                        placeholder="voce@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-password">Senha (mín. 6 caracteres)</Label>
                      <Input
                        id="signup-password"
                        data-testid="signup-password-input"
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full transition-all duration-150 hover:brightness-95 active:translate-y-px"
                      data-testid="signup-submit-btn"
                      disabled={signup.isPending}
                    >
                      {signup.isPending ? "Criando..." : "Criar minha conta"}
                    </Button>
                  </form>
                  <button
                    type="button"
                    className="retro-link mx-auto mt-4 block text-[13px]"
                    data-testid="signup-back-login-btn"
                    onClick={() => setMode("login")}
                  >
                    já sou membro — voltar ao login
                  </button>
                </>
              )}
            </section>

            <section
              className="rounded-2xl border border-[#D5DAE3] bg-white px-6 py-6 text-center shadow-[0_2px_12px_rgba(40,50,70,0.08)]"
              data-testid="login-member-card"
            >
              <p className="text-[14px] text-[#333F54]">Ainda não é membro?</p>
              {mode === "login" ? (
                <button
                  type="button"
                  data-testid="signup-entrar-ja-btn"
                  onClick={() => setMode("signup")}
                  className="mt-1 text-[15px] font-bold uppercase tracking-wide text-[#28589C] transition-colors duration-150 hover:text-[#EC008C] hover:underline"
                >
                  Entrar já
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="login-back-btn"
                  onClick={() => setMode("login")}
                  className="mt-1 text-[15px] font-bold uppercase tracking-wide text-[#28589C] transition-colors duration-150 hover:text-[#EC008C] hover:underline"
                >
                  Voltar ao login
                </button>
              )}
            </section>
          </div>
        </div>
      </div>

      <footer
        className="border-t border-[#C9D4E8] bg-[#DCE4F2] py-3 text-center text-[12px] text-[#333F54]"
        data-testid="login-footer"
      >
        © 2026 Orkut{" "}
        {FOOTER_LINKS.map((label) => (
          <span key={label}>
            {" · "}
            <button
              type="button"
              className="text-[#28589C] underline decoration-dotted hover:decoration-solid"
              data-testid={`login-footer-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              onClick={() => toast.info("Página decorativa — recriação feita por fãs :)")}
            >
              {label}
            </button>
          </span>
        ))}
      </footer>
    </div>
  );
}
