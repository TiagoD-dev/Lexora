import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .db import get_db

DEFAULT_JWT_SECRET = "dev-secret-change-me-at-least-32-bytes"
JWT_SECRET = os.environ.get("LEXORA_JWT_SECRET", DEFAULT_JWT_SECRET)
APP_ENV = os.environ.get("LEXORA_ENV", "development").strip().lower()
if APP_ENV == "production" and JWT_SECRET == DEFAULT_JWT_SECRET:
    raise RuntimeError("LEXORA_JWT_SECRET tem de ser definido com um valor seguro em produção.")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_DAYS = 30

bearer_scheme = HTTPBearer(auto_error=False)

INVALID_SESSION_MESSAGE = "Sessão inválida. Inicia sessão novamente."


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_SESSION_MESSAGE)
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_SESSION_MESSAGE)
    user = db.get(models.User, payload.get("sub"))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_SESSION_MESSAGE)
    return user
