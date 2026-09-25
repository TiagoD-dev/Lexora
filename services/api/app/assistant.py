"""Assistente jurídico por Caso: monta o contexto e pede a resposta ao modelo (via app.llm)."""
import json
from datetime import date, datetime

from . import case_documents, legal_sources, llm, models

DISCLAIMER = (
    "Esta resposta organiza os dados do Caso; não substitui a validação das fontes "
    "nem a análise de um profissional habilitado."
)
SYSTEM_INSTRUCTION = (
    "És o assistente jurídico da Lexora. Respondes sempre em português de Portugal, "
    "de forma curta e direta. Usas apenas o contexto do Caso fornecido em JSON — nunca "
    "inventas factos, entidades ou documentos que não estejam nesse contexto. "
    "Quando usares os excertos dos documentos do Caso, cita o nome do documento. "
    "Para fundamentar juridicamente usa só as \"Fontes legais\" numeradas fornecidas e cita-as no texto como [1], [2]; "
    "nunca cites artigos, diplomas ou jurisprudência que não estejam nessa lista. Se nenhuma fonte fornecida "
    "suportar a resposta, diz claramente que não encontraste base legal nas fontes disponíveis. "
    "Em \"actions\" propões no máximo 3 ações concretas (\"task\": tarefa, com \"dueDate\" AAAA-MM-DD se houver prazo; "
    "\"fact\": facto a registar; \"missing\": pergunta sobre informação em falta), só quando claramente úteis — "
    "normalmente a lista fica vazia. O advogado confirma cada ação; nunca as dês como feitas. "
    f"Termina sempre a resposta com este aviso, exatamente: \"{DISCLAIMER}\""
)
HISTORY_TURNS = 10
RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "actions": {"type": "array", "maxItems": 3, "items": {"type": "object", "properties": {
            "kind": {"type": "string", "enum": ["task", "fact", "missing"]},
            "title": {"type": "string"},
            "dueDate": {"type": ["string", "null"]},
            "reason": {"type": "string"},
        }, "required": ["kind", "title", "dueDate", "reason"]}},
    },
    "required": ["reply", "actions"],
}


def case_context(case: models.Case) -> dict:
    return {
        "reference": case.reference,
        "title": case.title,
        "area": case.area,
        "facts": case.facts,
        "entities": case.entities,
        "documents": case.documents,
        "legalIssues": case.legalIssues,
        "missingFacts": case.missingFacts,
        "timeline": case.timeline,
    }


def reply(prompt: str, case: models.Case, history: list[dict]) -> dict:
    context = f"Contexto do Caso (JSON):\n{json.dumps(case_context(case), ensure_ascii=False)}"
    if excerpts := case_documents.relevant_excerpts(case, prompt):
        context += "\n\nExcertos dos documentos do Caso:\n" + "\n\n".join(
            f"[{item['document']}, excerto {item['position']}]\n{item['text']}" for item in excerpts
        )
    issues = " ".join(str(issue.get("title", "")) for issue in case.legalIssues if isinstance(issue, dict))
    sources = legal_sources.search(f"{prompt} {issues}", case.area)
    context += "\n\nFontes legais:\n" + ("\n\n".join(
        f"[{n}] {s['reference']} — {s['title']}\n{s['excerpt']}" for n, s in enumerate(sources, 1)
    ) or "(nenhuma)")
    text = llm.generate(SYSTEM_INSTRUCTION, f"{context}\n\nData de hoje: {date.today()}\nPergunta: {prompt}", history=history[-HISTORY_TURNS:], json_schema=RESPONSE_SCHEMA)
    try:
        data = json.loads(text)
        text, actions = str(data["reply"]), _actions(data.get("actions"))
    except (ValueError, TypeError, KeyError):
        actions = []
    return {"reply": text or DISCLAIMER, "actions": actions, "sources": sources}


def _actions(raw) -> list[dict]:
    """Descarta ações malformadas ou com datas inexistentes: a saída do modelo não é de confiança."""
    actions = []
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict) or item.get("kind") not in ("task", "fact", "missing") or not str(item.get("title") or "").strip():
            continue
        due = item.get("dueDate") if item["kind"] == "task" else None
        try:
            due = datetime.strptime(due, "%Y-%m-%d").date().isoformat() if due else None
        except (TypeError, ValueError):
            continue
        actions.append({"kind": item["kind"], "title": str(item["title"]).strip()[:200], "dueDate": due, "reason": str(item.get("reason") or "").strip()[:300]})
    return actions[:3]
