"""Pesquisa local (SQLite FTS5) em artigos de legislação consolidada do Diário da República.

O índice é gerado por `ingest_legislation.py`; se não existir, `search` devolve [].
"""
import os
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(os.environ.get("LEXORA_LEGAL_INDEX", Path(__file__).resolve().parent.parent / "legal_index.db"))
SCHEMA = (
    "CREATE VIRTUAL TABLE IF NOT EXISTS articles USING fts5("
    "diploma, article, epigraph, text, url UNINDEXED, source UNINDEXED, tokenize='unicode61 remove_diacritics 2')"
)
EXCERPT_CHARS = 1200


def _terms(text: str) -> list[str]:
    # ponytail: stemming ingénuo (prefixo), trocar por stemmer PT se a relevância não chegar
    words = {w.lower() for w in re.findall(r"\w+", text) if len(w) > 3 and not w.isdigit()}
    return sorted(f'"{w[:-2]}"*' if len(w) > 6 else f'"{w}"' for w in words)


def reference(article: str, diploma: str) -> str:
    return f"{article.replace('Artigo', 'Art.', 1)} {'da' if diploma.startswith('Lei') else 'do'} {diploma}"


def search(query: str, area: str = "", k: int = 5, db_path: Path | None = None) -> list[dict]:
    path = db_path or DB_PATH
    terms = _terms(f"{query} {area}")
    if not terms or not path.exists():
        return []
    with sqlite3.connect(path) as db:
        rows = db.execute(
            "SELECT diploma, article, epigraph, text, url FROM articles WHERE articles MATCH ? "
            "ORDER BY bm25(articles, 2, 5, 4, 1) LIMIT ?",
            (" OR ".join(terms), k),
        ).fetchall()
    return [
        {"title": epigraph or article, "reference": reference(article, diploma), "url": url, "excerpt": text[:EXCERPT_CHARS]}
        for diploma, article, epigraph, text, url in rows
    ]
