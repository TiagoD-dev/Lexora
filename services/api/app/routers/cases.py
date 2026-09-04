import json
import os

from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from google.genai import types as genai_types
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])

ASSISTANT_DISCLAIMER = (
    "Esta resposta organiza os dados do Caso; não substitui a validação das fontes "
    "nem a análise de um profissional habilitado."
)
ASSISTANT_SYSTEM_INSTRUCTION = (
    "És o assistente jurídico da Lexora. Respondes sempre em português de Portugal, "
    "de forma curta e direta. Usas apenas o contexto do Caso fornecido em JSON — nunca "
    "inventas factos, entidades ou documentos que não estejam nesse contexto. "
    f"Termina sempre a resposta com este aviso, exatamente: \"{ASSISTANT_DISCLAIMER}\""
)


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


def _generate_assistant_reply(prompt: str, case: models.Case) -> str:
    context = {
        "reference": case.reference,
        "title": case.title,
        "area": case.area,
        "facts": case.facts,
        "entities": case.entities,
        "documents": case.documents,
        "legalIssues": case.legalIssues,
        "missingFacts": case.missingFacts,
        "timeline": case.timeline,
    }
    client = genai.Client(
        api_key=os.environ["GEMINI_API_KEY"],
        http_options=genai_types.HttpOptions(retry_options=genai_types.HttpRetryOptions(attempts=3)),
    )
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=f"Contexto do Caso (JSON):\n{json.dumps(context, ensure_ascii=False)}\n\nPergunta: {prompt}",
        config=genai_types.GenerateContentConfig(system_instruction=ASSISTANT_SYSTEM_INSTRUCTION),
    )
    return response.text or ASSISTANT_DISCLAIMER


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


@router.post("/{case_id}/assistant", response_model=schemas.AssistantResponse)
def ask_assistant(case_id: str, payload: schemas.AssistantRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = _get_owned(db, current_user, case_id)
    reply = _generate_assistant_reply(payload.prompt, case)
    return {"reply": reply}


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
