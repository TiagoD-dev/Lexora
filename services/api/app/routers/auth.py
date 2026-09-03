from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    normalized_email = payload.email.strip().lower()
    existing = db.execute(select(models.User).where(models.User.email == normalized_email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este email.")
    user = models.User(
        id=str(uuid4()),
        email=normalized_email,
        passwordHash=hash_password(payload.password),
        displayName=payload.displayName.strip(),
        professionalTitle=payload.professionalTitle.strip(),
        createdAt=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    return schemas.AuthResponse(accessToken=create_access_token(user.id), user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    normalized_email = payload.email.strip().lower()
    user = db.execute(select(models.User).where(models.User.email == normalized_email)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.passwordHash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou palavra-passe incorretos.")
    return schemas.AuthResponse(accessToken=create_access_token(user.id), user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    return current_user
