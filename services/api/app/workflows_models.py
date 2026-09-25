from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Workflow(Base):
    __tablename__ = 'workflows'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ownerId: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    name: Mapped[str] = mapped_column(String(255))
    area: Mapped[str] = mapped_column(String(40))
    completed: Mapped[list] = mapped_column(JSON, default=list)  # índices das etapas concluídas
    createdAt: Mapped[str] = mapped_column(String(40))
