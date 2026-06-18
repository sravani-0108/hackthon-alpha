# AML Shield — Gemini ADK AML Alert Triage System

Full-stack AML (Anti-Money Laundering) investigation platform with a **Google ADK** multi-agent pipeline powered by **Gemini**.

## Stack

- **Backend:** Node.js, Express, TypeORM, PostgreSQL, [@google/adk](https://adk.dev/)
- **Frontend:** React, TypeScript, Vite
- **AI:** `gemini-flash-latest` via ADK `LlmAgent` + `FunctionTool`
- **Database:** PostgreSQL

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and GEMINI_API_KEY
npm install
npm run db:setup
npm run dev
```

Backend runs on `http://localhost:3000` (or `PORT` from `.env`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` — proxies `/api` to the backend (see `frontend/vite.config.ts`).

### Login Credentials

- Email: `manager@bank.com`
- Password: `Manager@123`

## AI Agent Pipeline

When you click **Start AI Investigation** on an alert, eight agents run (screening agents in parallel where possible):

1. **Customer Profile Agent** — Gemini + KYC database
2. **Transaction Analysis Agent** — Gemini + transaction patterns
3. **Sanctions Screening Agent** — Gemini + OpenSanctions
4. **PEP Screening Agent** — Gemini + OpenSanctions PEP
5. **Adverse Media Agent** — Gemini + Google Search
6. **Investigation Agent** — Gemini synthesis of all findings
7. **Decision Agent** — CLEAR / ESCALATE / SAR disposition
8. **Report Agent** — Deterministic compliance narrative

See [docs/AML_ADK_GUIDE.md](docs/AML_ADK_GUIDE.md) for architecture details.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/refresh-token | Refresh JWT |
| GET | /api/alerts | List alerts |
| POST | /api/investigations/start/:alertId | Start ADK investigation |
| GET | /api/investigations/:id/report | Get investigation report |
| POST | /api/agents/customer-analysis | Run customer agent |
| POST | /api/agents/final-decision | Run full triage, return disposition |
| GET | /api/cases | List cases |

## Database Tables

users, customers, accounts, transactions, alerts, alert_evidence, investigations, agent_results, cases, sar_reports, notifications

## Environment

Copy `backend/.env.example` to `backend/.env` and configure:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=change-me
```

Set `USE_MOCK_SCREENING=true` to use seeded screening data without external API calls.

Without `GEMINI_API_KEY`, the system falls back to legacy rule-based agents.
