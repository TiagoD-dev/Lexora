from types import SimpleNamespace

from app import case_documents, main
from test_api import auth, register


def test_extract_writes_text_sidecar(client, tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DOCUMENTS_DIR", tmp_path)
    token = register(client, "docs@example.com")
    response = client.post(
        "/documents/extract", headers=auth(token),
        files={"file": ("nota.txt", "Contrato de arrendamento assinado.".encode(), "text/plain")},
    )
    assert response.status_code == 200, response.text
    sidecar = tmp_path / f"{response.json()['fileId']}.txt"
    assert sidecar.read_text(encoding="utf-8") == "Contrato de arrendamento assinado."


def test_ranking_picks_relevant_chunk_and_ignores_other_users(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DOCUMENTS_DIR", tmp_path)
    filler = "\n\n".join(f"Parágrafo {i} sobre a reunião com o cliente e prazos gerais." * 20 for i in range(4))
    # ficheiro antigo sem sidecar: é extraído e guardado na primeira utilização
    (tmp_path / "u1_a.txt").write_text(f"{filler}\n\nA renda mensal é de 750 euros, paga ao senhorio até dia 8.", encoding="utf-8")
    (tmp_path / "u2_b.txt").write_text("A renda mensal é de 999 euros.", encoding="utf-8")
    case = SimpleNamespace(ownerId="u1", documents=[
        {"name": "Contrato.txt", "fileId": "u1_a.txt"},
        {"name": "Alheio.txt", "fileId": "u2_b.txt"},
        {"name": "Fuga.txt", "fileId": "u1_../u2_b.txt"},
        {"name": "Sem ficheiro"},
    ])
    excerpts = case_documents.relevant_excerpts(case, "Qual é o valor da renda?", k=5)
    assert excerpts[0]["document"] == "Contrato.txt"
    assert "750 euros" in excerpts[0]["text"]
    assert all("999" not in item["text"] for item in excerpts)
    assert (tmp_path / "u1_a.txt.txt").is_file()
    assert not (tmp_path / "u2_b.txt.txt").exists()
