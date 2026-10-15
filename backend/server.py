"""FastAPI application entrypoint for the Orkut Clássico backend."""

import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# MongoDB connection
from lib.db import client, db, ensure_indexes

from routers.auth import router as auth_router
from routers.communities import router as communities_router
from routers.scraps import router as scraps_router
from routers.testimonials import router as testimonials_router
from routers.users import friendships_router, router as users_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executado na inicialização do servidor
    logger.info("Starting up and ensuring database indexes...")
    await ensure_indexes()
    yield
    # Executado no encerramento do servidor
    logger.info("Shutting down database client...")
    client.close()


app = FastAPI(
    title="Orkut Clássico API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuração de CORS (caso necessário para o ambiente de desenvolvimento/frontend separado)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rota de verificação de status (Health Check)
@app.get("/api/status")
async def status_check():
    return [{"id": "status-1", "client_name": "System", "timestamp": "2026-06-06T00:00:00Z"}]


# Router principal agrupando todas as rotas sob o prefixo /api
api_router = APIRouter(prefix="/api")

# App routers — every route lives under /api
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(friendships_router)
api_router.include_router(scraps_router)
api_router.include_router(testimonials_router)
api_router.include_router(communities_router)

# Include the router in the main app
app.include_router(api_router)