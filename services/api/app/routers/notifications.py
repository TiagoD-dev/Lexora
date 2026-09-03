from html import escape
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from .. import models, schemas
from ..email import send_email
from ..security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Paleta da marca (apps/mobile/src/theme/index.ts)
_BRAND_PRIMARY = "#12372A"
_BRAND_ACCENT = "#D9B96E"
_BRAND_BACKGROUND = "#F5F2E9"
_BRAND_DANGER = "#9B403D"

_LOGO_CID = "lexora-logo"
_LOGO_PATH = Path(__file__).resolve().parents[4] / "apps" / "mobile" / "assets" / "brand" / "lexora-logo.png"
_logo_bytes = _LOGO_PATH.read_bytes() if _LOGO_PATH.exists() else None


@router.post("/delay-email", status_code=204)
def send_delay_email(
    payload: schemas.DelayNotification,
    current_user: models.User = Depends(get_current_user),
) -> None:
    subject = f"[LEXORA] Alerta de prazo em atraso — {payload.taskTitle}"
    saudacao = current_user.displayName.strip() or "Utilizador"
    body = (
        f"Exmo(a). {saudacao},\n\n"
        f"Informamos que o seguinte prazo se encontra em atraso:\n\n"
        f"  Prazo: {payload.taskTitle}\n"
        f"  Caso: {payload.caseTitle}\n"
        f"  Dias de atraso: {payload.daysLate}\n\n"
        f"Recomendamos a verificação e regularização deste prazo com a maior brevidade possível.\n\n"
        f"Com os melhores cumprimentos,\n"
        f"Equipa LEXORA\n"
        f"Assistente jurídico digital\n"
    )
    logo_html = (
        f'<img src="cid:{_LOGO_CID}" alt="LEXORA" height="36" style="display:block;">'
        if _logo_bytes
        else '<span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:2px;">LEXORA</span>'
    )
    html_body = f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:{_BRAND_BACKGROUND};font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{_BRAND_BACKGROUND};padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;">
<tr><td style="background:{_BRAND_PRIMARY};padding:28px 32px;">
  {logo_html}
  <span style="color:{_BRAND_ACCENT};font-size:11px;display:block;letter-spacing:1px;margin-top:6px;">ASSISTENTE JURÍDICO DIGITAL</span>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 18px;color:#17231D;font-size:14px;">Exmo(a). {escape(saudacao)},</p>
  <p style="margin:0 0 20px;color:#17231D;font-size:14px;">Informamos que o seguinte prazo se encontra em atraso:</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{_BRAND_BACKGROUND};border-left:4px solid {_BRAND_DANGER};border-radius:8px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 6px;color:#687169;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Prazo</p>
      <p style="margin:0 0 14px;color:#17231D;font-size:15px;font-weight:700;">{escape(payload.taskTitle)}</p>
      <p style="margin:0 0 6px;color:#687169;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Caso</p>
      <p style="margin:0 0 14px;color:#17231D;font-size:14px;">{escape(payload.caseTitle)}</p>
      <p style="margin:0 0 6px;color:#687169;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Dias de atraso</p>
      <p style="margin:0;color:{_BRAND_DANGER};font-size:20px;font-weight:800;">{payload.daysLate}</p>
    </td></tr>
  </table>
  <p style="margin:22px 0 0;color:#17231D;font-size:14px;">Recomendamos a verificação e regularização deste prazo com a maior brevidade possível.</p>
  <p style="margin:26px 0 0;color:#17231D;font-size:14px;">Com os melhores cumprimentos,<br/><strong>Equipa LEXORA</strong></p>
</td></tr>
<tr><td style="padding:16px 32px;background:{_BRAND_BACKGROUND};text-align:center;">
  <span style="color:#7B847E;font-size:10px;">Este é um email automático do assistente jurídico digital LEXORA.</span>
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""
    inline_image = (_logo_bytes, _LOGO_CID) if _logo_bytes else None
    try:
        send_email(current_user.email, subject, body, html_body, inline_image)
    except Exception as error:
        raise HTTPException(502, f"Não foi possível enviar o email: {error}") from error
