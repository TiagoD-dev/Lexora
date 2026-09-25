from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Lead(Base):
    __tablename__ = 'leads'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ownerId: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), default='')
    area: Mapped[str] = mapped_column(String(60), default='')
    source: Mapped[str] = mapped_column(String(60), default='')
    stage: Mapped[str] = mapped_column(String(40), default='Novo contacto')
    value: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default='')
    clientId: Mapped[str] = mapped_column(String(64), default='')
    createdAt: Mapped[str] = mapped_column(String(40))
