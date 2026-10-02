from typing import Any, Literal

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
    organization: str = ""
    phone: str = ""
    barNumber: str = ""
    primaryLegalArea: str = ""
    bio: str = ""
    role: str
    plan: str


class UserUpdate(BaseModel):
    displayName: str | None = Field(default=None, min_length=1, max_length=255)
    professionalTitle: str | None = Field(default=None, max_length=255)
    organization: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    barNumber: str | None = Field(default=None, max_length=40)
    primaryLegalArea: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=280)


class AuthResponse(BaseModel):
    accessToken: str
    user: UserOut


class CheckoutRequest(BaseModel):
    plan: str = Field(pattern="^(pro|office)$")
    cycle: str = Field(pattern="^(monthly|annual)$")


class CheckoutResponse(BaseModel):
    url: str


class DelayNotification(BaseModel):
    taskTitle: str
    caseTitle: str
    daysLate: int = Field(ge=0)


class ClientEmailRequest(BaseModel):
    to: EmailStr
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)


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
    notes: list[dict[str, Any]] = Field(default_factory=list)
    tasks: list[dict[str, Any]] = Field(default_factory=list)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    timeline: list[dict[str, Any]] = Field(default_factory=list)
    entities: list[dict[str, Any]] = Field(default_factory=list)
    facts: list[dict[str, Any]] = Field(default_factory=list)
    legalIssues: list[dict[str, Any]] = Field(default_factory=list)
    missingFacts: list[dict[str, Any]] = Field(default_factory=list)
    collaboratorEmails: list[str] = Field(default_factory=list)


class LegalUpdateOut(BaseModel):
    id: str
    source: str
    sourceKind: str
    title: str
    summary: str
    publishedAt: str | None = None
    url: str
    official: bool
    areas: list[str] = Field(default_factory=list)


class SimilarCaseOut(BaseModel):
    title: str
    court: str = ""
    date: str = ""
    summary: str
    url: str = ""


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=20_000)


class AssistantRequest(BaseModel):
    prompt: str = Field(min_length=1)
    history: list[ChatTurn] = Field(default_factory=list, max_length=40)


class AssistantAction(BaseModel):
    kind: Literal["task", "fact", "missing"]
    title: str
    dueDate: str | None = None
    reason: str = ""


class AssistantSource(BaseModel):
    title: str
    reference: str
    url: str
    excerpt: str


class AssistantResponse(BaseModel):
    reply: str
    actions: list[AssistantAction] = Field(default_factory=list)
    sources: list[AssistantSource] = Field(default_factory=list)


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
    collaboratorEmails: list[str] | None = None


class CollaboratorAdd(BaseModel):
    email: EmailStr
