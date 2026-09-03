"""Checkout Stripe para upgrade de plano. Requer STRIPE_* no .env para ficar ativo."""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])

_PRICE_ENV = {
    ("pro", "monthly"): "STRIPE_PRICE_PRO_MONTHLY",
    ("pro", "annual"): "STRIPE_PRICE_PRO_ANNUAL",
    ("office", "monthly"): "STRIPE_PRICE_OFFICE_MONTHLY",
    ("office", "annual"): "STRIPE_PRICE_OFFICE_ANNUAL",
}


def _stripe():
    secret_key = os.environ.get("STRIPE_SECRET_KEY")
    if not secret_key:
        raise HTTPException(501, "A faturação Stripe ainda não está configurada (defina STRIPE_SECRET_KEY).")
    import stripe
    stripe.api_key = secret_key
    return stripe


@router.post("/checkout", response_model=schemas.CheckoutResponse)
def create_checkout_session(
    payload: schemas.CheckoutRequest,
    current_user: models.User = Depends(get_current_user),
) -> schemas.CheckoutResponse:
    stripe = _stripe()
    price_env = _PRICE_ENV.get((payload.plan, payload.cycle))
    price_id = price_env and os.environ.get(price_env)
    if not price_id:
        raise HTTPException(501, f"Sem price ID Stripe configurado para o plano {payload.plan} ({payload.cycle}).")
    frontend_url = os.environ.get("LEXORA_FRONTEND_URL", "http://localhost:8081")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        client_reference_id=current_user.id,
        customer_email=current_user.email,
        metadata={"plan": payload.plan},
        success_url=f"{frontend_url}/billing?checkout=success",
        cancel_url=f"{frontend_url}/billing?checkout=cancelled",
    )
    return schemas.CheckoutResponse(url=session.url)


@router.post("/webhook", status_code=204)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> None:
    stripe = _stripe()
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(501, "STRIPE_WEBHOOK_SECRET não configurado.")
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, request.headers.get("stripe-signature", ""), webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as error:
        raise HTTPException(400, "Assinatura de webhook inválida.") from error

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        plan = (session.get("metadata") or {}).get("plan")
        if user_id and plan:
            user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
            if user is not None:
                user.plan = plan
                db.commit()
