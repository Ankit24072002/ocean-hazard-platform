# 🌊 Integrated Platform for Crowdsourced Ocean Hazard Reporting

Full-stack + AI (MVP-ready) scaffold. Includes:
- **Frontend (React + Vite + Tailwind + Leaflet)**
- **Backend (Node.js + Express + JWT + PostgreSQL via `pg`)**
- **AI microservice (FastAPI + Transformers)**
- **Docker Compose (Postgres + MinIO optional)**
- **Basic credibility scoring + multilingual NLP hooks**
- **PWA baseline (manifest + service worker)**

## Quick Start (Dev)

### 1) Prereqs
- Node 18+
- Python 3.10+
- Docker (optional but recommended)
- PNPM or NPM

### 2) Environment
Copy `.env.example` to `.env` in `backend/` and fill values.

### 3) Run with Docker Compose
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- AI service: http://localhost:8000
- Postgres: localhost:5432

### 4) Run locally without Docker
- **AI service**:
  ```bash
  cd ai
  python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn nlp_server:app --reload --host 0.0.0.0 --port 8000
  ```
- **Backend**:
  ```bash
  cd backend
  pnpm i  # or npm i
  pnpm dev  # or npm run dev
  ```
- **Frontend**:
  ```bash
  cd frontend
  pnpm i  # or npm i
  pnpm dev  # or npm run dev
  ```

## Demo Flow
1. Submit a report on the web app (text + geotag + optional photo).
2. Backend calls AI `/classify` → hazard type + language.
3. Credibility score computed (media present, user trust, social corroboration).
4. Map updates in real-time (WebSocket). Official can verify the report.

## Notes
- This is a hackathon-ready scaffold. Add PostGIS if needed.
- Social media connectors are stubbed for extension.
- Service worker provides basic caching and an example queue for offline submissions.
