"""SQLAlchemy engine + session factory + Base."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    """Project-wide declarative Base."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a transactional session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
