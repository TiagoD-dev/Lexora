"""Envio de notificações push via Expo Push API (sem SDK, só stdlib)."""
from __future__ import annotations

import json
import logging
import urllib.request

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from . import models

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _post(messages: list[dict]) -> dict:
    request = urllib.request.Request(
        EXPO_PUSH_URL,
        data=json.dumps(messages).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.load(response)


def send_push(db: Session, user_id: str, title: str, body: str, data: dict | None = None) -> None:
    """Envia para todos os dispositivos do utilizador. Nunca lança: push é acessório ao email."""
    # ponytail: envio síncrono num único pedido (Expo aceita até 100 mensagens); passar a fila/BackgroundTasks se houver muitos dispositivos ou latência.
    try:
        tokens = list(db.scalars(select(models.PushToken.token).where(models.PushToken.userId == user_id)))
        if not tokens:
            return
        messages = [{"to": token, "title": title, "body": body, "data": data or {}, "sound": "default"} for token in tokens]
        tickets = _post(messages).get("data", [])
        # Os tickets vêm pela mesma ordem das mensagens.
        dead = [token for token, ticket in zip(tokens, tickets)
                if ticket.get("status") == "error" and (ticket.get("details") or {}).get("error") == "DeviceNotRegistered"]
        if dead:
            db.execute(delete(models.PushToken).where(models.PushToken.token.in_(dead)))
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Falha ao enviar notificação push ao utilizador %s", user_id)
