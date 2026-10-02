from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class FeeEntry(Base):
    __tablename__ = 'fee_entries'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ownerId: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    caseId: Mapped[str | None] = mapped_column(ForeignKey('cases.id', ondelete='SET NULL'), nullable=True)
    kind: Mapped[str] = mapped_column(String(30))
    client: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Float)  # total a cobrar, IVA incluído
    hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    workDate: Mapped[str | None] = mapped_column(String(10), nullable=True)  # dia em que o trabalho foi feito (registos de tempo)
    vat: Mapped[str] = mapped_column(String(20), default='')
    dueDate: Mapped[str] = mapped_column(String(10))
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[str] = mapped_column(String(40))
