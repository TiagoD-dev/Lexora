"""Único ponto de acesso ao modelo de linguagem. Trocar de fornecedor (Claude, modelo aberto na UE…) = alterar só este ficheiro."""
import os
from functools import cache

from google import genai
from google.genai import types

MODEL = os.environ.get("LEXORA_LLM_MODEL", "gemini-3.6-flash")


@cache
def _client() -> genai.Client:
    return genai.Client(
        api_key=os.environ["GEMINI_API_KEY"],
        http_options=types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=3)),
    )


def generate(system: str, prompt: str, *, history: list[dict] | None = None, web_search: bool = False, json_schema: dict | None = None) -> str:
    """history: [{"role": "user"|"assistant", "content": str}], mais antigo primeiro.
    json_schema: pede resposta JSON com este esquema (exclusivo com web_search)."""
    contents = [
        types.Content(role="model" if turn["role"] == "assistant" else "user", parts=[types.Part(text=turn["content"])])
        for turn in history or []
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))
    config = types.GenerateContentConfig(
        system_instruction=system,
        tools=[types.Tool(google_search=types.GoogleSearch())] if web_search and not json_schema else None,
        response_mime_type="application/json" if json_schema else None,
        response_json_schema=json_schema,
    )
    return _client().models.generate_content(model=MODEL, contents=contents, config=config).text or ""
