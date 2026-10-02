from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    passwordHash: Mapped[str] = mapped_column(String(255))
    displayName: Mapped[str] = mapped_column(String(255), default="")
    professionalTitle: Mapped[str] = mapped_column(String(255), default="")
    organization: Mapped[str] = mapped_column(String(120), default="")
    phone: Mapped[str] = mapped_column(String(30), default="")
    barNumber: Mapped[str] = mapped_column(String(40), default="")
    primaryLegalArea: Mapped[str] = mapped_column(String(120), default="")
    bio: Mapped[str] = mapped_column(String(280), default="")
    role: Mapped[str] = mapped_column(String(20), default="user")
    plan: Mapped[str] = mapped_column(String(20), default="local")
    createdAt: Mapped[str] = mapped_column(String(40))


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ownerId: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(40))
    nif: Mapped[str] = mapped_column(String(40), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(60), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    createdAt: Mapped[str] = mapped_column(String(40))
    updatedAt: Mapped[str] = mapped_column(String(40))


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ownerId: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reference: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(255))
    client: Mapped[str] = mapped_column(String(255))
    clientId: Mapped[str | None] = mapped_column(String(64), nullable=True)
    area: Mapped[str] = mapped_column(String(120))
    court: Mapped[str] = mapped_column(String(255))
    processNumber: Mapped[str] = mapped_column(String(120), default="")
    responsible: Mapped[str] = mapped_column(String(120))
    priority: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40))
    createdAt: Mapped[str] = mapped_column(String(40))
    updatedAt: Mapped[str] = mapped_column(String(40))
    notes: Mapped[list] = mapped_column(JSON, default=list)
    tasks: Mapped[list] = mapped_column(JSON, default=list)
    documents: Mapped[list] = mapped_column(JSON, default=list)
    timeline: Mapped[list] = mapped_column(JSON, default=list)
    entities: Mapped[list] = mapped_column(JSON, default=list)
    facts: Mapped[list] = mapped_column(JSON, default=list)
    legalIssues: Mapped[list] = mapped_column(JSON, default=list)
    missingFacts: Mapped[list] = mapped_column(JSON, default=list)
    collaboratorEmails: Mapped[list] = mapped_column(JSON, default=list)
