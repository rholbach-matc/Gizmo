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

## Gamehendge LAN Deployment

This is the first LAN testing setup for Jackie on the Gamehendge server. It uses
plain HTTP on the local network only.

Prerequisites:

- Docker installed
- Docker Compose available as `docker compose`
- The Gamehendge server reachable from Jackie/Ryan devices on the LAN

Clone the repo on Gamehendge:

```bash
git clone <repo-url> Gizmo
cd Gizmo
```

Build and start the app:

```bash
docker compose up -d --build
```

Access the app from another device on the LAN:

```text
http://<gamehendge-ip>:3000
```

Backend health check:

```text
http://<gamehendge-ip>:8000/health
```

Useful Docker commands:

```bash
# Show running containers
docker compose ps

# View logs
docker compose logs -f

# Restart after pulling new code
docker compose up -d --build

# Stop the app without deleting data
docker compose down
```

### SQLite Data

In Docker, the backend uses SQLite at:

```text
/data/gizmo.db
```

That path is stored in the Docker named volume:

```text
gizmo_gizmo-data
```

The volume persists across container rebuilds and `docker compose down`. Do not
delete the named volume unless you intentionally want to remove the LAN test
database.

Simple backup option:

```bash
docker compose cp backend:/data/gizmo.db ./gizmo-backup.db
```

Restore should be done only while the app is stopped:

```bash
docker compose down
docker compose cp ./gizmo-backup.db backend:/data/gizmo.db
docker compose up -d
```
