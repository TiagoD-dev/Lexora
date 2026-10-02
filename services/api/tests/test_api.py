from datetime import datetime, timezone


def register(client, email: str, name: str = "Utilizador") -> str:
    response = client.post(
        "/auth/register",
        json={"email": email, "password": "PalavraPasse123!", "displayName": name},
    )
    assert response.status_code == 201, response.text
    return response.json()["accessToken"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def client_payload(identifier: str = "client-1") -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": identifier, "name": "Cliente de teste", "type": "Particular",
        "status": "Ativo", "nif": "123456789", "email": "cliente@example.com",
        "phone": "", "address": "", "notes": "", "createdAt": now, "updatedAt": now,
    }


def case_payload(identifier: str = "case-1") -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": identifier, "reference": "LEX-2026-001", "title": "Processo de teste",
        "client": "Cliente de teste", "clientId": None, "area": "Direito Civil",
        "court": "Tribunal Judicial", "processNumber": "1/26.0TEST",
        "responsible": "Advogado de teste", "priority": "Normal", "description": "",
        "status": "Em análise", "createdAt": now, "updatedAt": now,
        "notes": [], "tasks": [], "documents": [], "timeline": [], "entities": [],
        "facts": [], "legalIssues": [], "missingFacts": [],
    }


def test_health_is_public_and_data_requires_authentication(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/clients").status_code == 401
    response = client.post(
        "/documents/extract",
        files={"file": ("nota.txt", b"Texto de teste", "text/plain")},
    )
    assert response.status_code == 401


def test_registration_login_and_duplicate_email(client):
    token = register(client, "ADVOGADO@example.com", "Ana")
    me = client.get("/auth/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["email"] == "advogado@example.com"

    duplicate = client.post(
        "/auth/register",
        json={"email": "advogado@example.com", "password": "OutraPasse123!", "displayName": "Outra"},
    )
    assert duplicate.status_code == 409

    login = client.post(
        "/auth/login",
        json={"email": "ADVOGADO@example.com", "password": "PalavraPasse123!"},
    )
    assert login.status_code == 200
    assert login.json()["accessToken"]


def test_update_profile_requires_auth_and_updates_only_provided_fields(client):
    assert client.patch("/auth/me", json={"displayName": "Intrusão"}).status_code == 401

    token = register(client, "profile@example.com", "Ana")
    original_email = client.get("/auth/me", headers=auth(token)).json()["email"]

    updated = client.patch("/auth/me", json={"displayName": "Ana Nova"}, headers=auth(token))
    assert updated.status_code == 200
    body = updated.json()
    assert body["displayName"] == "Ana Nova"
    assert body["email"] == original_email
    assert body["professionalTitle"] == ""

    again = client.patch(
        "/auth/me",
        json={"professionalTitle": "Advogada"},
        headers=auth(token),
    )
    assert again.status_code == 200
    assert again.json()["displayName"] == "Ana Nova"
    assert again.json()["professionalTitle"] == "Advogada"

    professional = {"organization": "Sociedade X", "phone": "+351 912 000 000", "barNumber": "12345L", "primaryLegalArea": "Direito do Trabalho", "bio": "Advogada laboral."}
    saved = client.patch("/auth/me", json=professional, headers=auth(token))
    assert saved.status_code == 200
    assert {key: saved.json()[key] for key in professional} == professional
    assert client.get("/auth/me", headers=auth(token)).json()["bio"] == "Advogada laboral."

    assert client.patch("/auth/me", json={"bio": "x" * 281}, headers=auth(token)).status_code == 422
    assert client.patch("/auth/me", json={"displayName": ""}, headers=auth(token)).status_code == 422


def test_clients_and_cases_are_isolated_between_users(client):
    owner_token = register(client, "owner@example.com")
    other_token = register(client, "other@example.com")

    assert client.post("/clients", json=client_payload(), headers=auth(owner_token)).status_code == 201
    assert client.post("/cases", json=case_payload(), headers=auth(owner_token)).status_code == 201

    assert len(client.get("/clients", headers=auth(owner_token)).json()) == 1
    assert len(client.get("/cases", headers=auth(owner_token)).json()) == 1
    assert client.get("/clients", headers=auth(other_token)).json() == []
    assert client.get("/cases", headers=auth(other_token)).json() == []
    assert client.patch("/clients/client-1", json={"name": "Intrusão"}, headers=auth(other_token)).status_code == 404
    assert client.delete("/cases/case-1", headers=auth(other_token)).status_code == 404


def test_tasks_and_documents_are_persisted_in_case(client):
    token = register(client, "persist@example.com")
    payload = case_payload()
    assert client.post("/cases", json=payload, headers=auth(token)).status_code == 201

    task = {
        "id": "task-1", "title": "Apresentar contestação", "priority": "Urgente",
        "deadlineKind": "Judicial", "recurrence": "Nenhuma", "reminderDays": [1, 3],
        "completed": False, "createdAt": payload["createdAt"],
    }
    document = {
        "id": "document-1", "name": "peticao.txt", "type": "TXT",
        "status": "Disponível", "extractionStatus": "Por rever",
        "suggestions": [], "addedAt": payload["createdAt"],
    }
    update = client.patch(
        "/cases/case-1",
        json={"tasks": [task], "documents": [document]},
        headers=auth(token),
    )
    assert update.status_code == 200
    assert update.json()["tasks"][0]["id"] == "task-1"
    assert update.json()["documents"][0]["id"] == "document-1"

    stored = client.get("/cases", headers=auth(token)).json()[0]
    assert stored["tasks"] == [task]
    assert stored["documents"] == [document]


def test_case_assistant_requires_auth_ownership_and_replies(client, monkeypatch):
    from app.routers import cases as cases_router

    monkeypatch.setattr(cases_router.assistant, "reply", lambda prompt, case, history: {"reply": f"Resposta simulada para: {prompt} ({len(history)} turnos)"})

    owner_token = register(client, "assistant-owner@example.com")
    other_token = register(client, "assistant-other@example.com")
    assert client.post("/cases", json=case_payload(), headers=auth(owner_token)).status_code == 201

    assert client.post("/cases/case-1/assistant", json={"prompt": "Resume os factos"}).status_code == 401
    assert client.post("/cases/case-1/assistant", json={"prompt": "Resume os factos"}, headers=auth(other_token)).status_code == 404

    response = client.post("/cases/case-1/assistant", json={"prompt": "Resume os factos"}, headers=auth(owner_token))
    assert response.status_code == 200, response.text

    history = [{"role": "user", "content": "Olá"}, {"role": "assistant", "content": "Olá!"}]
    response = client.post("/cases/case-1/assistant", json={"prompt": "E agora?", "history": history}, headers=auth(owner_token))
    assert response.json()["reply"] == "Resposta simulada para: E agora? (2 turnos)"


def test_case_collaborators_can_view_and_edit_but_not_manage_collaborators(client):
    owner_token = register(client, "collab-owner@example.com")
    collaborator_token = register(client, "collab-friend@example.com")
    stranger_token = register(client, "collab-stranger@example.com")
    assert client.post("/cases", json=case_payload(), headers=auth(owner_token)).status_code == 201

    # Before being added, the future collaborator has no access at all.
    assert client.get("/cases", headers=auth(collaborator_token)).json() == []
    assert client.patch("/cases/case-1", json={"title": "Sem acesso"}, headers=auth(collaborator_token)).status_code == 404
    assert client.post(
        "/cases/case-1/collaborators", json={"email": "collab-friend@example.com"}, headers=auth(collaborator_token)
    ).status_code == 404

    # Owner adds the collaborator.
    added = client.post(
        "/cases/case-1/collaborators", json={"email": "COLLAB-FRIEND@example.com"}, headers=auth(owner_token)
    )
    assert added.status_code == 200, added.text
    assert added.json()["collaboratorEmails"] == ["collab-friend@example.com"]

    # Collaborator can now view and edit, but cannot manage collaborators (owner-only).
    assert len(client.get("/cases", headers=auth(collaborator_token)).json()) == 1
    edited = client.patch("/cases/case-1", json={"title": "Editado pelo colaborador"}, headers=auth(collaborator_token))
    assert edited.status_code == 200, edited.text
    assert edited.json()["title"] == "Editado pelo colaborador"
    assert client.post(
        "/cases/case-1/collaborators", json={"email": "collab-stranger@example.com"}, headers=auth(collaborator_token)
    ).status_code == 403

    # A different user still has no access.
    assert client.get("/cases", headers=auth(stranger_token)).json() == []

    # Owner removes the collaborator; access is revoked.
    removed = client.delete("/cases/case-1/collaborators/collab-friend@example.com", headers=auth(owner_token))
    assert removed.status_code == 200, removed.text
    assert removed.json()["collaboratorEmails"] == []
    assert client.get("/cases", headers=auth(collaborator_token)).json() == []


def test_authenticated_text_extraction(client):
    token = register(client, "documents@example.com")
    response = client.post(
        "/documents/extract",
        headers=auth(token),
        files={"file": ("nota.txt", "Maria Silva entregou o documento em 01/09/2026.".encode(), "text/plain")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert "Maria Silva" in payload["text"]
    assert payload["characterCount"] > 0
    assert any(item["type"] == "Data" for item in payload["suggestions"])


def test_legal_updates_requires_authentication(client):
    assert client.get("/legal-updates").status_code == 401
