from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


def _get_owned(db: Session, current_user: models.User, client_id: str) -> models.Client:
    client = db.get(models.Client, client_id)
    if client is None or client.ownerId != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente não encontrado.")
    return client


@router.get("", response_model=list[schemas.ClientPayload])
def list_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.execute(select(models.Client).where(models.Client.ownerId == current_user.id)).scalars().all()


@router.post("", response_model=schemas.ClientPayload, status_code=status.HTTP_201_CREATED)
def create_client(payload: schemas.ClientPayload, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if db.get(models.Client, payload.id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cliente já existe.")
    client = models.Client(ownerId=current_user.id, **payload.model_dump())
    db.add(client)
    db.commit()
    return client


@router.patch("/{client_id}", response_model=schemas.ClientPayload)
def update_client(client_id: str, payload: schemas.ClientUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    client = _get_owned(db, current_user, client_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    client = _get_owned(db, current_user, client_id)
    db.delete(client)
    db.commit()
