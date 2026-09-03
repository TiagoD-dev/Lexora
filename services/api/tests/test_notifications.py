from app.routers import notifications
from tests.test_api import register, auth


def test_delay_email_sends_to_current_user(client, monkeypatch):
    sent = {}

    def fake_send_email(to_email, subject, body, html_body=None, inline_image=None):
        sent["to"] = to_email
        sent["subject"] = subject
        sent["body"] = body
        sent["html_body"] = html_body
        sent["inline_image"] = inline_image

    monkeypatch.setattr(notifications, "send_email", fake_send_email)
    token = register(client, "atrasos@example.com")

    response = client.post(
        "/notifications/delay-email",
        json={"taskTitle": "Contestação", "caseTitle": "Processo X", "daysLate": 3},
        headers=auth(token),
    )

    assert response.status_code == 204
    assert sent["to"] == "atrasos@example.com"
    assert "Dias de atraso: 3" in sent["body"]
    assert "Equipa LEXORA" in sent["body"]
    assert "Contestação" in sent["html_body"]
    assert sent["inline_image"] is not None
    assert sent["inline_image"][1] == "lexora-logo"


def test_delay_email_requires_authentication(client):
    response = client.post(
        "/notifications/delay-email",
        json={"taskTitle": "Contestação", "caseTitle": "Processo X", "daysLate": 3},
    )
    assert response.status_code == 401
