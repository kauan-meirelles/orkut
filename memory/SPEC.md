# Orkut Clássico — SPEC

Recriação nostálgica do Orkut (2004) em pt-BR. Full-stack: FastAPI + MongoDB (motor) +
React 19 + Tailwind v4 + shadcn/ui (base-nova), TanStack Query, rotas sob `/api` via proxy Vite.

## Fluxos principais
- **Auth** (`/api/auth/*`): signup/login com email+senha (pbkdf2_sha256), sessão em cookie
  httpOnly `orkut_session` (JWT HS256, secret em `SESSION_SECRET` no backend/.env), logout limpa cookie.
  Frontend: `useMe()` (query key `["me"]`), `beginSession()`/`endSession()` em `lib/session.ts`.
- **Perfil** (`/perfil/:id`, id aceita `me`): 3 colunas — foto/frase/editar (dialog com 6 avatares
  preset), quem sou eu, medidores (confiável/legal/sexy determinísticos do id), recados,
  depoimentos, amigos, fãs, comunidades.
- **Recados** (`/recados`, `/recados/:userId`): mural público; POST/DELETE; barra de emoticons
  clássicos (`:)` `:D` `;)` `:P` `:(` `:o` `(H)` `(A)` `(6)` `(L)` `(K)` `(F)` `(P)` → emoji na renderização).
- **Amigos** (`/amigos`): busca de usuários (`/users/search`), pedido/aceitar/recusar/desfazer,
  pedidos pendentes em `/friendships/requests`.
- **Depoimentos** (`/depoimentos`): amigo escreve → status `pending` → dono aprova/rejeita.
  Tabs pendentes/recebidos/enviados.
- **Fãs**: toggle `POST /users/{id}/fan`, lista em `/users/{id}/fans`.
- **Comunidades** (`/comunidades`, `/comunidades/:id`): diretório + busca + criar (dialog),
  participar/abandonar, dono exclui; fórum com posts (só membros publicam).

## Modelo de dados (collections Mongo, ids uuid4 string)
`users` (email único), `friendships` (par único, status pending/accepted), `scraps`
(wall_user_id, author_id), `testimonials` (about_user_id, author_id, status), `fans`
(par user_id/target_id único), `communities` (owner_id, member_count denormalizado),
`community_members` (par único, role), `community_posts`. Índices em `lib/db.py::INDEXES`.

## Páginas
`/login` (público, contas demo 1-clique), `/inicio`, `/perfil[/:id]`, `/recados[/:userId]`,
`/depoimentos`, `/amigos`, `/comunidades[/:id]`. Gate de auth via `RequireAuth` (splash → redirect login).

## Seed
`backend/seed.py` (idempotente): 6 usuários demo, amizades mútuas, 2 pedidos pendentes
(diego→bruno, diego→carol), recados, depoimentos (3 aceitos + 1 pendente para bruno),
5 comunidades com fóruns. Rodar: `cd /app/backend && python seed.py`.
Credenciais em `memory/test_credentials.md`.

## Notas
- **Visual**: tema "orkut real" — fundo cinza-claro `#E8EBF2`, caixas brancas com cabeçalho cinza
  suave, links azuis `#28589C`, logo rosa "orkut beta" (Poppins 800) e acento rosa `#EC008C`
  (botões primários, nav ativa, contadores). Header branco com pills de nav cinza-escuro.
- Timestamps: armazenados aware-UTC, normalizados na leitura (`lib/joins.py::fix_dt`).
- Emoticons são render-only (texto cru armazenado, sem HTML injection).
- Medidores do perfil: hash determinístico do id (`routers/users.py::meters_for`).
