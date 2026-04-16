from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.exc import NoSuchModuleError, OperationalError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _sqlite_engine():
    sqlite_path = Path(__file__).resolve().parents[2] / "opsvision.db"
    return create_engine(
        f"sqlite:///{sqlite_path}",
        pool_pre_ping=True,
        future=True,
        connect_args={"check_same_thread": False},
    )


def _build_engine():
    try:
        primary_engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
    except (ModuleNotFoundError, NoSuchModuleError):
        # Fallback for environments where PostgreSQL driver isn't installed yet.
        return _sqlite_engine()

    try:
        with primary_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return primary_engine
    except OperationalError:
        # Fallback when DATABASE_URL is invalid/unreachable at runtime.
        return _sqlite_engine()


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

