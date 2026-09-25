import os
import re
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

API_ROOT = Path(__file__).resolve().parent.parent
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{API_ROOT / 'lexora.db'}")
# Os fornecedores dão "postgres://..."; o SQLAlchemy precisa do driver explícito (psycopg 3).
DATABASE_URL = re.sub(r"^postgres(ql)?://", "postgresql+psycopg://", DATABASE_URL)
# Ficheiros carregados (documentos dos casos e do portal); em produção, num volume persistente.
STORAGE_DIR = Path(os.environ.get("LEXORA_STORAGE_DIR", API_ROOT / "documents_storage"))

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
