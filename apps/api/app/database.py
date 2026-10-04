import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()


def _build_engine():
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url or "[YOUR-" in database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Create apps/api/.env with your Supabase connection string "
            "(see .env.example)."
        )
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]
    if database_url.startswith("postgresql://"):
        database_url = "postgresql+psycopg://" + database_url[len("postgresql://"):]

    # Prepared statements break behind Supabase's transaction pooler (port 6543), so turn them off.
    connect_args = {"prepare_threshold": None}
    if os.getenv("VERCEL"):
        # Serverless instances come and go; let the Supabase pooler hold connections instead of each instance.
        return create_engine(database_url, poolclass=NullPool, connect_args=connect_args)
    return create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
