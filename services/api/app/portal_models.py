from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class PortalAccess(Base):
    __tablename__ = 'portal_access'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    clientId: Mapped[str] = mapped_column(ForeignKey('clients.id'), unique=True, index=True)
    ownerId: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    email: Mapped[str] = mapped_column(String(255))
    passwordHash: Mapped[str] = mapped_column(String(255), default='')
    inviteHash: Mapped[str] = mapped_column(String(64), default='')
    inviteExpiresAt: Mapped[str] = mapped_column(String(40), default='')
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[str] = mapped_column(String(36))
    failedAttempts: Mapped[int] = mapped_column(Integer, default=0)
    lockedUntil: Mapped[str] = mapped_column(String(40), default='')


class PortalPublication(Base):
    __tablename__ = 'portal_publications'
    caseId: Mapped[str] = mapped_column(ForeignKey('cases.id'), primary_key=True)
    clientId: Mapped[str] = mapped_column(String(64), index=True)
    ownerId: Mapped[str] = mapped_column(String(36))
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    summary: Mapped[str] = mapped_column(Text, default='')
    updatedAt: Mapped[str] = mapped_column(String(40))


class PortalItem(Base):
    __tablename__ = 'portal_items'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    caseId: Mapped[str] = mapped_column(ForeignKey('cases.id'), index=True)
    clientId: Mapped[str] = mapped_column(String(64), index=True)
    ownerId: Mapped[str] = mapped_column(String(36))
    kind: Mapped[str] = mapped_column(String(20))
    author: Mapped[str] = mapped_column(String(20))
    createdAt: Mapped[str] = mapped_column(String(40))
    data: Mapped[dict] = mapped_column(JSON, default=dict)
