from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401 — registers models on Base.metadata before create_all
from app.routes import brands, ingestion

app = FastAPI(title="RivalLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brands.router)
app.include_router(ingestion.router)


@app.on_event("startup")
def on_startup():
    # Dev convenience — creates tables if they don't exist yet.
    # Once you're on Postgres with real data, switch to Alembic migrations
    # instead of relying on this.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}