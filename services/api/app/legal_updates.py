"""Agregação de atualidade jurídica a partir de fontes oficiais públicas.

Diário da República e EUR-Lex publicam feeds RSS oficiais consultados aqui.
Não existe feed público para o Tribunal Constitucional / DGSI, por isso essas
fontes ficam como referências fixas ao portal oficial (STATIC_UPDATES), em vez
de itens de notícia inventados.
"""
from __future__ import annotations

import hashlib
import time
from datetime import datetime
from xml.etree import ElementTree

import httpx

FEEDS = [
    {"url": "https://files.diariodarepublica.pt/rss/serie1.xml", "source": "Diário da República", "sourceKind": "Portugal", "areas": ["Legislação nacional"]},
    {"url": "https://eur-lex.europa.eu/PT/display-feed.rss?rssId=222", "source": "EUR-Lex", "sourceKind": "União Europeia", "areas": ["Direito Europeu"]},
]

STATIC_UPDATES = [
    {"id": "tc-acordaos", "source": "Tribunal Constitucional", "sourceKind": "Jurisprudência", "title": "Acórdãos do Tribunal Constitucional", "summary": "Consulta das decisões publicadas pelo Tribunal Constitucional português.", "publishedAt": None, "url": "https://www.tribunalconstitucional.pt/tc/acordaos/", "official": True, "areas": ["Direito Constitucional"]},
    {"id": "dgsi", "source": "IGFEJ / DGSI", "sourceKind": "Jurisprudência", "title": "Bases jurídico-documentais", "summary": "Pesquisa de jurisprudência dos tribunais superiores e demais bases jurídico-documentais nacionais.", "publishedAt": None, "url": "https://www.dgsi.pt/", "official": True, "areas": ["Jurisprudência"]},
]

_CACHE_TTL_SECONDS = 900
_cache: dict[str, tuple[float, list[dict]]] = {}


def _parse_pubdate(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return datetime.strptime(value.strip(), "%a, %d %b %Y %H:%M:%S %z").date().isoformat()
    except ValueError:
        return None


def _is_uninformative_celex(title: str, description: str) -> bool:
    return title.startswith("CELEX:") and ":" not in title[6:] and not description


def _is_irrelevant_to_portugal(description: str) -> bool:
    # As retificações do EUR-Lex declaram explicitamente quando não afetam a versão portuguesa.
    return "não diz respeito à versão portuguesa" in description.casefold()


def _fetch_feed(feed: dict, client: httpx.Client) -> list[dict]:
    response = client.get(feed["url"], timeout=8, follow_redirects=True)
    response.raise_for_status()
    root = ElementTree.fromstring(response.content)
    items: list[dict] = []
    for entry in root.findall(".//item")[:15]:
        title = (entry.findtext("title") or "").strip()
        link = (entry.findtext("link") or "").strip()
        description = (entry.findtext("description") or "").strip()
        if not title or not link or _is_uninformative_celex(title, description) or _is_irrelevant_to_portugal(description):
            continue
        items.append({
            "id": hashlib.sha1(link.encode()).hexdigest()[:16],
            "source": feed["source"],
            "sourceKind": feed["sourceKind"],
            "title": title[:300],
            "summary": (description or title)[:400],
            "publishedAt": _parse_pubdate(entry.findtext("pubDate")),
            "url": link,
            "official": True,
            "areas": feed["areas"],
        })
    return items


def get_legal_updates(client: httpx.Client | None = None) -> list[dict]:
    now = time.monotonic()
    owns_client = client is None
    client = client or httpx.Client()
    results: list[dict] = []
    try:
        for feed in FEEDS:
            cached = _cache.get(feed["url"])
            if cached and now - cached[0] < _CACHE_TTL_SECONDS:
                results.extend(cached[1])
                continue
            try:
                items = _fetch_feed(feed, client)
                _cache[feed["url"]] = (now, items)
                results.extend(items)
            except Exception:
                # ponytail: fonte externa em baixo é ignorada nesta atualização;
                # reutiliza o último snapshot em cache se existir. Alertar se persistir.
                if cached:
                    results.extend(cached[1])
    finally:
        if owns_client:
            client.close()
    results.sort(key=lambda item: item["publishedAt"] or "", reverse=True)
    return results + STATIC_UPDATES
