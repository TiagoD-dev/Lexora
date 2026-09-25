import hashlib
import secrets
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

import jwt
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import models
from ..db import STORAGE_DIR, get_db
from ..portal_models import PortalAccess, PortalItem, PortalPublication
from ..security import JWT_ALGORITHM, JWT_SECRET, bearer_scheme, get_current_user, get_user_from_token, hash_password, verify_password

router = APIRouter(prefix='/portal', tags=['portal'])
STORAGE = STORAGE_DIR / 'portal'
MAX_SIZE = 25 * 1024 * 1024
ALLOWED = {'.pdf', '.docx', '.xlsx', '.txt', '.csv', '.png', '.jpg', '.jpeg'}


def now():
    return datetime.now(timezone.utc).isoformat()


class Input(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')


class Credentials(Input):
    accessId: str = Field(min_length=1, max_length=64)
    email: EmailStr
    password: str = Field(min_length=10, max_length=72)

    @field_validator('password')
    @classmethod
    def password_size(cls, value):
        if len(value.encode('utf-8')) > 72:
            raise ValueError('A palavra-passe não pode exceder 72 bytes.')
        return value


class Activation(Credentials):
    code: str = Field(min_length=1, max_length=128)


class PublicationInput(Input):
    published: bool
    summary: str = Field(max_length=10000)


class ItemInput(Input):
    kind: Literal['message', 'request', 'charge']
    text: str = Field(min_length=1, max_length=10000)
    amountCents: int | None = Field(default=None, gt=0, le=100000000, strict=True)
    dueDate: date | None = None
    instructions: str = Field(default='', max_length=2000)


class PaidInput(Input):
    paid: bool


def owned_client(db, user, client_id):
    client = db.get(models.Client, client_id)
    if not client or client.ownerId != user.id:
        raise HTTPException(404, 'Cliente não encontrado.')
    return client


def live_access(db, access):
    if not access or not access.active:
        raise HTTPException(401, 'Acesso inválido ou revogado. Contacta o escritório.')
    client = db.get(models.Client, access.clientId)
    if not client or client.ownerId != access.ownerId or client.email.strip().lower() != access.email:
        raise HTTPException(401, 'O acesso foi alterado. Solicita um novo convite ao escritório.')
    return access


def portal_token(access):
    return jwt.encode({'sub': access.id, 'aud': 'lexora-portal', 'version': access.version,
                       'exp': datetime.now(timezone.utc) + timedelta(hours=8)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def principal(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(401, 'Inicia sessão para continuar.')
    try:
        claims = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM], audience='lexora-portal')
    except jwt.PyJWTError:
        return get_user_from_token(credentials.credentials, db)
    access = live_access(db, db.get(PortalAccess, claims.get('sub')))
    if not access.passwordHash or access.version != claims.get('version'):
        raise HTTPException(401, 'Sessão terminada. Inicia sessão novamente.')
    return access


def client_principal(who=Depends(principal)):
    if not isinstance(who, PortalAccess):
        raise HTTPException(403, 'Usa o acesso do portal do cliente.')
    return who


def authorized_case(db, who, case_id):
    case = db.get(models.Case, case_id)
    client = db.get(models.Client, case.clientId) if case and case.clientId else None
    if not case or not client or client.ownerId != case.ownerId:
        raise HTTPException(404, 'Processo não encontrado ou sem cliente associado.')
    if isinstance(who, PortalAccess):
        publication = db.get(PortalPublication, case_id)
        if (case.ownerId != who.ownerId or case.clientId != who.clientId or not publication
                or not publication.published or publication.clientId != who.clientId or publication.ownerId != who.ownerId):
            raise HTTPException(404, 'Processo não disponível no portal.')
    elif case.ownerId != who.id:
        raise HTTPException(404, 'Processo não encontrado.')
    return case


def case_out(db, case):
    publication = db.get(PortalPublication, case.id)
    valid = publication and publication.clientId == case.clientId and publication.ownerId == case.ownerId
    return {'id': case.id, 'title': case.title, 'reference': case.reference, 'status': case.status,
            'responsible': case.responsible, 'published': bool(valid and publication.published),
            'summary': publication.summary if valid else '', 'updatedAt': publication.updatedAt if valid else None}


def item_out(item):
    return {'id': item.id, 'kind': item.kind, 'author': item.author, 'createdAt': item.createdAt,
            'data': {key: value for key, value in item.data.items() if key != 'storedName'}}


@router.get('/manage/clients/{client_id}')
def manage(client_id: str, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
           db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = owned_client(db, user, client_id)
    access = db.scalar(select(PortalAccess).where(PortalAccess.clientId == client_id))
    cases = db.scalars(select(models.Case).where(models.Case.ownerId == user.id, models.Case.clientId == client_id)
                       .limit(limit).offset(offset)).all()
    return {'client': {'id': client.id, 'name': client.name, 'email': client.email},
            'access': {'id': access.id, 'active': access.active, 'activated': bool(access.passwordHash),
                       'email': access.email, 'expiresAt': access.inviteExpiresAt} if access else None,
            'cases': [case_out(db, case) for case in cases]}


@router.post('/manage/clients/{client_id}/invite')
def invite(client_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = owned_client(db, user, client_id)
    from pydantic import TypeAdapter, ValidationError
    try:
        email = str(TypeAdapter(EmailStr).validate_python(client.email.strip())).lower()
    except ValidationError:
        raise HTTPException(422, 'Preenche um email válido na ficha do cliente.')
    access = db.scalar(select(PortalAccess).where(PortalAccess.clientId == client_id))
    if not access:
        access = PortalAccess(id=str(uuid4()), clientId=client_id, ownerId=user.id)
        db.add(access)
    code = secrets.token_urlsafe(32)
    access.email = email
    access.inviteHash = hashlib.sha256(code.encode()).hexdigest()
    access.inviteExpiresAt = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    access.version = str(uuid4())
    access.passwordHash = ''
    access.active = True
    access.failedAttempts = 0
    access.lockedUntil = ''
    db.commit()
    return {'accessId': access.id, 'code': code, 'expiresAt': access.inviteExpiresAt}


@router.delete('/manage/clients/{client_id}/access', status_code=204)
def revoke(client_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    owned_client(db, user, client_id)
    access = db.scalar(select(PortalAccess).where(PortalAccess.clientId == client_id))
    if access:
        access.active = False
        access.version = str(uuid4())
        db.commit()


def authenticate(db, payload, activate=False):
    access = live_access(db, db.get(PortalAccess, payload.accessId))
    if access.lockedUntil and access.lockedUntil > now():
        raise HTTPException(429, 'Demasiadas tentativas. Tenta novamente dentro de 15 minutos.')
    correct = str(payload.email).lower() == access.email
    if activate:
        correct = (correct and bool(access.inviteHash) and access.inviteExpiresAt > now()
                   and secrets.compare_digest(access.inviteHash, hashlib.sha256(payload.code.encode()).hexdigest()))
    else:
        correct = correct and bool(access.passwordHash) and verify_password(payload.password, access.passwordHash)
    if not correct:
        access.failedAttempts += 1
        if access.failedAttempts >= 10:
            access.lockedUntil = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            access.failedAttempts = 0
        db.commit()
        raise HTTPException(401, 'Credenciais ou convite inválidos. Confirma os dados com o escritório.')
    if activate:
        result = db.execute(update(PortalAccess).where(PortalAccess.id == access.id, PortalAccess.inviteHash == access.inviteHash)
                            .values(passwordHash=hash_password(payload.password), inviteHash='', inviteExpiresAt=''))
        if result.rowcount != 1:
            db.rollback()
            raise HTTPException(401, 'Este convite já foi utilizado.')
    access.failedAttempts = 0
    access.lockedUntil = ''
    db.commit()
    db.refresh(access)
    return {'accessToken': portal_token(access)}


@router.post('/activate')
def activate(payload: Activation, db: Session = Depends(get_db)):
    return authenticate(db, payload, True)


@router.post('/login')
def login(payload: Credentials, db: Session = Depends(get_db)):
    return authenticate(db, payload)


@router.post('/logout', status_code=204)
def logout(db: Session = Depends(get_db), access=Depends(client_principal)):
    access.version = str(uuid4())
    db.commit()


@router.get('/me')
def me(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
       db: Session = Depends(get_db), access=Depends(client_principal)):
    client = db.get(models.Client, access.clientId)
    owner = db.get(models.User, access.ownerId)
    cases = db.scalars(select(models.Case).join(PortalPublication, PortalPublication.caseId == models.Case.id)
                       .where(models.Case.clientId == access.clientId, models.Case.ownerId == access.ownerId,
                              PortalPublication.clientId == access.clientId, PortalPublication.ownerId == access.ownerId,
                              PortalPublication.published.is_(True))
                       .limit(limit).offset(offset)).all()
    return {'client': {'id': client.id, 'name': client.name, 'email': access.email},
            'office': owner.displayName if owner else 'Escritório', 'cases': [case_out(db, case) for case in cases]}


@router.put('/cases/{case_id}/publication')
def publish(case_id: str, payload: PublicationInput, db: Session = Depends(get_db), user=Depends(get_current_user)):
    case = authorized_case(db, user, case_id)
    publication = db.get(PortalPublication, case_id)
    if not publication:
        publication = PortalPublication(caseId=case_id)
        db.add(publication)
    publication.clientId, publication.ownerId = case.clientId, case.ownerId
    publication.published, publication.summary, publication.updatedAt = payload.published, payload.summary, now()
    db.commit()
    return case_out(db, case)


@router.get('/cases/{case_id}')
def detail(case_id: str, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
           db: Session = Depends(get_db), who=Depends(principal)):
    case = authorized_case(db, who, case_id)
    items = db.scalars(select(PortalItem).where(PortalItem.caseId == case.id, PortalItem.clientId == case.clientId,
                       PortalItem.ownerId == case.ownerId).order_by(PortalItem.createdAt, PortalItem.id)
                       .limit(limit).offset(offset)).all()
    return {'case': case_out(db, case), 'items': [item_out(item) for item in items]}


@router.post('/cases/{case_id}/items', status_code=201)
def add_item(case_id: str, payload: ItemInput, db: Session = Depends(get_db), who=Depends(principal)):
    case = authorized_case(db, who, case_id)
    is_client = isinstance(who, PortalAccess)
    if is_client and payload.kind != 'message':
        raise HTTPException(403, 'Apenas o escritório pode criar pedidos e valores.')
    if payload.kind == 'charge' and payload.amountCents is None:
        raise HTTPException(422, 'Indica o valor em cêntimos.')
    data = {'text': payload.text}
    if payload.kind == 'charge':
        data.update(amountCents=payload.amountCents, dueDate=payload.dueDate.isoformat() if payload.dueDate else None,
                    instructions=payload.instructions, paid=False, paidAt=None)
    item = PortalItem(id=str(uuid4()), caseId=case.id, clientId=case.clientId, ownerId=case.ownerId,
                      author='client' if is_client else 'office', kind=payload.kind, data=data, createdAt=now())
    db.add(item)
    db.commit()
    return item_out(item)


def owned_item(db, who, item_id):
    item = db.get(PortalItem, item_id)
    if not item:
        raise HTTPException(404, 'Registo não encontrado.')
    case = authorized_case(db, who, item.caseId)
    if item.clientId != case.clientId or item.ownerId != case.ownerId:
        raise HTTPException(404, 'Registo não encontrado.')
    return item


@router.patch('/charges/{item_id}')
def paid(item_id: str, payload: PaidInput, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = owned_item(db, user, item_id)
    if item.kind != 'charge':
        raise HTTPException(404, 'Valor não encontrado.')
    item.data = {**item.data, 'paid': payload.paid, 'paidAt': now() if payload.paid else None}
    db.commit()
    return item_out(item)


@router.post('/cases/{case_id}/documents', status_code=201)
async def upload(case_id: str, file: UploadFile = File(...), requestId: str | None = Form(None),
                 db: Session = Depends(get_db), who=Depends(principal)):
    case = authorized_case(db, who, case_id)
    if requestId:
        request = owned_item(db, who, requestId)
        if request.caseId != case.id or request.kind != 'request':
            raise HTTPException(422, 'Pedido de documento inválido.')
    name = (file.filename or 'documento').replace('\\', '/').split('/')[-1]
    name = ''.join(char for char in name if char.isprintable())[:200]
    if Path(name).suffix.lower() not in ALLOWED:
        raise HTTPException(415, 'Usa PDF, DOCX, XLSX, TXT, CSV, PNG ou JPEG.')
    content = await file.read(MAX_SIZE + 1)
    if not content or len(content) > MAX_SIZE:
        raise HTTPException(413, 'O ficheiro deve ter entre 1 byte e 25 MB.')
    STORAGE.mkdir(parents=True, exist_ok=True)
    stored_name = uuid4().hex
    path = STORAGE / stored_name
    path.write_bytes(content)
    item = PortalItem(id=str(uuid4()), caseId=case.id, clientId=case.clientId, ownerId=case.ownerId,
                      author='client' if isinstance(who, PortalAccess) else 'office', kind='document', createdAt=now(),
                      data={'name': name, 'size': len(content), 'storedName': stored_name, 'requestId': requestId})
    try:
        db.add(item)
        db.commit()
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise
    return item_out(item)


@router.get('/documents/{item_id}')
def download(item_id: str, db: Session = Depends(get_db), who=Depends(principal)):
    item = owned_item(db, who, item_id)
    if item.kind != 'document':
        raise HTTPException(404, 'Documento não encontrado.')
    name = item.data.get('storedName', '')
    if len(name) != 32 or any(char not in '0123456789abcdef' for char in name):
        raise HTTPException(404, 'Documento não encontrado.')
    path = STORAGE / name
    if not path.is_file():
        raise HTTPException(404, 'Ficheiro indisponível. Contacta o escritório.')
    return FileResponse(path, filename=item.data['name'], media_type='application/octet-stream',
                        headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})
