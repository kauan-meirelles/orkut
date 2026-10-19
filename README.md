<div align="center">

# orkut <sup>clássico</sup>

**Uma recriação nostálgica do Orkut — a rede social que marcou os anos 2000 no Brasil.**
Recados, depoimentos, comunidades, fãs e aqueles medidores de "confiável, legal e sexy". Tudo de volta.

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
<br/>
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 💭 Sobre o projeto

O Orkut foi, para muita gente, a primeira rede social. Este projeto recria a experiência da versão clássica (2004–2014) em uma aplicação **full-stack** moderna: o visual e as funcionalidades são os de antigamente, mas por baixo tem React 19, FastAPI, MongoDB e autenticação com JWT.

A ideia foi ir além de uma tela bonita e implementar as **regras de negócio de verdade** de uma rede social: pedidos de amizade que precisam ser aceitos, depoimentos que só aparecem depois de aprovados pelo dono do perfil, comunidades em que só membros podem postar no fórum, entre outras.

## ✨ Funcionalidades

| | Funcionalidade | Como funciona |
|---|---|---|
| 🔐 | **Cadastro e login** | Senha com hash `pbkdf2_sha256` e sessão em cookie `httpOnly` assinado com JWT |
| 👤 | **Perfil** | Layout de 3 colunas com foto, frase, "quem sou eu", amigos, fãs, comunidades e os clássicos medidores de *confiável*, *legal* e *sexy* |
| 📝 | **Recados** | Mural público em cada perfil, com a barra de emoticons da época: `:)` `:D` `;)` `(L)` `(F)` `(6)`… |
| 💌 | **Depoimentos** | Um amigo escreve, o depoimento fica **pendente** e só aparece no perfil depois que o dono aprova |
| 👥 | **Amigos** | Busca de usuários e pedidos de amizade (enviar, aceitar, recusar e desfazer) |
| ⭐ | **Fãs** | Vire fã de alguém com um clique |
| 🏘️ | **Comunidades** | Diretório com busca, criação de comunidades, entrar e sair, e fórum exclusivo para membros |

## 🛠️ Tecnologias

**Frontend:** React 19 + TypeScript, Vite, Tailwind CSS 4, shadcn/ui, TanStack Query, React Router 7

**Backend:** Python, FastAPI, MongoDB (driver assíncrono `motor`), Pydantic, JWT (PyJWT), Passlib

### Destaques técnicos

- **Autenticação segura:** a sessão fica em um cookie `httpOnly`, que não pode ser lido por JavaScript (protege contra roubo de token via XSS).
- **API organizada por domínio:** os routers são separados (`auth`, `users`, `friendships`, `scraps`, `testimonials`, `communities`), todos sob `/api`.
- **Regras garantidas no banco:** índices únicos no MongoDB impedem dados duplicados, como dois pedidos de amizade entre as mesmas pessoas ou um e-mail cadastrado duas vezes.
- **Sem HTML injection:** os emoticons são guardados como texto puro e só viram emoji na hora de exibir.
- **Estado no frontend com TanStack Query:** cache, revalidação e atualização da tela após cada ação sem recarregar a página.

## 📂 Estrutura

```
orkut/
├── backend/
│   ├── server.py          # app FastAPI e registro das rotas
│   ├── seed.py            # popula o banco com usuários e dados de demonstração
│   ├── lib/               # auth (hash + JWT), conexão e índices do Mongo, datas
│   ├── models/            # schemas Pydantic
│   └── routers/           # auth, users/friendships, scraps, testimonials, communities
└── frontend/
    └── src/
        ├── pages/         # Login, Início, Perfil, Recados, Depoimentos, Amigos, Comunidades
        ├── components/    # componentes do Orkut (caixas retrô, medidores, emoticons) + shadcn/ui
        └── lib/           # cliente da API, sessão, tipos e hooks
```

## 🚀 Como rodar

Você precisa de **Python 3.11+**, **Node.js 20+** e um banco **MongoDB** (local ou [MongoDB Atlas](https://www.mongodb.com/atlas) gratuito).

### 1. Backend

```bash
cd backend
pip install fastapi "uvicorn[standard]" motor pymongo pydantic email-validator python-dotenv passlib pyjwt
```

Crie o arquivo `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=orkut
JWT_SECRET=troque-por-um-texto-longo-e-aleatorio
```

Popule o banco com os dados de demonstração e suba a API:

```bash
python seed.py
python -m uvicorn server:app --reload --port 8001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra **http://localhost:3000**. O Vite já redireciona as chamadas `/api` para o backend na porta 8001.

### 👋 Contas de demonstração

A tela de login tem botões de **login rápido**. Você também pode entrar com qualquer conta abaixo usando a senha `senha123`:

| Conta | O que tem de interessante |
|---|---|
| `bruno@orkut.com` | Dono da comunidade "Saudades do Orkut" e tem um depoimento esperando aprovação |
| `carol@orkut.com` | Dona de "Eu Odeio Acordar Cedo" e tem um pedido de amizade pendente |
| `rodrigo@orkut.com` | Dono de "Filosofia de Boteco" |
| `juliana@orkut.com` | Dona de "Tocou a Campainha e Correu" |

## 🔌 API

<details>
<summary><b>Ver todas as rotas</b></summary>

<br/>

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/signup` | Cria conta |
| `POST` | `/api/auth/login` | Entra e define o cookie de sessão |
| `POST` | `/api/auth/logout` | Sai e limpa o cookie |
| `GET` | `/api/auth/me` | Usuário logado |
| `GET` | `/api/users/search` | Busca usuários |
| `GET` | `/api/users/{id}` | Perfil completo |
| `PATCH` | `/api/users/me` | Edita o próprio perfil |
| `GET` | `/api/users/{id}/friends` | Amigos |
| `GET` | `/api/users/{id}/fans` | Fãs |
| `GET` | `/api/users/{id}/communities` | Comunidades do usuário |
| `POST` | `/api/users/{id}/friend-request` | Envia pedido de amizade |
| `DELETE` | `/api/users/{id}/friend` | Desfaz a amizade |
| `POST` | `/api/users/{id}/fan` | Vira fã / deixa de ser fã |
| `GET` `POST` | `/api/scraps` | Lista e envia recados |
| `DELETE` | `/api/scraps/{id}` | Apaga recado |
| `GET` `POST` | `/api/testimonials` | Lista e escreve depoimentos |
| `POST` | `/api/testimonials/{id}/accept` | Aprova depoimento |
| `POST` | `/api/testimonials/{id}/reject` | Recusa depoimento |
| `GET` `POST` | `/api/communities` | Lista e cria comunidades |
| `GET` | `/api/communities/{id}` | Detalhes da comunidade |
| `POST` | `/api/communities/{id}/join` | Entra na comunidade |
| `POST` | `/api/communities/{id}/leave` | Sai da comunidade |
| `GET` `POST` | `/api/communities/{id}/posts` | Fórum da comunidade |

Com o backend rodando, a documentação interativa fica em **http://localhost:8001/docs**.

</details>

---

<div align="center">

Feito com saudade por **[Kauan Meirelles](https://github.com/kauan-meirelles)** 💗

<sub>Projeto de estudo, sem nenhuma ligação com o Google ou com o Orkut original.</sub>

</div>
