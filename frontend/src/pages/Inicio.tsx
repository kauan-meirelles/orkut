import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { fmtDateTime } from "@/lib/orkut";
import type { Community, FriendRequest, Profile, Scrap, UserPublic } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { EmoticonText } from "@/components/orkut/emoticons";
import { UserCard } from "@/components/orkut/cards";
import { Badge } from "@/components/ui/badge";

export default function Inicio() {
  const { me } = useMe();

  const profileQ = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => apiGet<Profile>("/users/me"),
    enabled: !!me,
    retry: false,
  });
  const requestsQ = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => apiGet<FriendRequest[]>("/friendships/requests"),
    enabled: !!me,
  });
  const scrapsQ = useQuery({
    queryKey: ["scraps", me?.id],
    queryFn: () => apiGet<Scrap[]>(`/scraps?user_id=${me?.id}`),
    enabled: !!me,
  });
  const mineQ = useQuery({
    queryKey: ["myCommunities"],
    queryFn: () => apiGet<Community[]>("/communities/mine"),
    enabled: !!me,
  });
  const friendsQ = useQuery({
    queryKey: ["friends", me?.id],
    queryFn: () => apiGet<UserPublic[]>(`/users/${me?.id}/friends`),
    enabled: !!me,
  });

  const profile = profileQ.data;
  const requests = requestsQ.data ?? [];
  const scraps = (scrapsQ.data ?? []).slice(0, 5);
  const communities = (mineQ.data ?? []).slice(0, 6);
  const friends = (friendsQ.data ?? []).slice(0, 8);

  const counters = [
    { label: "recados", value: profile?.scraps_count ?? 0, to: "/recados", testid: "counter-recados" },
    { label: "fãs", value: profile?.fans_count ?? 0, to: "/perfil/me", testid: "counter-fas" },
    { label: "amigos", value: profile?.friends_count ?? 0, to: "/amigos", testid: "counter-amigos" },
    { label: "comunidades", value: profile?.communities_count ?? 0, to: "/comunidades", testid: "counter-comunidades" },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="inicio-page">
        <RetroBox testid="inicio-welcome">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#204070]" data-testid="inicio-greeting">
                Olá, {me?.name}!
              </h1>
              <p className="text-[12px] text-[#4B6E9C]">
                {profile?.user.frase ? `“${profile.user.frase}”` : "Que tal escrever sua frase de efeito?"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {counters.map((c) => (
                <Link
                  key={c.label}
                  to={c.to}
                  data-testid={c.testid}
                  className="rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-3 py-1.5 text-center transition-colors duration-150 hover:brightness-95"
                >
                  <span className="block text-lg font-bold text-[#EC008C]">{c.value}</span>
                  <span className="block text-[11px] text-[#4B6E9C]">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </RetroBox>

        {requests.length > 0 && (
          <RetroBox title="Pedidos de amizade" testid="inicio-requests" className="border-[#ED258C]">
            <p className="text-[13px] text-[#204070]">
              Você tem{" "}
              <Badge className="bg-[#ED258C] text-white" data-testid="inicio-requests-count">
                {requests.length}
              </Badge>{" "}
              pedido(s) de amizade aguardando resposta.
            </p>
            <Link
              to="/amigos"
              data-testid="inicio-requests-link"
              className="retro-link mt-2 inline-block text-[13px]"
            >
              ver pedidos
            </Link>
          </RetroBox>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RetroBox
            title="Últimos recados"
            testid="inicio-scraps"
            className="lg:col-span-2"
            action={
              <Link to="/recados" className="retro-link text-[12px]" data-testid="inicio-scraps-link">
                ver todos
              </Link>
            }
          >
            {scrapsQ.isLoading ? (
              <p className="text-[12px] text-[#4B6E9C]">carregando recados...</p>
            ) : scraps.length === 0 ? (
              <p className="text-[13px] text-[#4B6E9C]" data-testid="inicio-scraps-empty">
                Nenhum recado ainda. Passe nos perfis dos amigos e deixe o primeiro! :D
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {scraps.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-2 py-1.5"
                    data-testid={`inicio-scrap-${s.id}`}
                  >
                    <p className="text-[12px] text-[#4B6E9C]">
                      <Link to={`/perfil/${s.author.id}`} className="font-semibold text-[#28589C] hover:underline">
                        {s.author.name}
                      </Link>{" "}
                      · {fmtDateTime(s.created_at)}
                    </p>
                    <EmoticonText text={s.body} className="text-[13px] text-[#204070]" />
                  </li>
                ))}
              </ul>
            )}
          </RetroBox>

          <div className="flex flex-col gap-4">
            <RetroBox title={`Meus amigos (${profile?.friends_count ?? 0})`} testid="inicio-friends">
              {friendsQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando amigos...</p>
              ) : friends.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]">
                  Busque pessoas em <Link to="/amigos" className="retro-link">amigos</Link> para adicionar.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {friends.map((f) => (
                    <UserCard key={f.id} user={f} size="sm" />
                  ))}
                </div>
              )}
            </RetroBox>

            <RetroBox title={`Minhas comunidades (${profile?.communities_count ?? 0})`} testid="inicio-communities">
              {mineQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando comunidades...</p>
              ) : communities.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]">
                  Explore as <Link to="/comunidades" className="retro-link">comunidades</Link> do orkut.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {communities.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <img
                        src={c.icon_url}
                        alt={`ícone da comunidade ${c.name}`}
                        className="h-8 w-8 rounded-[3px] border border-[#B0C4DE] object-cover"
                      />
                      <Link
                        to={`/comunidades/${c.id}`}
                        className="truncate text-[12px] font-medium text-[#28589C] hover:underline"
                        data-testid={`inicio-community-link-${c.id}`}
                      >
                        {c.name}
                      </Link>
                      <span className="ml-auto text-[11px] text-[#4B6E9C]">{c.member_count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>
          </div>
        </div>
      </div>
    </Layout>
  );
}