from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    displayName: str = Field(min_length=1)
    professionalTitle: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    displayName: str
    professionalTitle: str
    role: str


class AuthResponse(BaseModel):
    accessToken: str
    user: UserOut


class ClientPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    status: str
    nif: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    notes: str = ""
    createdAt: str
    updatedAt: str


class ClientUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    status: str | None = None
    nif: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    updatedAt: str | None = None


class CasePayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reference: str
    title: str
    client: str
    clientId: str | None = None
    area: str
    court: str
    processNumber: str = ""
    responsible: str
    priority: str
    description: str = ""
    status: str
    createdAt: str
    updatedAt: str
    notes: list[dict[str, Any]] = []
    tasks: list[dict[str, Any]] = []
    documents: list[dict[str, Any]] = []
    timeline: list[dict[str, Any]] = []
    entities: list[dict[str, Any]] = []
    facts: list[dict[str, Any]] = []
    legalIssues: list[dict[str, Any]] = []
    missingFacts: list[dict[str, Any]] = []


class CaseUpdate(BaseModel):
    reference: str | None = None
    title: str | None = None
    client: str | None = None
    clientId: str | None = None
    area: str | None = None
    court: str | None = None
    processNumber: str | None = None
    responsible: str | None = None
    priority: str | None = None
    description: str | None = None
    status: str | None = None
    updatedAt: str | None = None
    notes: list[dict[str, Any]] | None = None
    tasks: list[dict[str, Any]] | None = None
    documents: list[dict[str, Any]] | None = None
    timeline: list[dict[str, Any]] | None = None
    entities: list[dict[str, Any]] | None = None
    facts: list[dict[str, Any]] | None = None
    legalIssues: list[dict[str, Any]] | None = None
    missingFacts: list[dict[str, Any]] | None = None
