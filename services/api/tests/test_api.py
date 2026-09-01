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
