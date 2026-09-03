from app.routers import cases
from tests.test_api import auth, case_payload, client_payload, register


def _setup_case_with_client(client, token):
    client.post("/clients", json=client_payload(), headers=auth(token))
    payload = case_payload()
    payload["clientId"] = "client-1"
    payload["status"] = "Rascunho"
    client.post("/cases", json=payload, headers=auth(token))


def test_status_change_to_em_analise_notifies_client(client, monkeypatch):
    sent = {}

    def fake_send_email(to_email, subject, body, html_body=None, inline_image=None):
        sent["to"] = to_email
        sent["subject"] = subject
        sent["body"] = body

    monkeypatch.setattr(cases, "send_email", fake_send_email)
    token = register(client, "advogado@example.com")
    _setup_case_with_client(client, token)

    response = client.patch("/cases/case-1", json={"status": "Em análise"}, headers=auth(token))

    assert response.status_code == 200
    assert sent["to"] == "cliente@example.com"
    assert "análise" in sent["body"]


def test_status_change_to_unmapped_value_does_not_notify(client, monkeypatch):
    sent = {}
    monkeypatch.setattr(cases, "send_email", lambda *a, **k: sent.setdefault("called", True))
    token = register(client, "advogado2@example.com")
    _setup_case_with_client(client, token)

    response = client.patch("/cases/case-1", json={"status": "Arquivado"}, headers=auth(token))

    assert response.status_code == 200
    assert "called" not in sent


def test_status_unchanged_does_not_notify(client, monkeypatch):
    sent = {}
    monkeypatch.setattr(cases, "send_email", lambda *a, **k: sent.setdefault("called", True))
    token = register(client, "advogado3@example.com")
    _setup_case_with_client(client, token)

    response = client.patch("/cases/case-1", json={"description": "atualização sem mudar estado"}, headers=auth(token))

    assert response.status_code == 200
    assert "called" not in sent
