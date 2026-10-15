import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { errMessage, fmtDate } from "@/lib/orkut";
import type { Testimonial } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Avatar } from "@/components/orkut/cards";
import { EmoticonText } from "@/components/orkut/emoticons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Depoimentos() {
  const { me } = useMe();
  const qc = useQueryClient();
  const uid = me?.id;

  const pendingQ = useQuery({
    queryKey: ["testimonials", uid, "pending"],
    queryFn: () => apiGet<Testimonial[]>(`/testimonials?user_id=${uid}&status=pending`),
    enabled: !!uid,
  });
  const receivedQ = useQuery({
    queryKey: ["testimonials", uid, "accepted"],
    queryFn: () => apiGet<Testimonial[]>(`/testimonials?user_id=${uid}&status=accepted`),
    enabled: !!uid,
  });
  const sentQ = useQuery({
    queryKey: ["testimonials", uid, "sent"],
    queryFn: () => apiGet<Testimonial[]>(`/testimonials?author_id=${uid}&status=all`),
    enabled: !!uid,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["testimonials"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const accept = useMutation({
    mutationFn: (id: string) => apiPost<Testimonial>(`/testimonials/${id}/accept`),
    onSuccess: () => {
      invalidateAll();
      toast.success("Depoimento aprovado! Ele já aparece no seu perfil :D");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const reject = useMutation({
    mutationFn: (id: string) => apiPost(`/testimonials/${id}/reject`),
    onSuccess: () => {
      invalidateAll();
      toast.success("Depoimento rejeitado.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/testimonials/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success("Depoimento apagado.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  function card(t: Testimonial, mode: "pending" | "received" | "sent") {
    const other = mode === "sent" ? t.about_user : t.author;
    return (
      <li
        key={t.id}
        className="flex gap-2 rounded-[3px] border border-[#C9D0DC] bg-[#F1F3F8] px-2 py-2"
        data-testid={`testimonial-${t.id}`}
      >
        <Avatar user={other} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[#4B6E9C]">
            <Link to={`/perfil/${other.id}`} className="font-semibold text-[#28589C] hover:underline">
              {other.name}
            </Link>{" "}
            · {fmtDate(t.created_at)}
            {t.status === "pending" && (
              <Badge variant="outline" className="ml-2 border-[#ED258C] text-[#C2185B]">
                aguardando aprovação
              </Badge>
            )}
          </p>
          <EmoticonText text={t.body} className="text-[13px] text-[#204070]" />
        </div>
        {mode === "pending" && (
          <div className="flex flex-col justify-center gap-1">
            <Button
              size="xs"
              data-testid={`testimonial-accept-${t.id}`}
              disabled={accept.isPending}
              onClick={() => accept.mutate(t.id)}
            >
              aprovar
            </Button>
            <Button
              size="xs"
              variant="outline"
              data-testid={`testimonial-reject-${t.id}`}
              disabled={reject.isPending}
              onClick={() => reject.mutate(t.id)}
            >
              rejeitar
            </Button>
          </div>
        )}
        {mode === "sent" && (
          <div className="flex items-center">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="apagar depoimento"
              data-testid={`testimonial-delete-${t.id}`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(t.id)}
            >
              ✕
            </Button>
          </div>
        )}
      </li>
    );
  }

  return (
    <Layout>
      <div className="mx-auto flex max-w-3xl flex-col gap-4" data-testid="depoimentos-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="depoimentos-breadcrumb">
          orkut &gt; depoimentos
        </p>

        <RetroBox title="Depoimentos" testid="depoimentos-box">
          <p className="mb-3 text-[12px] text-[#4B6E9C]">
            Amigos escrevem depoimentos sobre você — e só aparecem no seu perfil depois da sua
            aprovação. Escreva o seu na página de um amigo (L)
          </p>
          <Tabs defaultValue="pendentes">
            <TabsList>
              <TabsTrigger value="pendentes" data-testid="tab-depoimentos-pendentes">
                Pendentes ({pendingQ.data?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="recebidos" data-testid="tab-depoimentos-recebidos">
                Recebidos ({receivedQ.data?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="enviados" data-testid="tab-depoimentos-enviados">
                Enviados ({sentQ.data?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="mt-3">
              {(pendingQ.data ?? []).length === 0 ? (
                <p className="text-[13px] text-[#4B6E9C]" data-testid="depoimentos-pendentes-empty">
                  Nenhum depoimento aguardando aprovação.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(pendingQ.data ?? []).map((t) => card(t, "pending"))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="recebidos" className="mt-3">
              {(receivedQ.data ?? []).length === 0 ? (
                <p className="text-[13px] text-[#4B6E9C]" data-testid="depoimentos-recebidos-empty">
                  Você ainda não recebeu depoimentos aprovados. Faça mais amigos! ;)
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(receivedQ.data ?? []).map((t) => card(t, "received"))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="enviados" className="mt-3">
              {(sentQ.data ?? []).length === 0 ? (
                <p className="text-[13px] text-[#4B6E9C]" data-testid="depoimentos-enviados-empty">
                  Você não escreveu depoimentos ainda. Visite um amigo e escreva o primeiro!
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(sentQ.data ?? []).map((t) => card(t, "sent"))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </RetroBox>
      </div>
    </Layout>
  );
}
