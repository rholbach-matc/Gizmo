# Gizmo

Gizmo is a cozy cat care tracker for keeping simple care notes and routines in one place.

This repository is split into two small apps:

- `backend`: FastAPI API server
- `frontend`: React + Vite + TypeScript web app

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on the local Vite development server.
