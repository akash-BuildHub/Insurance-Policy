"""AI Insurance Policy — FastAPI entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import seed
from .config import get_settings
from .database import Base, engine
from .routers import auth, profiles, companies, policies, recommendations, feedback, admin

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables (idempotent) and seed if empty
    Base.metadata.create_all(bind=engine)
    seed.run()
    yield


app = FastAPI(
    title="AI Insurance Policy API",
    description=(
        "AI-Powered Personalized Health Insurance Recommendation System. "
        "Academic prototype — not licensed financial advice."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(companies.router)
app.include_router(policies.router)
app.include_router(recommendations.router)
app.include_router(feedback.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["meta"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
