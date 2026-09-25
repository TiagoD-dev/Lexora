import sqlite3
from types import SimpleNamespace

from app import assistant, legal_sources


def make_index(path):
    with sqlite3.connect(path) as db:
        db.execute(legal_sources.SCHEMA)
        db.executemany("INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?)", [
            ("Código do Trabalho", "Artigo 351.º", "Noção de justa causa de despedimento", "1 - Constitui justa causa de despedimento o comportamento culposo do trabalhador...", "https://dre.example/ct-351", "lei/2009"),
            ("Código Civil", "Artigo 1101.º", "Denúncia pelo senhorio", "O senhorio pode denunciar o contrato de duração indeterminada...", "https://dre.example/cc-1101", "dl/1966"),
            ("Lei n.º 7/2009", "Artigo 1.º", "Aprovação do Código do Trabalho", "É aprovado o Código do Trabalho.", "https://dre.example/l7-1", "lei/2009"),
        ])


def test_search_ranks_by_relevance_and_formats_reference(tmp_path):
    path = tmp_path / "index.db"
    make_index(path)

    results = legal_sources.search("O trabalhador pode ser despedido com justa causa?", "Laboral", k=2, db_path=path)

    assert results[0] == {
        "title": "Noção de justa causa de despedimento",
        "reference": "Art. 351.º do Código do Trabalho",
        "url": "https://dre.example/ct-351",
        "excerpt": "1 - Constitui justa causa de despedimento o comportamento culposo do trabalhador...",
    }
    assert legal_sources.reference("Artigo 1.º", "Lei n.º 7/2009") == "Art. 1.º da Lei n.º 7/2009"
    assert legal_sources.search("a de o", db_path=path) == []


def test_search_without_index_returns_nothing(tmp_path):
    assert legal_sources.search("justa causa", db_path=tmp_path / "missing.db") == []


def test_reply_numbers_sources_in_prompt_and_returns_them(monkeypatch, tmp_path):
    path = tmp_path / "index.db"
    make_index(path)
    monkeypatch.setattr(legal_sources, "DB_PATH", path)
    monkeypatch.setattr(assistant.case_documents, "relevant_excerpts", lambda case, prompt: [])
    seen = {}

    def fake_generate(system, prompt, **kwargs):
        seen["prompt"] = prompt
        return '{"reply": "Há justa causa [1].", "actions": []}'

    monkeypatch.setattr(assistant.llm, "generate", fake_generate)
    case = SimpleNamespace(reference="R", title="T", area="Laboral", facts=[], entities=[], documents=[], legalIssues=[{"title": "Despedimento"}], missingFacts=[], timeline=[])

    result = assistant.reply("Há justa causa de despedimento?", case, [])

    assert "Fontes legais:\n[1] Art. 351.º do Código do Trabalho — Noção de justa causa de despedimento" in seen["prompt"]
    assert result["reply"] == "Há justa causa [1]."
    assert result["sources"][0]["url"] == "https://dre.example/ct-351"
