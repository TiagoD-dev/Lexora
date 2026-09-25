import json
from types import SimpleNamespace

from app import assistant

CASE = SimpleNamespace(reference="LEX-1", title="Despedimento", area="Direito do Trabalho", facts=[], entities=[], documents=[], legalIssues=[], missingFacts=[], timeline=[])


def ask(monkeypatch, text: str) -> dict:
    monkeypatch.setattr(assistant.llm, "generate", lambda *args, **kwargs: text)
    return assistant.reply("O que devo fazer?", CASE, [])


def test_valid_json_returns_sanitised_actions(monkeypatch):
    result = ask(monkeypatch, json.dumps({"reply": "Impugnar.", "actions": [
        {"kind": "task", "title": "  Preparar impugnação  ", "dueDate": "2026-11-09", "reason": "Prazo de 60 dias."},
        {"kind": "fact", "title": "Despedido a 2026-09-10", "dueDate": "2026-09-10", "reason": ""},
        {"kind": "missing", "title": "Houve processo disciplinar?", "dueDate": None, "reason": "Define a via."},
    ]}))
    assert result["reply"] == "Impugnar."
    assert result["actions"] == [
        {"kind": "task", "title": "Preparar impugnação", "dueDate": "2026-11-09", "reason": "Prazo de 60 dias."},
        {"kind": "fact", "title": "Despedido a 2026-09-10", "dueDate": None, "reason": ""},
        {"kind": "missing", "title": "Houve processo disciplinar?", "dueDate": None, "reason": "Define a via."},
    ]


def test_malformed_json_falls_back_to_plain_reply(monkeypatch):
    assert ask(monkeypatch, "Resposta em texto simples.") == {"reply": "Resposta em texto simples.", "actions": [], "sources": []}


def test_invalid_dates_and_malformed_actions_are_dropped(monkeypatch):
    result = ask(monkeypatch, json.dumps({"reply": "Ok.", "actions": [
        {"kind": "task", "title": "Prazo impossível", "dueDate": "2026-02-30", "reason": ""},
        {"kind": "task", "title": "Prazo em texto", "dueDate": "amanhã", "reason": ""},
        {"kind": "email", "title": "Enviar", "dueDate": None, "reason": ""},
        {"kind": "fact", "title": "   ", "dueDate": None, "reason": ""},
        "lixo",
        {"kind": "task", "title": "Sem prazo", "dueDate": None, "reason": "x" * 999},
    ]}))
    assert [action["title"] for action in result["actions"]] == ["Sem prazo"]
    assert len(result["actions"][0]["reason"]) == 300
