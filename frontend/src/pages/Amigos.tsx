import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { errMessage } from "@/lib/orkut";
import type { FriendRequest, SearchUser, UserPublic } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Avatar, UserCard, UserRow } from "@/components/orkut/cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RELATION_LABELS: Record<SearchUser["relation"], string> = {
  self: "você",
  friends: "são amigos",
  incoming: "quer ser seu amigo",
  outgoing: "pedido enviado",
  none: "",
};

export default function Amigos() {
  const { me } = useMe();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [input, setInput] = useState(urlQ);

  const requestsQ = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => apiGet<FriendRequest[]>("/friendships/requests"),
  });
  const friendsQ = useQuery({
    queryKey: ["friends", me?.id],
    queryFn: () => apiGet<UserPublic[]>(`/users/${me?.id}/friends`),
    enabled: !!me,
  });
  const searchQ = useQuery({
    queryKey: ["users", urlQ],
    queryFn: () => apiGet<SearchUser[]>(`/users/search?q=${encodeURIComponent(urlQ)}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["friends"] });
    qc.invalidateQueries({ queryKey: ["friendRequests"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const addFriend = useMutation({
    mutationFn: (id: string) => apiPost(`/users/${id}/friend-request`),
    onSuccess: () => {
      invalidate();
      toast.success("Pedido de amizade enviado!");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const accept = useMutation({
    mutationFn: (fid: string) => apiPost(`/friendships/${fid}/accept`),
    onSuccess: () => {
      invalidate();
      toast.success("Agora vocês são amigos! :D");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const reject = useMutation({
    mutationFn: (fid: string) => apiPost(`/friendships/${fid}/reject`),
    onSuccess: () => {
      invalidate();
      toast.success("Pedido recusado.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const unfriend = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/users/${id}/friend`),
    onSuccess: () => {
      invalidate();
      toast.success("Amizade desfeita.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const requests = requestsQ.data ?? [];
  const friends = friendsQ.data ?? [];
  const results = searchQ.data ?? [];

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="amigos-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="amigos-breadcrumb">
          orkut &gt; amigos
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <RetroBox
              title={`Pedidos de amizade (${requests.length})`}
              testid="amigos-requests-box"
            >
              {requests.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="amigos-requests-empty">
                  Nenhum pedido pendente.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {requests.map((r) => (
                    <li key={r.id} data-testid={`friend-request-${r.id}`}>
                      <UserRow user={r.requester}>
                        <div className="flex gap-1">
                          <Button
                            size="xs"
                            data-testid={`friend-accept-btn-${r.id}`}
                            disabled={accept.isPending}
                            onClick={() => accept.mutate(r.id)}
                          >
                            aceitar
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            data-testid={`friend-reject-btn-${r.id}`}
                            disabled={reject.isPending}
                            onClick={() => reject.mutate(r.id)}
                          >
                            recusar
                          </Button>
                        </div>
                      </UserRow>
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>

            <RetroBox
              title={`Meus amigos (${friends.length})`}
              testid="amigos-list-box"
            >
              {friends.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="amigos-list-empty">
                  Você ainda não tem amigos. Use a busca ao lado! :)
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {friends.map((f) => (
                    <UserCard key={f.id} user={f} size="sm" />
                  ))}
                </div>
              )}
            </RetroBox>
          </div>

          <RetroBox title="Buscar usuários" testid="amigos-search-box">
            <form
              className="flex gap-2"
              data-testid="amigos-search-form"
              onSubmit={(e) => {
                e.preventDefault();
                setParams(input.trim() ? { q: input.trim() } : {});
              }}
            >
              <Input
                data-testid="user-search-input"
                placeholder="digite um nome..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" size="sm" data-testid="user-search-submit-btn">
                buscar
              </Button>
            </form>

            <ul className="mt-3 flex flex-col gap-2">
              {searchQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">buscando...</p>
              ) : results.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="user-search-empty">
                  Nenhum usuário encontrado para “{urlQ}”.
                </p>
              ) : (
                results.map((u) => (
                  <li key={u.id} data-testid={`search-result-${u.id}`}>
                    <UserRow user={u}>
                      {u.relation === "self" ? (
                        <Badge variant="secondary" data-testid={`relation-self-${u.id}`}>
                          você
                        </Badge>
                      ) : u.relation === "friends" ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          data-testid={`user-remove-${u.id}`}
                          disabled={unfriend.isPending}
                          onClick={() => unfriend.mutate(u.id)}
                        >
                          remover
                        </Button>
                      ) : u.relation === "incoming" ? (
                        <Button
                          size="xs"
                          data-testid={`user-accept-${u.id}`}
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(u.friendship_id ?? "")}
                        >
                          aceitar
                        </Button>
                      ) : u.relation === "outgoing" ? (
                        <Badge variant="secondary" data-testid={`relation-outgoing-${u.id}`}>
                          pedido enviado
                        </Badge>
                      ) : (
                        <Button
                          size="xs"
                          data-testid={`user-add-${u.id}`}
                          disabled={addFriend.isPending}
                          onClick={() => addFriend.mutate(u.id)}
                        >
                          adicionar
                        </Button>
                      )}
                    </UserRow>
                  </li>
                ))
              )}
            </ul>
            {urlQ === "" && !searchQ.isLoading && results.length > 0 && (
              <p className="mt-2 text-[11px] text-[#4B6E9C]" data-testid="user-search-hint">
                mostrando alguns orkuteiros — use a busca para achar alguém específico
              </p>
            )}
          </RetroBox>
        </div>
      </div>
    </Layout>
  );
}
