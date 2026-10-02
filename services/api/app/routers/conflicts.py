import unicodedata

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


def normalize(text: str | None) -> str:
    """Sem acentos, minúsculas, espaços colapsados — 'José  Silva ' == 'jose silva'."""
    stripped = "".join(c for c in unicodedata.normalize("NFKD", text or "") if not unicodedata.combining(c))
    return " ".join(stripped.casefold().split())


def _nif(text: str | None) -> str:
    return "".join(c for c in text or "" if c.isalnum()).upper().removeprefix("PT")  # "PT 509 999 999" == "509999999"


def _is_opposing(role: str | None) -> bool:
    # ponytail: o papel é texto livre; basta conter "contrari" ("Parte contrária", "Contrária").
    # Alargar a "réu"/"requerido" se os utilizadores usarem esses termos.
    return "contrari" in normalize(role)


@router.get("/check")
def check_conflicts(name: str = "", nif: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)) -> dict:
    """Conflito de interesses: casos do utilizador onde name/nif é parte contrária, e clientes que coincidem."""
    key, tax = normalize(name), _nif(nif)
    if not key and not tax:
        return {"cases": [], "clients": []}

    def matches(other_name: str | None, other_nif: str | None) -> bool:
        return bool((key and normalize(other_name) == key) or (tax and _nif(other_nif) == tax))

    # ponytail: varrimento em Python de todos os casos/clientes do utilizador; mover para SQL se houver milhares.
    cases = db.execute(select(models.Case).where(models.Case.ownerId == current_user.id)).scalars()
    clients = db.execute(select(models.Client).where(models.Client.ownerId == current_user.id)).scalars()
    return {
        "cases": [
            {"id": case.id, "reference": case.reference, "title": case.title, "party": entity.get("name", "")}
            for case in cases
            for entity in case.entities or []
            if isinstance(entity, dict) and _is_opposing(entity.get("role")) and matches(entity.get("name"), entity.get("nif"))
        ],
        "clients": [{"id": client.id, "name": client.name} for client in clients if matches(client.name, client.nif)],
    }
