"""Seed demo data for the Orkut recriação — idempotent."""
import asyncio

from lib.auth import hash_password
from lib.db import db, ensure_indexes
from models.orkut import new_id, utcnow

DEMO_PASSWORD = "senha123"

USERS = [
    {
        "name": "Bruno G.",
        "email": "bruno@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces",
        "frase": "Mineiro não corre atrás: o dia chega nele.",
        "about_me": "Orkuteiro desde 2005. Bora trocar recado, depoimento e franja?",
        "city": "Belo Horizonte",
        "country": "Brasil",
    },
    {
        "name": "Carol Mendes",
        "email": "carol@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
        "frase": "Quem avisa amigo é.",
        "about_me": "Moderadora nata da comunidade Eu Odeio Acordar Cedo :D",
        "city": "São Paulo",
        "country": "Brasil",
    },
    {
        "name": "Rodrigo Silva",
        "email": "rodrigo@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
        "frase": "Primeiro o recado, depois o fórum.",
        "about_me": "Filósofo de boteco formado em campainha alheia ;)",
        "city": "Rio de Janeiro",
        "country": "Brasil",
    },
    {
        "name": "Juliana P.",
        "email": "juliana@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
        "frase": "Sempre online, nunca offline.",
        "about_me": "Coleciono emoticons e depoimentos sinceros (L)",
        "city": "Curitiba",
        "country": "Brasil",
    },
    {
        "name": "Ana Lima",
        "email": "ana@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
        "frase": "Frases curtas, amizades longas.",
        "about_me": "Escrevendo frases para camisas desde 2004.",
        "city": "Salvador",
        "country": "Brasil",
    },
    {
        "name": "Diego M.",
        "email": "diego@orkut.com",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
        "frase": "Recado novo é felicidade nova.",
        "about_me": "Recém-chegado, aceito convites de comunidade.",
        "city": "Porto Alegre",
        "country": "Brasil",
    },
]

FRIEND_PAIRS = [
    ("bruno@orkut.com", "carol@orkut.com"),
    ("bruno@orkut.com", "rodrigo@orkut.com"),
    ("bruno@orkut.com", "juliana@orkut.com"),
    ("bruno@orkut.com", "ana@orkut.com"),
    ("carol@orkut.com", "rodrigo@orkut.com"),
    ("carol@orkut.com", "juliana@orkut.com"),
    ("carol@orkut.com", "ana@orkut.com"),
    ("rodrigo@orkut.com", "juliana@orkut.com"),
    ("rodrigo@orkut.com", "ana@orkut.com"),
    ("juliana@orkut.com", "ana@orkut.com"),
]

PENDING_REQUESTS = [
    ("diego@orkut.com", "bruno@orkut.com"),
    ("diego@orkut.com", "carol@orkut.com"),
]

SCRAPS = [
    ("carol@orkut.com", "bruno@orkut.com", "Bruno, bom dia! :D Tudo certo pro churrasco de sábado? (K)"),
    ("rodrigo@orkut.com", "bruno@orkut.com", "O fórum da comunidade tá pegando fogo :o Bora responder lá (6)"),
    ("juliana@orkut.com", "bruno@orkut.com", "Saudades das discussões até de madrugada :( (L)"),
    ("ana@orkut.com", "bruno@orkut.com", "Passando pra deixar um oi :P"),
    ("bruno@orkut.com", "carol@orkut.com", "Carol, aquele link de MPB antiga que prometi: mandei no seu recado (F)"),
    ("rodrigo@orkut.com", "carol@orkut.com", "Hoje tem fórum novo às 22h ;)"),
    ("bruno@orkut.com", "rodrigo@orkut.com", "Convite aceito, (H) já tô dentro da comunidade."),
    ("carol@orkut.com", "juliana@orkut.com", "Ju, seu depoimento me deixou emocionada :') (L)"),
]

TESTIMONIALS = [
    ("carol@orkut.com", "bruno@orkut.com", "Confiável demais :D Daqueles amigos que chegam com o riso pronto. (L)", "accepted"),
    ("rodrigo@orkut.com", "bruno@orkut.com", "Conheço o Bruno desde 2006, aprovado (H). Parceiro de boteco e de filosofia.", "accepted"),
    ("juliana@orkut.com", "bruno@orkut.com", "Um dos orkuteiros mais antigos que conheci aqui. ;) Recomendo!", "pending"),
    ("bruno@orkut.com", "carol@orkut.com", "A Carol organiza nossas comunidades melhor que ninguém :D", "accepted"),
]

COMMUNITIES = [
    {
        "owner": "bruno@orkut.com",
        "name": "Saudades do Orkut",
        "category": "Nostalgia",
        "icon_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&h=120&fit=crop",
        "description": "Para quem passa o dia lembrando dos tempos dourados da internet brasileira.",
        "members": ["bruno@orkut.com", "carol@orkut.com", "rodrigo@orkut.com", "juliana@orkut.com", "ana@orkut.com"],
        "posts": [
            ("rodrigo@orkut.com", "Lembra do ênfase do 'me recusa'?? :D Quem mais sente falta dessa época?"),
            ("carol@orkut.com", "Meu pai ainda pergunta se 'aquele site do gelinho' voltou (H)"),
            ("bruno@orkut.com", "Voltei aqui só pra dizer: valeu a pena esperar :D"),
        ],
    },
    {
        "owner": "carol@orkut.com",
        "name": "Eu Odeio Acordar Cedo",
        "category": "Humor",
        "icon_url": "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=120&h=120&fit=crop",
        "description": "Se o seu despertador é o seu pior inimigo, essa é a sua comunidade.",
        "members": ["carol@orkut.com", "bruno@orkut.com", "juliana@orkut.com", "ana@orkut.com"],
        "posts": [
            ("ana@orkut.com", "Quem inventou a aula das 7h da manhã devia ser obrigado a frequentá-la :("),
            ("juliana@orkut.com", "Soneca de 5 minutos é a maior mentira da humanidade :P"),
        ],
    },
    {
        "owner": "juliana@orkut.com",
        "name": "Tocou a Campainha e Correu",
        "category": "Humor",
        "icon_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=120&h=120&fit=crop",
        "description": "Confesse aqui a sua arte sacana da infância ;)",
        "members": ["juliana@orkut.com", "rodrigo@orkut.com", "bruno@orkut.com"],
        "posts": [("rodrigo@orkut.com", "Na minha rua era uma lenda... ninguém nunca descobriu (6)")],
    },
    {
        "owner": "rodrigo@orkut.com",
        "name": "Filosofia de Boteco",
        "category": "Cultura",
        "icon_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
        "description": "Frases de mesa de bar que valem uma tese de doutorado.",
        "members": ["rodrigo@orkut.com", "bruno@orkut.com", "carol@orkut.com"],
        "posts": [("bruno@orkut.com", "Água mole em pedra dura... reflexões que só o balcão ensina (H)")],
    },
    {
        "owner": "ana@orkut.com",
        "name": "Frases e Pensamentos",
        "category": "Arte",
        "icon_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&h=120&fit=crop",
        "description": "Compartilhe frases para camisas, banners de MSN e recados (L)",
        "members": ["ana@orkut.com", "juliana@orkut.com", "carol@orkut.com"],
        "posts": [("ana@orkut.com", "Compartilhem suas frases favoritas aqui :D")],
    },
]

FANS = [
    ("carol@orkut.com", "bruno@orkut.com"),
    ("ana@orkut.com", "bruno@orkut.com"),
    ("juliana@orkut.com", "bruno@orkut.com"),
    ("bruno@orkut.com", "carol@orkut.com"),
    ("rodrigo@orkut.com", "carol@orkut.com"),
]


async def main() -> None:
    await ensure_indexes()

    # Mapear utilizadores existentes ou criá-los
    users: dict[str, dict] = {}
    async for doc in db.users.find({}):
        users[doc["email"]] = doc

    for u in USERS:
        if u["email"] not in users:
            doc = {
                "id": new_id(),
                "name": u["name"],
                "email": u["email"],
                "password_hash": hash_password(DEMO_PASSWORD),
                "avatar_url": u["avatar_url"],
                "frase": u["frase"],
                "about_me": u["about_me"],
                "city": u["city"],
                "country": u["country"],
                "created_at": utcnow(),
            }
            await db.users.insert_one(doc)
            users[u["email"]] = doc

    # Inserir amizades se não existirem
    for a, b in FRIEND_PAIRS:
        req_id = users[a]["id"]
        add_id = users[b]["id"]
        exists = await db.friendships.find_one({"requester_id": req_id, "addressee_id": add_id})
        if not exists:
            await db.friendships.insert_one(
                {
                    "id": new_id(),
                    "requester_id": req_id,
                    "addressee_id": add_id,
                    "status": "accepted",
                    "created_at": utcnow(),
                }
            )

    for a, b in PENDING_REQUESTS:
        req_id = users[a]["id"]
        add_id = users[b]["id"]
        exists = await db.friendships.find_one({"requester_id": req_id, "addressee_id": add_id})
        if not exists:
            await db.friendships.insert_one(
                {
                    "id": new_id(),
                    "requester_id": req_id,
                    "addressee_id": add_id,
                    "status": "pending",
                    "created_at": utcnow(),
                }
            )

    # Inserir comunidades e membros caso a coleção esteja vazia ou faltando
    for c in COMMUNITIES:
        existing_comm = await db.communities.find_one({"name": c["name"]})
        if not existing_comm:
            community = {
                "id": new_id(),
                "name": c["name"],
                "description": c["description"],
                "category": c["category"],
                "icon_url": c["icon_url"],
                "owner_id": users[c["owner"]]["id"],
                "member_count": len(c["members"]),
                "created_at": utcnow(),
            }
            await db.communities.insert_one(community)
            comm_id = community["id"]

            for member in c["members"]:
                await db.community_members.insert_one(
                    {
                        "id": new_id(),
                        "community_id": comm_id,
                        "user_id": users[member]["id"],
                        "role": "owner" if member == c["owner"] else "member",
                        "joined_at": utcnow(),
                    }
                )
            for author, body in c["posts"]:
                await db.community_posts.insert_one(
                    {
                        "id": new_id(),
                        "community_id": comm_id,
                        "author_id": users[author]["id"],
                        "body": body,
                        "created_at": utcnow(),
                    }
                )

    print("Seed executado com sucesso! Comunidades e dados populados.")


if __name__ == "__main__":
    asyncio.run(main())