"""Envio de email via SMTP (stdlib), usado para alertas de atraso."""
from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: str | None = None,
    inline_image: tuple[bytes, str] | None = None,
) -> None:
    """inline_image, se fornecido, é (bytes_png, content_id) referenciável no HTML como cid:<content_id>."""
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    if not user or not password:
        raise RuntimeError("SMTP_USER/SMTP_PASSWORD não configurados no .env.")

    message = EmailMessage()
    message["From"] = os.environ.get("SMTP_FROM", user)
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")
        if inline_image:
            image_bytes, content_id = inline_image
            message.get_payload()[1].add_related(image_bytes, "image", "png", cid=f"<{content_id}>")

    with smtplib.SMTP(host, port, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(message)
