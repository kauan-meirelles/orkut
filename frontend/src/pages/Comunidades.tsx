import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { COMMUNITY_CATEGORIES, errMessage } from "@/lib/orkut";
import type { Community } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Comunidades() {
  const { me } = useMe();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Outros");
  const [description, setDescription] = useState("");

  const listQ = useQuery({
    queryKey: ["communities", q],
    queryFn: () => apiGet<Community[]>(`/communities?q=${encodeURIComponent(q)}`),
  });
  const mineQ = useQuery({
    queryKey: ["myCommunities"],
    queryFn: () => apiGet<Community[]>("/communities/mine"),
    enabled: !!me,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["communities"] });
    qc.invalidateQueries({ queryKey: ["community"] });
    qc.invalidateQueries({ queryKey: ["myCommunities"] });
    qc.invalidateQueries({ queryKey: ["userCommunities"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const join = useMutation({
    mutationFn: (id: string) => apiPost<Community>(`/communities/${id}/join`),
    onSuccess: (c) => {
      invalidate();
      toast.success(`Você entrou em ${c.name}! :D`);
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const leave = useMutation({
    mutationFn: (id: string) => apiPost<Community>(`/communities/${id}/leave`),
    onSuccess: (c) => {
      invalidate();
      toast.success(`Você saiu de ${c.name}.`);
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const create = useMutation({
    mutationFn: () =>
      apiPost<Community>("/communities", { name: name.trim(), category, description: description.trim() }),
    onSuccess: (c) => {
      setCreateOpen(false);
      setName("");
      setDescription("");
      invalidate();
      toast.success(`Comunidade “${c.name}” criada!`);
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const communities = listQ.data ?? [];
  const mine = mineQ.data ?? [];

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="comunidades-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="comunidades-breadcrumb">
          orkut &gt; comunidades
        </p>

        <RetroBox
          title="Comunidades do orkut"
          testid="comunidades-directory-box"
          action={
            <Button size="xs" data-testid="community-create-btn" onClick={() => setCreateOpen(true)}>
              criar comunidade
            </Button>
          }
        >
          <form
            className="flex gap-2"
            data-testid="comunidades-search-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              data-testid="community-search-input"
              placeholder="buscar comunidades..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>

          {listQ.isLoading ? (
            <p className="mt-3 text-[12px] text-[#4B6E9C]">carregando comunidades...</p>
          ) : communities.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#4B6E9C]" data-testid="comunidades-empty">
              Nenhuma comunidade encontrada{q ? ` para “${q}”` : ""}. Que tal criar a primeira? :)
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {communities.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-2 rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] p-2"
                  data-testid={`community-card-${c.id}`}
                >
                  <img
                    src={c.icon_url}
                    alt={`ícone da comunidade ${c.name}`}
                    className="h-12 w-12 rounded-[3px] border border-[#B0C4DE] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/comunidades/${c.id}`}
                      className="block truncate text-[13px] font-semibold text-[#28589C] hover:underline"
                      data-testid={`community-link-${c.id}`}
                    >
                      {c.name}
                    </Link>
                    <p className="text-[11px] text-[#4B6E9C]">
                      {c.member_count} participante{c.member_count === 1 ? "" : "s"} · {c.category}
                    </p>
                    <Button
                      size="xs"
                      variant={c.is_member ? "secondary" : "outline"}
                      className="mt-1"
                      data-testid={c.is_member ? `community-leave-btn-${c.id}` : `community-join-btn-${c.id}`}
                      disabled={join.isPending || leave.isPending}
                      onClick={() => (c.is_member ? leave.mutate(c.id) : join.mutate(c.id))}
                    >
                      {c.is_member ? "abandonar" : "participar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RetroBox>

        {mine.length > 0 && (
          <RetroBox title={`Minhas comunidades (${mine.length})`} testid="comunidades-mine-box">
            <div className="flex flex-wrap gap-2">
              {mine.map((c) => (
                <Link
                  key={c.id}
                  to={`/comunidades/${c.id}`}
                  data-testid={`mine-community-${c.id}`}
                  className="flex items-center gap-1.5 rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-2 py-1 text-[12px] font-medium text-[#28589C] transition-colors duration-150 hover:brightness-95"
                >
                  <img
                    src={c.icon_url}
                    alt=""
                    className="h-6 w-6 rounded-[2px] border border-[#B0C4DE] object-cover"
                  />
                  {c.name}
                </Link>
              ))}
            </div>
          </RetroBox>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" data-testid="community-create-dialog">
          <DialogHeader>
            <DialogTitle data-testid="community-create-title">Criar comunidade</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="community-name">Nome</Label>
              <Input
                id="community-name"
                data-testid="community-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="ex.: Vaca Amarela"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v: string) => setCategory(v)}>
                <SelectTrigger data-testid="community-category-select" className="w-full">
                  <SelectValue>{(v: string) => v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COMMUNITY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`community-category-${cat}`}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="community-description">Descrição</Label>
              <Textarea
                id="community-description"
                data-testid="community-description-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Sobre o que é essa comunidade? (L)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" data-testid="community-create-cancel-btn" onClick={() => setCreateOpen(false)}>
                cancelar
              </Button>
              <Button
                size="sm"
                data-testid="community-create-submit-btn"
                disabled={name.trim().length < 3 || create.isPending}
                onClick={() => create.mutate()}
              >
                criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}