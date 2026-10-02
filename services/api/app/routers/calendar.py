import re
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..security import get_current_user
from .cases import list_cases

# iCalendar (RFC 5545) escrito à mão: um evento de dia inteiro por tarefa pendente com prazo.
router = APIRouter(tags=["calendar"])


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\r\n", "\\n").replace("\n", "\\n")


def _fold(line: str) -> str:
    """Parte linhas com mais de 75 octetos (RFC 5545 §3.1) sem cortar caracteres UTF-8."""
    parts, chunk = [], ""
    for char in line:
        if len((chunk + char).encode("utf-8")) > 75:
            parts.append(chunk)
            chunk = " "
        chunk += char
    return "\r\n".join([*parts, chunk])


def build_ics(cases: list[models.Case]) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lexora//Prazos//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Lexora · Prazos"]
    for case in cases:
        for task in case.tasks or []:
            due = str(task.get("dueDate") or "")
            if task.get("completed") or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", due):
                continue
            summary = f"[{case.reference}] {task.get('title', '')}"
            description = "\n".join(filter(None, [f"{case.title} · Prazo {task.get('deadlineKind', '')}", task.get("description")]))
            lines += [
                "BEGIN:VEVENT",
                f"UID:{task.get('id')}.{case.id}@lexora",
                f"DTSTAMP:{stamp}",
                f"DTSTART;VALUE=DATE:{due.replace('-', '')}",
                f"SUMMARY:{_escape(summary)}",
                f"DESCRIPTION:{_escape(description)}",
                "END:VEVENT",
            ]
    lines.append("END:VCALENDAR")
    return "".join(_fold(line) + "\r\n" for line in lines)


def _ics_response(db: Session, user: models.User) -> Response:
    return Response(build_ics(list_cases(db=db, current_user=user)), media_type="text/calendar; charset=utf-8", headers={"Cache-Control": "no-store"})


@router.get("/calendar.ics")
def calendar_for_session(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return _ics_response(db, current_user)


@router.get("/calendar/subscription")
def calendar_subscription(request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ponytail: um token fixo por utilizador, sem rotação; acrescentar um POST que gera outro se um URL for exposto.
    if not current_user.calendarToken:
        current_user.calendarToken = secrets.token_urlsafe(32)
        db.commit()
    return {"url": str(request.url_for("calendar_feed", token=current_user.calendarToken))}


@router.get("/calendar/{token}.ics", name="calendar_feed")
def calendar_feed(token: str, db: Session = Depends(get_db)):
    # Google Calendar/Outlook não enviam Bearer: o token secreto no URL é a credencial.
    user = db.execute(select(models.User).where(models.User.calendarToken == token)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendário não encontrado.")
    return _ics_response(db, user)
