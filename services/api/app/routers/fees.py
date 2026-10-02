from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..fees_models import FeeEntry
from ..security import get_current_user

router = APIRouter(prefix="/fees", tags=["fees"])


class FeeCreate(BaseModel):
    caseId: str | None = None
    kind: str = Field(max_length=30)
    client: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    hours: float | None = Field(default=None, gt=0)
    workDate: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    vat: str = Field(default="", max_length=20)
    dueDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    paid: bool = False


class FeePayload(FeeCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    createdAt: str


class FeeUpdate(BaseModel):
    paid: bool | None = None
    description: str | None = None
    amount: float | None = Field(default=None, gt=0)
    dueDate: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


def _get_owned(db: Session, current_user: models.User, fee_id: str) -> FeeEntry:
    fee = db.get(FeeEntry, fee_id)
    if fee is None or fee.ownerId != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registo não encontrado.")
    return fee


@router.get("", response_model=list[FeePayload])
def list_fees(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.execute(select(FeeEntry).where(FeeEntry.ownerId == current_user.id)).scalars().all()


@router.post("", response_model=FeePayload, status_code=status.HTTP_201_CREATED)
def create_fee(payload: FeeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fee = FeeEntry(id=str(uuid4()), ownerId=current_user.id, createdAt=datetime.now(timezone.utc).isoformat(), **payload.model_dump())
    db.add(fee)
    db.commit()
    return fee


@router.patch("/{fee_id}", response_model=FeePayload)
def update_fee(fee_id: str, payload: FeeUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fee = _get_owned(db, current_user, fee_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(fee, field, value)
    db.commit()
    return fee


@router.delete("/{fee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee(fee_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.delete(_get_owned(db, current_user, fee_id))
    db.commit()
