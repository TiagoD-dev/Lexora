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

## Portal do cliente

No menu **Portal do cliente**, o escritório seleciona um cliente com email e um processo associado:

1. Criar um convite e partilhar o endereço e o código com esse cliente. O código é apresentado uma única vez e expira em 48 horas; a app não envia o convite por email.
2. Escrever a atualização e escolher **Publicar no portal**. O cliente vê o título, referência, estado, responsável, atualização e conteúdo partilhado no portal. Notas, factos e documentos internos do caso não são publicados automaticamente.
3. Pedir ou partilhar documentos, responder a mensagens e publicar valores com instruções de pagamento. Só o escritório confirma recebimentos; o portal não emite faturas nem processa pagamentos online.
4. Usar **Retirar do portal** para ocultar um processo ou **Revogar acesso** para bloquear o cliente. Um novo convite invalida a palavra-passe e as sessões anteriores.

O cliente abre `/portal?access=...`, escolhe **Ativar acesso** e define uma palavra-passe com pelo menos 10 caracteres. Nas visitas seguintes usa o mesmo endereço, email e palavra-passe. A sessão do portal é separada da sessão do escritório, expira em oito horas e não é guardada no navegador: recarregar ou fechar a página exige novo login. A recuperação de acesso faz-se com um novo convite do escritório.

Documentos do portal: PDF, DOCX, XLSX, TXT, CSV, PNG e JPEG, até 25 MB. São guardados em `services/api/documents_storage/portal`, com permissões verificadas em cada descarga. A base SQLite e esta pasta precisam de armazenamento persistente e de cópias de segurança em conjunto.

Para acesso externo, definir `EXPO_PUBLIC_API_URL` com a URL HTTPS da API antes de compilar, `EXPO_PUBLIC_PORTAL_URL` com a URL HTTPS completa da página `/portal` nos convites móveis e `LEXORA_CORS_ORIGINS` com a origem do site. A configuração está exemplificada em `.env.example`. Estas instruções não efetuam publicação do site.

### Verificação do portal

Testes da API, a partir da raiz:

```bash
python -m pytest services/api/tests/test_portal.py -q
```

O teste de navegador usa Playwright com Chrome e uma API isolada. Compilar a app web com a API local (`http://localhost:8000`) e sem substituir `EXPO_PUBLIC_PORTAL_URL`:

```bash
cd apps/mobile
npx expo export --platform web --output-dir ../../work/portal-web
cd ../..
python services/api/tests/serve_portal_e2e.py
```

Noutro terminal, a partir da raiz:

```bash
node apps/mobile/scripts/verify-portal.cjs
```

Playwright deve estar disponível no ambiente Node; `PLAYWRIGHT_MODULE` permite indicar o caminho de uma instalação existente. As portas locais 8000 e 8765 devem estar livres. O servidor usa uma base e ficheiros temporários, removidos ao terminar normalmente; o teste verifica a identificação desse servidor antes de criar contas. As capturas ficam em `work/portal-check`.

O percurso cobre convite, publicação, ativação, pedido e entrega de documento, descarga com conteúdo verificado, mensagem, recebimento, terminar e reiniciar sessão, persistência dos dados, revogação, largura móvel e erros de execução no navegador.
