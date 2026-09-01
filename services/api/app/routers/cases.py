from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])


def _get_owned(db: Session, current_user: models.User, case_id: str) -> models.Case:
    case = db.get(models.Case, case_id)
    if case is None or case.ownerId != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Caso não encontrado.")
    return case


@router.get("", response_model=list[schemas.CasePayload])
def list_cases(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.execute(select(models.Case).where(models.Case.ownerId == current_user.id)).scalars().all()


@router.post("", response_model=schemas.CasePayload, status_code=status.HTTP_201_CREATED)
def create_case(payload: schemas.CasePayload, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if db.get(models.Case, payload.id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Caso já existe.")
    case = models.Case(ownerId=current_user.id, **payload.model_dump())
    db.add(case)
    db.commit()
    return case


@router.patch("/{case_id}", response_model=schemas.CasePayload)
def update_case(case_id: str, payload: schemas.CaseUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    db.commit()
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    db.delete(case)
    db.commit()
