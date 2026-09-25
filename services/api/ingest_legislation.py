"""Descarrega legislação consolidada do Diário da República e indexa-a por artigo (SQLite FTS5).

Uso: .venv/Scripts/python.exe ingest_legislation.py   (a partir de services/api)

O site diariodarepublica.pt é uma app OutSystems sem API pública: usamos os mesmos
"screenservices" JSON que a página de legislação consolidada chama no browser.
Cada diploma falhado é reportado e mantém as linhas já indexadas.
"""
import html
import re
import sqlite3
import sys
from datetime import date

import httpx

from app.legal_sources import DB_PATH, SCHEMA

BASE = "https://diariodarepublica.pt/dr"
SCREEN = "LegislacaoConsolidada/LegCons_Detalhe"
# CSRF token anónimo das apps OutSystems (o mesmo que o browser envia sem sessão).
HEADERS = {"X-CSRFToken": "T6C+9iB49TLra4jEsMeSckDMNhQ=", "OutSystems-locale": "pt-PT", "Accept": "application/json"}
DIPLOMAS = [  # caminho em /dr/legislacao-consolidada/
    "decreto-lei/1966-34509075",  # Código Civil
    "lei/2009-34546475",  # Código do Trabalho
    "lei/2013-34580575",  # Código de Processo Civil
    "decreto-lei/1995-34437675",  # Código Penal
    "decreto-lei/1987-34570075",  # Código de Processo Penal
    "decreto-lei/1986-34443975",  # Código das Sociedades Comerciais
    "lei/2006-34578375",  # NRAU
    "decreto-lei/2015-105602322",  # Código do Procedimento Administrativo
]
SKIP_ANNEX = {"lei/2006-34578375"}  # o anexo do NRAU republica artigos do Código Civil, já indexado a partir do próprio CC


def _versions(client: httpx.Client) -> tuple[str, dict[str, str]]:
    manifest = client.get(f"{BASE}/moduleservices/moduleinfo").json()["manifest"]
    script = f"/dr/scripts/dr.{SCREEN.replace('/', '.')}.mvc.js"
    js = client.get(f"https://diariodarepublica.pt{script}{manifest['urlVersions'][script]}").text
    return manifest["versionToken"], dict(re.findall(rf'"screenservices/dr/{SCREEN}/(\w+)", "([\w-]+)"', js))


def _call(client: httpx.Client, versions: tuple[str, dict[str, str]], action: str, variables: dict) -> dict:
    body = {"versionInfo": {"moduleVersion": versions[0], "apiVersion": versions[1][action]}, "viewName": SCREEN.replace("/", "."), "screenData": {"variables": variables}}
    data = client.post(f"{BASE}/screenservices/dr/{SCREEN}/{action}", json=body, headers=HEADERS).raise_for_status().json()
    if data.get("exception"):
        raise RuntimeError(data["exception"].get("message"))
    return data["data"]


def _clean(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text)).replace("\r", "").strip()


def fetch(client: httpx.Client, versions, path: str) -> list[tuple]:
    tipo, key = path.split("/")
    frag_id = key.split("-")[1]
    info = _call(client, versions, "DataActionGetDiplomaFragByIdAndApplicationSetting", {"Key": key, "Tipo": tipo, "DiplomaFragId": frag_id})
    detail = info["ConsolidadaConteudoDetalhe"]
    legis_id = detail["DiplomaFrag"]["DiplomaLegisId"]
    if legis_id == "0":
        raise RuntimeError("diploma não encontrado")
    items = _call(client, versions, "DataActionGetData", {
        "DiplomaFragId": frag_id, "DiplomaLegisId": legis_id, "DataSelecionada": date.today().isoformat(),
        "IndiceList": {"List": []}, "GetDiplomaFragByIdAndApplicationSetting": info,
    })["LegConsBase"]["List"]
    code = detail["DiplomaFrag"]["Designacao"].split(" - ")[0].strip()
    act = detail["DiplomaFrag"]["ConteudoTitle"].strip()
    rows = []
    for item in items:
        full_name, version = item["ConsolidacaoFragmento"]["FullName"], item["FragmentoVersao"]
        text = _clean(version["Texto"])
        # Só artigos; ignora artigos citados dentro de outro artigo (redações de alteração a outros diplomas).
        if version["TipoFragmentoId"] != 11 or full_name.count("Artigo") > 1 or not text or text.lower().startswith("(revogado"):
            continue
        if path in SKIP_ANNEX and "Anexo" in full_name:
            continue
        # Artigos soltos na raiz são do diploma que aprova o código; os do código estão em Anexo/Livro/Título.
        diploma = act if full_name.count(">") == 1 else code
        rows.append((diploma, version["Tituo"], version["Epigrafe"].strip(), text, f"{BASE}/legislacao-consolidada/{path}-{version['Id']}", path))
    return rows


def main() -> None:
    with httpx.Client(timeout=180, follow_redirects=True) as client, sqlite3.connect(DB_PATH) as db:
        versions = _versions(client)
        db.execute(SCHEMA)
        for path in DIPLOMAS:
            try:
                rows = fetch(client, versions, path)
            except Exception as error:
                print(f"IGNORADO {path}: {error}", file=sys.stderr)
                continue
            db.execute("DELETE FROM articles WHERE source = ?", (path,))
            db.executemany("INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?)", rows)
            db.commit()
            print(f"{path}: {len(rows)} artigos ({', '.join(sorted({r[0] for r in rows}))})")


if __name__ == "__main__":
    main()
