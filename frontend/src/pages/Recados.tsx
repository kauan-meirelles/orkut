import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { errMessage, fmtDateTime } from "@/lib/orkut";
import type { Profile, Scrap } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Avatar } from "@/components/orkut/cards";
import { EmoticonBar, EmoticonText } from "@/components/orkut/emoticons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Recados() {
  const { userId } = useParams();
  const { me } = useMe();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const target = !userId || userId === "me" ? me?.id : userId;
  const isOwnWall = !!me && target === me.id;

  const profileQ = useQuery({
    queryKey: ["profile", target],
    queryFn: () => apiGet<Profile>(`/users/${target}`),
    enabled: !!target,
    retry: false,
  });
  const scrapsQ = useQuery({
    queryKey: ["scraps", target],
    queryFn: () => apiGet<Scrap[]>(`/scraps?user_id=${target}`),
    enabled: !!target,
  });

  const send = useMutation({
    mutationFn: () => apiPost<Scrap>("/scraps", { wall_user_id: target, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["scraps", target] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Recado enviado! :D");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (scrapId: string) => apiDelete<void>(`/scraps/${scrapId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scraps", target] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Recado apagado.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const profile = profileQ.data;
  const scraps = scrapsQ.data ?? [];

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="recados-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="recados-breadcrumb">
          orkut &gt; {isOwnWall ? "meus recados" : `recados de ${profile?.user.name ?? "..."}`}
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex flex-col gap-4">
            <RetroBox title="Escrever recado" testid="recados-form-box">
              <div className="flex flex-col gap-2">
                <Textarea
                  data-testid="scrap-textarea"
                  placeholder={isOwnWall ? "Deixe um recado no seu próprio mural :D" : `Deixe um recado para ${profile?.user.name ?? "..."} (L)`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                />
                <EmoticonBar onPick={(code) => setBody((b) => `${b} ${code}`)} />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#4B6E9C]">{body.length}/2000</span>
                  <Button
                    data-testid="scrap-submit-btn"
                    size="sm"
                    disabled={!body.trim() || send.isPending}
                    onClick={() => send.mutate()}
                  >
                    {send.isPending ? "enviando..." : "enviar recado"}
                  </Button>
                </div>
              </div>
            </RetroBox>

            <RetroBox
              title={`Recados de ${profile?.user.name ?? "..."}`}
              testid="recados-list-box"
              action={
                <Badge variant="secondary" data-testid="recados-count">
                  {scraps.length}
                </Badge>
              }
            >
              {scrapsQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando recados...</p>
              ) : scraps.length === 0 ? (
                <p className="text-[13px] text-[#4B6E9C]" data-testid="recados-empty">
                  Nenhum recado neste mural ainda. Deixe o primeiro! :)
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {scraps.map((s) => (
                    <li
                      key={s.id}
                      className="flex gap-2 border-b border-dotted border-[#C9D0DC] pb-3 last:border-0 last:pb-0"
                      data-testid={`scrap-${s.id}`}
                    >
                      <Avatar user={s.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-[#4B6E9C]">
                          <Link
                            to={`/perfil/${s.author.id}`}
                            className="font-semibold text-[#28589C] hover:underline"
                            data-testid={`scrap-author-${s.id}`}
                          >
                            {s.author.name}
                          </Link>{" "}
                          · {fmtDateTime(s.created_at)}
                        </p>
                        <EmoticonText text={s.body} className="text-[13px] text-[#204070]" />
                      </div>
                      {me && (me.id === s.author.id || me.id === s.wall_user_id) && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="apagar recado"
                          data-testid={`scrap-delete-${s.id}`}
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(s.id)}
                        >
                          ✕
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>
          </div>

          <div className="flex flex-col gap-4">
            <RetroBox title="Sobre" testid="recados-about">
              {profile && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar user={profile.user} size="md" />
                  <Link
                    to={`/perfil/${profile.user.id}`}
                    className="text-[13px] font-semibold text-[#28589C] hover:underline"
                    data-testid="recados-about-link"
                  >
                    {profile.user.name}
                  </Link>
                  <p className="text-[11px] text-[#4B6E9C]">
                    {profile.user.frase ? `“${profile.user.frase}”` : "sem frase de efeito"}
                  </p>
                  <p className="text-[11px] text-[#4B6E9C]">
                    {profile.scraps_count} recados · {profile.fans_count} fãs
                  </p>
                </div>
              )}
            </RetroBox>
          </div>
        </div>
      </div>
    </Layout>
  );
}
