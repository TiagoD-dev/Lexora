# Lexora

Versão base da aplicação mobile e da API do assistente jurídico digital.

## Aplicação mobile

```powershell
cd apps\mobile
npm start
```

## API

```powershell
cd services\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API fica disponível em `http://localhost:8000` e a documentação interativa em
`http://localhost:8000/docs`.

Os dados (utilizadores, clientes e casos) são guardados em `services/api/lexora.db`
(SQLite, criado automaticamente no arranque). Em produção, define a variável de
ambiente `LEXORA_JWT_SECRET` com um valor secreto próprio — sem ela é usado um

## Testes da API

```powershell
cd services\api
pip install -r requirements-dev.txt
pytest
```

## Configuração de produção

Define `LEXORA_ENV=production` e configura `LEXORA_JWT_SECRET` com um valor longo,
aleatório e exclusivo do ambiente. A API recusa arrancar em produção com o segredo
de desenvolvimento.
segredo de desenvolvimento inseguro.
