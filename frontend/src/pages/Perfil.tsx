import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { AVATAR_PRESETS, errMessage, fmtDate, fmtDateTime } from "@/lib/orkut";
import type { Community, FanToggle, Profile, Scrap, Testimonial, UserMe, UserPublic } from "@/lib/types";
import { Layout } from "@/components/orkut/Layout";
import { RetroBox } from "@/components/orkut/RetroBox";
import { Avatar, UserCard } from "@/components/orkut/cards";
import { EmoticonBar, EmoticonText } from "@/components/orkut/emoticons";
import { Meters } from "@/components/orkut/Meters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function Perfil() {
  const { id = "me" } = useParams();
  const { me } = useMe();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFrase, setEditFrase] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testBody, setTestBody] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile", id],
    queryFn: () => apiGet<Profile>(`/users/${id}`),
    retry: false,
  });
  const profile = profileQ.data;
  const uid = profile?.user.id;

  const scrapsQ = useQuery({
    queryKey: ["scraps", uid],
    queryFn: () => apiGet<Scrap[]>(`/scraps?user_id=${uid}`),
    enabled: !!uid,
  });
  const testimonialsQ = useQuery({
    queryKey: ["testimonials", uid, "accepted"],
    queryFn: () => apiGet<Testimonial[]>(`/testimonials?user_id=${uid}&status=accepted`),
    enabled: !!uid,
  });
  const friendsQ = useQuery({
    queryKey: ["friends", uid],
    queryFn: () => apiGet<UserPublic[]>(`/users/${uid}/friends`),
    enabled: !!uid,
  });
  const fansQ = useQuery({
    queryKey: ["fans", uid],
    queryFn: () => apiGet<UserPublic[]>(`/users/${uid}/fans`),
    enabled: !!uid,
  });
  const communitiesQ = useQuery({
    queryKey: ["userCommunities", uid],
    queryFn: () => apiGet<Community[]>(`/users/${uid}/communities`),
    enabled: !!uid,
  });

  const invalidateProfile = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["friends"] });
    qc.invalidateQueries({ queryKey: ["fans"] });
    qc.invalidateQueries({ queryKey: ["friendRequests"] });
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  const addFriend = useMutation({
    mutationFn: () => apiPost(`/users/${uid}/friend-request`),
    onSuccess: () => {
      invalidateProfile();
      toast.success("Pedido de amizade enviado!");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const removeFriend = useMutation({
    mutationFn: () => apiDelete<void>(`/users/${uid}/friend`),
    onSuccess: () => {
      invalidateProfile();
      toast.success("Amizade desfeita.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const acceptRequest = useMutation({
    mutationFn: (fid: string) => apiPost(`/friendships/${fid}/accept`),
    onSuccess: () => {
      invalidateProfile();
      toast.success("Agora vocês são amigos! :D");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const toggleFan = useMutation({
    mutationFn: () => apiPost<FanToggle>(`/users/${uid}/fan`),
    onSuccess: (r) => {
      invalidateProfile();
      toast.success(r.am_fan ? "Você virou fã! ⭐" : "Você deixou de ser fã.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const sendTestimonial = useMutation({
    mutationFn: () => apiPost<Testimonial>("/testimonials", { about_user_id: uid, body: testBody.trim() }),
    onSuccess: () => {
      setTestOpen(false);
      setTestBody("");
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Depoimento enviado! Ele aparece quando for aprovado.");
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const updateProfile = useMutation({
    mutationFn: () =>
      apiPatch<UserMe>("/users/me", {
        name: editName,
        frase: editFrase,
        about_me: editAbout,
        city: editCity,
        country: editCountry,
        avatar_url: editAvatar,
      }),
    onSuccess: () => {
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Perfil atualizado!");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.user.name);
    setEditFrase(profile.user.frase);
    setEditAbout(profile.user.about_me);
    setEditCity(profile.user.city);
    setEditCountry(profile.user.country);
    setEditAvatar(profile.user.avatar_url);
    setEditOpen(true);
  };

  if (profileQ.isLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_18rem]">
          <div className="h-48 animate-pulse rounded-[4px] bg-white/60" />
          <div className="h-64 animate-pulse rounded-[4px] bg-white/60" />
          <div className="h-64 animate-pulse rounded-[4px] bg-white/60" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <RetroBox title="Ops" testid="perfil-not-found">
          <p className="text-[13px] text-[#204070]">
            Este perfil não existe. Volte ao{" "}
            <Link to="/inicio" className="retro-link">
              início
            </Link>
            .
          </p>
        </RetroBox>
      </Layout>
    );
  }

  const scraps = (scrapsQ.data ?? []).slice(0, 3);
  const testimonials = testimonialsQ.data ?? [];
  const friends = friendsQ.data ?? [];
  const fans = fansQ.data ?? [];
  const communities = communitiesQ.data ?? [];
  const location = [profile.user.city, profile.user.country].filter(Boolean).join(", ");

  return (
    <Layout>
      <div className="flex flex-col gap-4" data-testid="perfil-page">
        <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-breadcrumb">
          orkut &gt; {profile.is_me ? "meu perfil" : `perfil de ${profile.user.name}`}
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_18rem]">
          {/* left column — photo, about, meters */}
          <div className="flex flex-col gap-4">
            <RetroBox testid="perfil-photo-box" bodyClassName="flex flex-col items-center gap-2 text-center">
              <Avatar user={profile.user} size="lg" />
              <div>
                <h1 className="text-lg font-bold text-[#204070]" data-testid="perfil-name">
                  {profile.user.name}
                </h1>
                {profile.user.frase && (
                  <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-frase">
                    “{profile.user.frase}”
                  </p>
                )}
              </div>
              {profile.is_me && (
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid="perfil-edit-btn"
                  onClick={openEdit}
                >
                  editar meu perfil
                </Button>
              )}
            </RetroBox>

            <RetroBox title="quem sou eu" testid="perfil-about-box">
              <p className="text-[13px] text-[#204070]" data-testid="perfil-about-text">
                {profile.user.about_me || "Nada escrito ainda... :o"}
              </p>
              {location && (
                <p className="mt-2 text-[12px] text-[#4B6E9C]" data-testid="perfil-location">
                  📍 {location}
                </p>
              )}
              <p className="mt-1 text-[11px] text-[#4B6E9C]" data-testid="perfil-since">
                no orkut desde {fmtDate(profile.user.created_at)}
              </p>
            </RetroBox>

            <RetroBox title="medidores" testid="perfil-meters-box">
              <Meters meters={profile.meters} />
            </RetroBox>
          </div>

          {/* center column — actions, scraps, testimonials */}
          <div className="flex min-w-0 flex-col gap-4">
            {!profile.is_me && (
              <div className="flex flex-wrap gap-2" data-testid="perfil-actions">
                {profile.incoming_request_id ? (
                  <>
                    <Button
                      size="sm"
                      data-testid="friend-accept-btn"
                      disabled={acceptRequest.isPending}
                      onClick={() => acceptRequest.mutate(profile.incoming_request_id ?? "")}
                    >
                      aceitar pedido de amizade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="friend-reject-btn"
                      disabled={removeFriend.isPending}
                      onClick={() => removeFriend.mutate()}
                    >
                      recusar
                    </Button>
                  </>
                ) : profile.is_friend ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid="friend-remove-btn"
                    disabled={removeFriend.isPending}
                    onClick={() => removeFriend.mutate()}
                  >
                    são amigos ✓ · remover
                  </Button>
                ) : profile.outgoing_request_id ? (
                  <Button size="sm" variant="secondary" disabled data-testid="friend-pending-btn">
                    pedido enviado
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    data-testid="friend-request-btn"
                    disabled={addFriend.isPending}
                    onClick={() => addFriend.mutate()}
                  >
                    adicionar amigo
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={profile.am_fan ? "secondary" : "outline"}
                  data-testid="fan-toggle-btn"
                  disabled={toggleFan.isPending}
                  onClick={() => toggleFan.mutate()}
                >
                  {profile.am_fan ? "deixar de ser fã" : "ser fã ⭐"}
                </Button>
                {profile.is_friend && (
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="testimonial-open-btn"
                    onClick={() => setTestOpen(true)}
                  >
                    escrever depoimento
                  </Button>
                )}
              </div>
            )}

            <RetroBox
              title={`recados (${profile.scraps_count})`}
              testid="perfil-scraps-box"
              action={
                <Link
                  to={`/recados/${profile.user.id}`}
                  className="retro-link text-[12px]"
                  data-testid="perfil-scraps-link"
                >
                  ver todos
                </Link>
              }
            >
              {scrapsQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando recados...</p>
              ) : scraps.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-scraps-empty">
                  Nenhum recado ainda —{" "}
                  <Link to={`/recados/${profile.user.id}`} className="retro-link">
                    deixe o primeiro :)
                  </Link>
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {scraps.map((s) => (
                    <li key={s.id} className="border-b border-dotted border-[#B0C4DE] pb-2 last:border-0 last:pb-0">
                      <p className="text-[11px] text-[#4B6E9C]">
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

            <RetroBox
              title={`depoimentos (${profile.testimonials_count})`}
              testid="perfil-testimonials-box"
              action={
                profile.is_me ? (
                  <Link to="/depoimentos" className="retro-link text-[12px]" data-testid="perfil-testimonials-link">
                    gerenciar
                  </Link>
                ) : undefined
              }
            >
              {testimonialsQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando depoimentos...</p>
              ) : testimonials.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-testimonials-empty">
                  Nenhum depoimento aprovado ainda.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {testimonials.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-[3px] border border-[#B0C4DE] bg-[#EBF2FC] px-2 py-1.5"
                      data-testid={`perfil-testimonial-${t.id}`}
                    >
                      <p className="text-[11px] text-[#4B6E9C]">
                        <Link to={`/perfil/${t.author.id}`} className="font-semibold text-[#28589C] hover:underline">
                          {t.author.name}
                        </Link>{" "}
                        · {fmtDate(t.created_at)}
                      </p>
                      <EmoticonText text={t.body} className="text-[13px] text-[#204070]" />
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>
          </div>

          {/* right column — friends, fans, communities */}
          <div className="flex flex-col gap-4">
            <RetroBox
              title={`amigos (${profile.friends_count})`}
              testid="perfil-friends-box"
              action={
                profile.is_me ? (
                  <Link to="/amigos" className="retro-link text-[12px]" data-testid="perfil-friends-link">
                    ver todos
                  </Link>
                ) : undefined
              }
            >
              {friendsQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando amigos...</p>
              ) : friends.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-friends-empty">
                  Nenhum amigo ainda.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {friends.slice(0, 9).map((f) => (
                    <UserCard key={f.id} user={f} size="sm" />
                  ))}
                </div>
              )}
            </RetroBox>

            <RetroBox title={`fãs (${profile.fans_count})`} testid="perfil-fans-box">
              {fansQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando fãs...</p>
              ) : fans.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-fans-empty">
                  Ainda não há fãs por aqui ⭐
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {fans.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <Avatar user={f} size="xs" />
                      <Link
                        to={`/perfil/${f.id}`}
                        className="truncate text-[12px] font-medium text-[#28589C] hover:underline"
                        data-testid={`perfil-fan-${f.id}`}
                      >
                        {f.name}
                      </Link>
                      <span className="ml-auto text-[11px]">⭐</span>
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>

            <RetroBox title={`comunidades (${profile.communities_count})`} testid="perfil-communities-box">
              {communitiesQ.isLoading ? (
                <p className="text-[12px] text-[#4B6E9C]">carregando comunidades...</p>
              ) : communities.length === 0 ? (
                <p className="text-[12px] text-[#4B6E9C]" data-testid="perfil-communities-empty">
                  Nenhuma comunidade ainda.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {communities.slice(0, 6).map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <img
                        src={c.icon_url}
                        alt={`ícone da comunidade ${c.name}`}
                        className="h-8 w-8 rounded-[3px] border border-[#B0C4DE] object-cover"
                      />
                      <Link
                        to={`/comunidades/${c.id}`}
                        className="truncate text-[12px] font-medium text-[#28589C] hover:underline"
                        data-testid={`perfil-community-${c.id}`}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </RetroBox>
          </div>
        </div>
      </div>

      {/* edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" data-testid="perfil-edit-dialog">
          <DialogHeader>
            <DialogTitle data-testid="perfil-edit-title">Editar meu perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                data-testid="edit-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-frase">Frase de efeito</Label>
              <Input
                id="edit-frase"
                data-testid="edit-frase-input"
                value={editFrase}
                onChange={(e) => setEditFrase(e.target.value)}
                maxLength={120}
                placeholder="algo com sábio e enigmático :P"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-about">Quem sou eu</Label>
              <Textarea
                id="edit-about"
                data-testid="edit-about-input"
                value={editAbout}
                onChange={(e) => setEditAbout(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  data-testid="edit-city-input"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="edit-country">País</Label>
                <Input
                  id="edit-country"
                  data-testid="edit-country-input"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Foto do perfil</Label>
              <div className="flex flex-wrap gap-2" data-testid="edit-avatar-picker">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    data-testid={`avatar-option-${i}`}
                    onClick={() => setEditAvatar(url)}
                    className={cn(
                      "rounded-[3px] border-2 p-0.5 transition-colors duration-150",
                      editAvatar === url ? "border-[#ED258C]" : "border-transparent",
                    )}
                  >
                    <img src={url} alt={`opção de foto ${i + 1}`} className="h-11 w-11 rounded-[2px] object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" data-testid="edit-cancel-btn" onClick={() => setEditOpen(false)}>
                cancelar
              </Button>
              <Button
                size="sm"
                data-testid="edit-save-btn"
                disabled={updateProfile.isPending || editName.trim().length < 2}
                onClick={() => updateProfile.mutate()}
              >
                salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* write testimonial dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md" data-testid="testimonial-dialog">
          <DialogHeader>
            <DialogTitle data-testid="testimonial-dialog-title">
              Escrever depoimento para {profile.user.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Textarea
              data-testid="testimonial-textarea"
              rows={4}
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              maxLength={2000}
              placeholder="Escreva algo sincero sobre este amigo... (L)"
            />
            <EmoticonBar onPick={(code) => setTestBody((b) => `${b} ${code}`)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" data-testid="testimonial-cancel-btn" onClick={() => setTestOpen(false)}>
                cancelar
              </Button>
              <Button
                size="sm"
                data-testid="testimonial-send-btn"
                disabled={!testBody.trim() || sendTestimonial.isPending}
                onClick={() => sendTestimonial.mutate()}
              >
                enviar depoimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
} 