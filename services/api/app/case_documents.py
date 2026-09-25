"""Excertos relevantes dos documentos carregados num Caso (pesquisa lexical, BM25)."""
import math
import re
import unicodedata
from collections import Counter

from . import models

CHUNK_CHARS = 1500
MAX_TOTAL_CHARS = 12_000
STOPWORDS = set(
    "a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para com sem "
    "e ou que se nao mais mas como ao aos ha foi ser sao esta este isto esse essa isso seu sua seus suas "
    "me te lhe nos vos eu tu ele ela eles elas qual quais quando onde ja muito tem ter sobre entre ate "
    "caso documento documentos".split()
)


def tokens(text: str) -> list[str]:
    plain = unicodedata.normalize("NFKD", text.casefold()).encode("ascii", "ignore").decode()
    return [word for word in re.findall(r"[a-z0-9]+", plain) if len(word) > 1 and word not in STOPWORDS]


def document_text(stored_name: str) -> str:
    from . import main  # import tardio: main importa os routers, que importam o assistente
    if "/" in stored_name or "\\" in stored_name or ".." in stored_name:
        return ""
    path = main.DOCUMENTS_DIR / stored_name
    sidecar = path.with_name(f"{stored_name}.txt")
    if sidecar.is_file():
        return sidecar.read_text(encoding="utf-8")
    if not path.is_file():
        return ""
    try:  # documentos anteriores ao sidecar: extrai uma vez e guarda
        text = main.extract_text(stored_name, path.read_bytes())[0]
    except Exception:
        return ""
    sidecar.write_text(text, encoding="utf-8")
    return text


def chunks(text: str) -> list[str]:
    parts, current = [], ""
    for paragraph in re.split(r"\n\s*\n|\n", text):
        paragraph = paragraph.strip()
        while len(paragraph) > CHUNK_CHARS:  # parágrafos gigantes (PDF sem quebras)
            parts.append(paragraph[:CHUNK_CHARS])
            paragraph = paragraph[CHUNK_CHARS:]
        if current and len(current) + len(paragraph) > CHUNK_CHARS:
            parts.append(current)
            current = ""
        current = f"{current}\n{paragraph}".strip()
    if current:
        parts.append(current)
    return parts


def relevant_excerpts(case: models.Case, prompt: str, k: int = 5) -> list[dict]:
    candidates = []
    for document in case.documents or []:
        file_id = str((document or {}).get("fileId") or "")
        if not file_id.startswith(f"{case.ownerId}_"):
            continue
        parts = chunks(document_text(file_id))
        for index, part in enumerate(parts):
            candidates.append({"document": document.get("name") or file_id, "position": f"{index + 1}/{len(parts)}", "text": part})
    query = set(tokens(prompt))
    if not candidates or not query:
        return []
    # ponytail: BM25 recalculado a cada pergunta; indexar se os Casos passarem a ter centenas de documentos
    counts = [Counter(tokens(item["text"])) for item in candidates]
    average = sum(sum(count.values()) for count in counts) / len(counts) or 1
    frequency = Counter(term for count in counts for term in query if term in count)
    scored = []
    for item, count in zip(candidates, counts):
        length = sum(count.values())
        score = sum(
            math.log(1 + (len(counts) - frequency[term] + 0.5) / (frequency[term] + 0.5))
            * count[term] * 2.2 / (count[term] + 1.2 * (0.25 + 0.75 * length / average))
            for term in query if term in count
        )
        if score > 0:
            scored.append((score, item))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    selected, total = [], 0
    for _, item in scored[:k]:
        if total + len(item["text"]) > MAX_TOTAL_CHARS:
            break
        selected.append(item)
        total += len(item["text"])
    return selected
