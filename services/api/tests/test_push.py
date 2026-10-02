from app import push
from app.routers import notifications
from tests.test_api import auth, register

DELAY = {"taskTitle": "Contestação", "caseTitle": "Processo X", "daysLate": 2, "caseId": "case-1"}


def test_overdue_notice_pushes_to_registered_devices_and_prunes_dead_tokens(client, monkeypatch):
    sent = []

    def fake_post(messages):
        sent.extend(messages)
        return {"data": [{"status": "ok"}, {"status": "error", "details": {"error": "DeviceNotRegistered"}}]}

    monkeypatch.setattr(push, "_post", fake_post)
    monkeypatch.setattr(notifications, "send_email", lambda *a, **k: None)
    token = register(client, "push@example.com")
    for device in ("ExponentPushToken[a]", "ExponentPushToken[b]"):
        assert client.post("/notifications/push-tokens", json={"token": device}, headers=auth(token)).status_code == 204

    assert client.post("/notifications/delay-email", json=DELAY, headers=auth(token)).status_code == 204
    assert [m["to"] for m in sent] == ["ExponentPushToken[a]", "ExponentPushToken[b]"]
    assert "Contestação" in sent[0]["title"] and sent[0]["data"] == {"caseId": "case-1"}

    # O token "b" foi removido por DeviceNotRegistered; após unregister de "a" já não há envio.
    client.delete("/notifications/push-tokens/ExponentPushToken[a]", headers=auth(token))
    sent.clear()
    client.post("/notifications/delay-email", json=DELAY, headers=auth(token))
    assert sent == []


def test_push_failure_does_not_break_email(client, monkeypatch):
    emailed = []

    def boom(messages):
        raise OSError("rede em baixo")

    monkeypatch.setattr(push, "_post", boom)
    monkeypatch.setattr(notifications, "send_email", lambda to, *a, **k: emailed.append(to))
    token = register(client, "push2@example.com")
    client.post("/notifications/push-tokens", json={"token": "ExponentPushToken[c]"}, headers=auth(token))

    assert client.post("/notifications/delay-email", json=DELAY, headers=auth(token)).status_code == 204
    assert emailed == ["push2@example.com"]
