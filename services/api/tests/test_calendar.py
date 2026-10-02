from test_api import auth, case_payload, register


def _task(identifier: str, title: str, due: str | None, completed: bool = False) -> dict:
    return {
        "id": identifier, "title": title, "description": "Linha 1\nLinha 2", "dueDate": due,
        "priority": "Alta", "deadlineKind": "Judicial", "recurrence": "Nenhuma",
        "reminderDays": [], "completed": completed, "createdAt": "2026-10-01T00:00:00Z",
    }


def test_calendar_feed_and_subscription(client):
    owner = auth(register(client, "agenda@example.com"))
    other = auth(register(client, "outro@example.com"))
    payload = case_payload()
    payload["tasks"] = [
        _task("t1", "Contestação; prazo, com \\ barra", "2026-09-01"),
        _task("t2", "Sem prazo", None),
        _task("t3", "Já feita", "2026-09-02", completed=True),
    ]
    assert client.post("/cases", json=payload, headers=owner).status_code == 201

    response = client.get("/calendar.ics", headers=owner)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/calendar")
    body = response.text
    assert body.startswith("BEGIN:VCALENDAR\r\n") and body.endswith("END:VCALENDAR\r\n")
    assert "\n" not in body.replace("\r\n", "")
    unfolded = body.replace("\r\n ", "")
    assert unfolded.count("BEGIN:VEVENT") == 1
    assert "UID:t1.case-1@lexora" in unfolded
    assert "DTSTART;VALUE=DATE:20260901" in unfolded
    assert "SUMMARY:[LEX-2026-001] Contestação\\; prazo\\, com \\\\ barra" in unfolded
    assert "Linha 1\\nLinha 2" in unfolded
    assert all(len(line.encode()) <= 75 for line in body.split("\r\n"))

    assert client.get("/calendar.ics").status_code == 401
    url = client.get("/calendar/subscription", headers=owner).json()["url"]
    assert url == client.get("/calendar/subscription", headers=owner).json()["url"]
    assert url != client.get("/calendar/subscription", headers=other).json()["url"]
    feed = client.get(url.removeprefix("http://testserver"))
    assert feed.status_code == 200 and "UID:t1.case-1@lexora" in feed.text.replace("\r\n ", "")
    assert client.get("/calendar/invalido.ics").status_code == 404
