from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..leads_models import Lead
from ..security import get_current_user

router = APIRouter(prefix="/leads", tags=["leads"])
Stage = Literal['Novo contacto', 'Consulta', 'Proposta', 'Contratado']


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(default='', max_length=255)
    area: str = Field(default='', max_length=60)
    source: str = Field(default='', max_length=60)
    notes: str = ''


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    area: str | None = Field(default=None, max_length=60)
    source: str | None = Field(default=None, max_length=60)
    notes: str | None = None
    stage: Stage | None = None
    value: float | None = Field(default=None, ge=0)
    clientId: str | None = Field(default=None, max_length=64)


class LeadPayload(LeadCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    stage: str
    value: float
    clientId: str
    createdAt: str


def _get_owned(db: Session, current_user: models.User, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.ownerId != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contacto não encontrado.")
    return lead


@router.get("", response_model=list[LeadPayload])
def list_leads(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.execute(select(Lead).where(Lead.ownerId == current_user.id).order_by(Lead.createdAt.desc())).scalars().all()


@router.post("", response_model=LeadPayload, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = Lead(id=str(uuid4()), ownerId=current_user.id, stage='Novo contacto', value=0, clientId='',
                createdAt=datetime.now(timezone.utc).isoformat(), **payload.model_dump())
    db.add(lead)
    db.commit()
    return lead


@router.patch("/{lead_id}", response_model=LeadPayload)
def update_lead(lead_id: str, payload: LeadUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = _get_owned(db, current_user, lead_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.delete(_get_owned(db, current_user, lead_id))
    db.commit()
