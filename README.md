# Lexora

Assistente jurídico digital para advogados e escritórios de advocacia em Portugal. Centraliza clientes, casos, prazos, documentos e atualidade jurídica, e usa IA para ajudar a analisar cada caso a partir dos dados que lhe são associados.

## O que faz

- **Clientes** — ficha de cliente (particular/empresa), contactos, NIF, notas.
- **Casos** — processo, tribunal, área do direito, prioridade, estado; guarda factos, entidades, questões jurídicas, factos em falta, timeline e documentos associados a cada caso.
- **Tarefas e prazos** — prazos por caso, com alerta e email automático quando um prazo entra em atraso.
- **Documentos** — upload de PDF/DOCX/XLSX/TXT, extração de texto e sugestão automática de datas, entidades e factos a partir do conteúdo, para revisão manual antes de entrarem no caso.
- **Assistente Lexora** — chat por caso que responde apenas com base no contexto desse caso (factos, entidades, documentos, timeline), usando o Gemini da Google; nunca inventa informação fora do que está registado, e cada resposta traz um aviso de que não substitui a validação humana.
- **Atualidade jurídica / Fontes jurídicas** — feed agregado do Diário da República e do EUR-Lex (RSS oficiais), mais referências fixas ao Tribunal Constitucional e à DGSI; pesquisável no ecrã de Fontes.
- **Autenticação** — registo/login com password, sessão por JWT.
- **Perfil, planos/faturação** — atualmente apenas UI estática (mock), sem backend ligado.

## Arquitetura

Monorepo com duas partes:

```
apps/mobile/    App React Native (Expo + expo-router), corre em iOS, Android e Web
services/api/   API em FastAPI (Python), base de dados SQLite
```

### `services/api` — backend

- **FastAPI** + **SQLAlchemy** sobre **SQLite** (`lexora.db`).
- Routers: `auth`, `clients`, `cases` (inclui o endpoint do assistente), `legal_updates`, `notifications`.
- Autenticação por JWT (`pyjwt`), passwords com `bcrypt`.
- Extração de documentos com `pypdf`, `python-docx`, `openpyxl`.
- Assistente por caso via `google-genai` (Gemini), com contexto restrito aos dados do caso.
- Emails (alerta de prazo em atraso) via SMTP, com template HTML de marca.
- Testes com `pytest` (`services/api/tests`).

### `apps/mobile` — app

- **Expo** + **expo-router**, navegação em drawer (sidebar) com os ecrãs: Hoje, Clientes, Casos, Tarefas, Documentos, Assistente, Fontes jurídicas, Atualidade jurídica, Definições, Planos.
- Providers para autenticação, tema, atualidade jurídica e assistente.
- Corre em iOS, Android e Web (`react-native-web`).

## Como correr localmente

Backend:
```bash
cd services/api
pip install -r requirements.txt
cp ../../.env.example ../../.env   # preencher LEXORA_JWT_SECRET, GEMINI_API_KEY, SMTP_*
uvicorn app.main:app --reload
```

App:
```bash
cd apps/mobile
npm install
npm run start   # ou: npm run web / npm run ios / npm run android
```

Variáveis de ambiente principais (ver [`.env.example`](.env.example)): `EXPO_PUBLIC_API_URL`, `LEXORA_JWT_SECRET`, `GEMINI_API_KEY`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`.

## Testes

```bash
cd services/api
pytest
```
