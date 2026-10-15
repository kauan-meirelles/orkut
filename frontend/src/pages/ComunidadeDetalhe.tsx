import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { errMessage, fmtDateTime } from "@/lib/orkut";
import type { CommunityDetail, CommunityPost } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Avatar, UserCard } from "@/components/orkut/cards";
import { EmoticonBar, EmoticonText } from "@/components/orkut/emoticons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ComunidadeDetalhe() {
  const { id } = useParams();
  const { me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [body, setBody] = useState("");

  const communityQ = useQuery({
    queryKey: ["community", id],
    queryFn: () => apiGet<CommunityDetail>(`/communities/${id}`),
    enabled: !!id,
    retry: false,
  });
  const postsQ = useQuery({
    queryKey: ["communityPosts", id],
    queryFn: () => apiGet<CommunityPost[]>(`/communities/${id}/posts`),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["community", id] });
    qc.invalidateQueries({ queryKey: ["communities"] });
    qc.invalidateQueries({ queryKey: ["myCommunities"] });
    qc.invalidateQueries({ queryKey: ["userCommunities"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const join = useMutation({
    mutationFn: () => apiPost(`/communities/${id}/join`),
    onSuccess: () => {
      invalidate();
      toast.success("Você entrou na comunidade! :D");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const leave = useMutation({
    mutationFn: () => apiPost(`/communities/${id}/leave`),
    onSuccess: () => {
      invalidate();
      toast.success("Você saiu da comunidade.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const removeCommunity = useMutation({
    mutationFn: () => apiDelete<void>(`/communities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: ["myCommunities"] });
      toast.success("Comunidade excluída.");
      navigate("/comunidades");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const post = useMutation({
    mutationFn: () => apiPost<CommunityPost>(`/communities/${id}/posts`, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["communityPosts", id] });
      toast.success("Mensagem publicada no fórum!");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const community = communityQ.data;
  const posts = postsQ.data ?? [];

  if (communityQ.isLoading) {
    return (
      <Layout>
        <div className="h-64 animate-pulse rounded-[4px] bg-white/60" />
      </Layout>
    );
  }
  if (!community) {
    return (
      <Layout>
        <RetroBox title="Ops" testid="community-not-found">
          <p className="text-[13px] text-[#204070]">
            Esta comunidade não existe. Volte às{" "}
            <Link to="/comunidades" className="retro-link">
              comunidades
            </Link>
            .
          </p>
        </RetroBox>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="community-detail-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="community-breadcrumb">
          orkut &gt; comunidades &gt; {community.name}
        </p>

        <RetroBox testid="community-header-box">
          <div className="flex flex-wrap items-start gap-3">
            <img
              src={community.icon_url}
              alt={`ícone da comunidade ${community.name}`}
              className="h-20 w-20 rounded-[3px] border border-[#B0C4DE] object-cover"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-[#204070]" data-testid="community-name">
                {community.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" data-testid="community-category">
                  {community.category}
                </Badge>
                <span className="text-[12px] text-[#4B6E9C]" data-testid="community-member-count">
                  {community.member_count} participante{community.member_count === 1 ? "" : "s"}
                </span>
                <Link
                  to={`/perfil/${community.owner_id}`}
                  className="text-[12px] text-[#28589C] hover:underline"
                  data-testid="community-owner-link"
                >
                  criada por {community.members.find((m) => m.id === community.owner_id)?.name ?? "alguém"}
                </Link>
              </div>
              <p className="mt-2 text-[13px] text-[#204070]" data-testid="community-description">
                {community.description || "Sem descrição."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {community.is_owner ? (
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid="community-delete-btn"
                  disabled={removeCommunity.isPending}
                  onClick={() => removeCommunity.mutate()}
                >
                  excluir comunidade
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={community.is_member ? "secondary" : "default"}
                  data-testid={community.is_member ? "community-leave-btn" : "community-join-btn"}
                  disabled={join.isPending || leave.isPending}
                  onClick={() => (community.is_member ? leave.mutate() : join.mutate())}
                >
                  {community.is_member ? "abandonar" : "participar"}
                </Button>
              )}
            </div>
          </div>
        </RetroBox>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <RetroBox title="Fórum" testid="community-forum-box">
            {community.is_member ? (
              <div className="mb-4 flex flex-col gap-2 rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] p-2">
                <Textarea
                  data-testid="community-post-textarea"
                  rows={2}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  placeholder={`Escreva no fórum de ${community.name}... :D`}
                />
                <EmoticonBar onPick={(code) => setBody((b) => `${b} ${code}`)} />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    data-testid="community-post-submit-btn"
                    disabled={!body.trim() || post.isPending}
                    onClick={() => post.mutate()}
                  >
                    {post.isPending ? "publicando..." : "publicar no fórum"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mb-4 rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-2 py-1.5 text-[12px] text-[#4B6E9C]" data-testid="community-guest-notice">
                Participe da comunidade para publicar no fórum ;)
              </p>
            )}

            {postsQ.isLoading ? (
              <p className="text-[12px] text-[#4B6E9C]">carregando fórum...</p>
            ) : posts.length === 0 ? (
              <p className="text-[13px] text-[#4B6E9C]" data-testid="community-posts-empty">
                Nenhuma mensagem no fórum ainda. Seja quem inicia a conversa! :)
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {posts.map((p) => (
                  <li
                    key={p.id}
                    className="flex gap-2 border-b border-dotted border-[#B0C4DE] pb-3 last:border-0 last:pb-0"
                    data-testid={`community-post-${p.id}`}
                  >
                    <Avatar user={p.author} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-[#4B6E9C]">
                        <Link
                          to={`/perfil/${p.author.id}`}
                          className="font-semibold text-[#28589C] hover:underline"
                        >
                          {p.author.name}
                        </Link>{" "}
                        · {fmtDateTime(p.created_at)}
                      </p>
                      <EmoticonText text={p.body} className="text-[13px] text-[#204070]" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </RetroBox>

          <RetroBox title={`Participantes (${community.member_count})`} testid="community-members-box">
            {community.members.length === 0 ? (
              <p className="text-[12px] text-[#4B6E9C]">Ninguém por enquanto.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {community.members.map((m) => (
                  <UserCard key={m.id} user={m} size="sm" />
                ))}
              </div>
            )}
          </RetroBox>
        </div>
      </div>
    </Layout>
  );
}