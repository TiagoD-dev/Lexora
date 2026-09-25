import json
import logging
import time
from html import escape

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import assistant, llm, models, schemas
from ..db import get_db
from ..email import send_email
from ..security import get_current_user
from . import notifications

router = APIRouter(prefix="/cases", tags=["cases"])
logger = logging.getLogger(__name__)

_STATUS_NOTICE = {
    "Em análise": "O seu processo encontra-se agora em análise pela nossa equipa.",
    "Concluído": "O seu processo foi concluído.",
}

def _get_owned(db: Session, current_user: models.User, case_id: str) -> models.Case:
    """Loads a case accessible to current_user: the owner, or a collaborator by email."""
    case = db.get(models.Case, case_id)
    if case is None or (case.ownerId != current_user.id and current_user.email not in (case.collaboratorEmails or [])):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Caso não encontrado.")
    return case


def _get_as_owner(db: Session, current_user: models.User, case_id: str) -> models.Case:
    """Like _get_owned, but rejects collaborators — for owner-only actions (managing collaborators)."""
    case = _get_owned(db, current_user, case_id)
    if case.ownerId != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Apenas o dono do caso pode fazer isto.")
    return case


SIMILAR_CASES_SYSTEM_INSTRUCTION = (
    "És um assistente de pesquisa jurídica. Usa a pesquisa Google para encontrar casos "
    "reais e já concluídos (acórdãos, sentenças) de tribunais portugueses ou europeus "
    "semelhantes ao Caso descrito. Responde APENAS com um array JSON, sem markdown, com "
    "no máximo 5 objetos no formato "
    '{"title": string, "court": string, "date": "AAAA-MM-DD" ou "", "summary": string até 240 '
    'caracteres, "url": string}. Se não encontrares nenhum caso real e verificável, devolve [].'
)

_SIMILAR_CASES_CACHE_TTL_SECONDS = 900
_similar_cases_cache: dict[str, tuple[float, list[dict]]] = {}


def _generate_similar_cases(case: models.Case) -> list[dict]:
    cache_key = f"{case.id}:{case.updatedAt}"
    cached = _similar_cases_cache.get(cache_key)
    now = time.monotonic()
    if cached and now - cached[0] < _SIMILAR_CASES_CACHE_TTL_SECONDS:
        return cached[1]
    context = {
        "title": case.title,
        "area": case.area,
        "court": case.court,
        "description": case.description,
        "legalIssues": case.legalIssues,
    }
    try:
        text = (llm.generate(SIMILAR_CASES_SYSTEM_INSTRUCTION, f"Caso (JSON):\n{json.dumps(context, ensure_ascii=False)}", web_search=True) or "[]").strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        results = json.loads(text)
        if not isinstance(results, list):
            results = []
    except Exception:
        logger.exception("Falha ao gerar casos semelhantes para o caso %s", case.id)
        results = cached[1] if cached else []
    _similar_cases_cache[cache_key] = (now, results)
    return results


@router.get("", response_model=list[schemas.CasePayload])
def list_cases(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cases = db.execute(select(models.Case)).scalars().all()
    return [
        case
        for case in cases
        if case.ownerId == current_user.id or current_user.email in (case.collaboratorEmails or [])
    ]


@router.post("", response_model=schemas.CasePayload, status_code=status.HTTP_201_CREATED)
def create_case(payload: schemas.CasePayload, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if db.get(models.Case, payload.id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Caso já existe.")
    case = models.Case(ownerId=current_user.id, **payload.model_dump())
    db.add(case)
    db.commit()
    return case


def _notify_client_status(db: Session, case: models.Case) -> None:
    notice = _STATUS_NOTICE.get(case.status)
    if not notice or not case.clientId:
        return
    client = db.get(models.Client, case.clientId)
    if client is None or not client.email:
        return
    subject = f"[LEXORA] Atualização do processo — {case.title}"
    body = (
        f"Exmo(a). {client.name},\n\n{notice}\n\n"
        f"Processo: {case.title} ({case.reference})\n\n"
        f"Com os melhores cumprimentos,\nEquipa LEXORA\n"
    )
    logo_html = (
        f'<img src="cid:{notifications._LOGO_CID}" alt="LEXORA" height="36" style="display:block;">'
        if notifications._logo_bytes
        else '<span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:2px;">LEXORA</span>'
    )
    html_body = f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:{notifications._BRAND_BACKGROUND};font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{notifications._BRAND_BACKGROUND};padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;">
<tr><td style="background:{notifications._BRAND_PRIMARY};padding:28px 32px;">
  {logo_html}
  <span style="color:{notifications._BRAND_ACCENT};font-size:11px;display:block;letter-spacing:1px;margin-top:6px;">ASSISTENTE JURÍDICO DIGITAL</span>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 18px;color:#17231D;font-size:14px;">Exmo(a). {escape(client.name)},</p>
  <p style="margin:0 0 20px;color:#17231D;font-size:14px;">{escape(notice)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{notifications._BRAND_BACKGROUND};border-radius:8px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 6px;color:#687169;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Processo</p>
      <p style="margin:0;color:#17231D;font-size:15px;font-weight:700;">{escape(case.title)} ({escape(case.reference)})</p>
    </td></tr>
  </table>
  <p style="margin:26px 0 0;color:#17231D;font-size:14px;">Com os melhores cumprimentos,<br/><strong>Equipa LEXORA</strong></p>
</td></tr>
<tr><td style="padding:16px 32px;background:{notifications._BRAND_BACKGROUND};text-align:center;">
  <span style="color:#7B847E;font-size:10px;">Este é um email automático do assistente jurídico digital LEXORA.</span>
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""
    inline_image = (notifications._logo_bytes, notifications._LOGO_CID) if notifications._logo_bytes else None
    try:
        send_email(client.email, subject, body, html_body, inline_image)
    except Exception:
        logger.exception("Falha ao enviar email de atualização de estado ao cliente %s", client.id)


@router.patch("/{case_id}", response_model=schemas.CasePayload)
def update_case(case_id: str, payload: schemas.CaseUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    previous_status = case.status
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    db.commit()
    if case.status != previous_status:
        _notify_client_status(db, case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    db.delete(case)
    db.commit()


@router.post("/{case_id}/assistant", response_model=schemas.AssistantResponse)
def ask_assistant(case_id: str, payload: schemas.AssistantRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    return assistant.reply(payload.prompt, case, [turn.model_dump() for turn in payload.history])


@router.post("/{case_id}/collaborators", response_model=schemas.CasePayload)
def add_collaborator(case_id: str, payload: schemas.CollaboratorAdd, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_as_owner(db, current_user, case_id)
    email = payload.email.lower()
    if email not in case.collaboratorEmails:
        case.collaboratorEmails = [*case.collaboratorEmails, email]
        db.commit()
    return case


@router.delete("/{case_id}/collaborators/{email}", response_model=schemas.CasePayload)
def remove_collaborator(case_id: str, email: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_as_owner(db, current_user, case_id)
    case.collaboratorEmails = [candidate for candidate in case.collaboratorEmails if candidate != email.lower()]
    db.commit()
    return case


@router.get("/{case_id}/similar-cases", response_model=list[schemas.SimilarCaseOut])
def get_similar_cases(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    return _generate_similar_cases(case)
