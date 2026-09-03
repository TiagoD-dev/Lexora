from fastapi import APIRouter, Depends

from .. import models, schemas
from ..legal_updates import get_legal_updates
from ..security import get_current_user

router = APIRouter(prefix="/legal-updates", tags=["legal-updates"])


@router.get("", response_model=list[schemas.LegalUpdateOut])
def list_legal_updates(_current_user: models.User = Depends(get_current_user)) -> list[dict]:
    return get_legal_updates()
