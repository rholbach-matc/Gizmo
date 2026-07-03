# Gizmo — Agent Guide

Gizmo is a caregiving tracker for a chronically ill senior cat, used daily by two caregivers on a home LAN. It holds **production caregiving data**. Priority order for every tradeoff (SPEC.md): caregiver usefulness > reliability > simplicity > maintainability > learning.

## Stack & layout

- `backend/` — FastAPI + SQLAlchemy + SQLite. Routes in `backend/app/routes/` (one module per tracker), models in `app/models.py`, Pydantic schemas in `app/schemas.py`, time helpers in `app/time_utils.py`, engine + startup migrations in `app/database.py`.
- `frontend/` — React + TypeScript + Vite, plain CSS (`src/style.css`). One fetch module per tracker in `src/api/`, one page per tracker in `src/pages/`. No router library — page switching lives in `src/App.tsx`.
- Deploy: `docker compose up -d --build` on the homelab. Frontend :3010 (nginx, proxies API routes to backend), backend :8010. SQLite persists in the `gizmo-data` volume at `/data/gizmo.db`.

## Commands

```bash
# Backend dev (from backend/): serves on :8000
uvicorn app.main:app --reload
# Backend tests (from backend/):
python -m unittest discover -s tests
# Frontend dev (from frontend/): Vite proxies API to 127.0.0.1:8010 (override VITE_PROXY_API_BASE_URL)
npm run dev
# Frontend build check:
npm run build
```

## Non-negotiable domain rules (full text in SPEC.md — read it)

1. **Historical Nutrition Rule.** Completed `FoodEntry` rows are the source of truth. **Never recompute a historical entry's values from the live `Food` or `Bowl` records.** Food/bowl edits affect *future* feedings only. (Known violation exists in `update_food_entry` — it is a bug to fix, not a convention to copy.)
2. **Snapshot pattern.** Anything derived from a parent record at event time (nutrition values, bowl tare, medication name) is copied onto the entry when the event completes, and edits recalculate only from the entry's own stored values.
3. **Nutrition math stays in the backend.** Never move it into the frontend.
4. **Data safety beats development speed.** Before any schema change or bulk data operation: back up, test on a copy, verify, then deploy (SPEC.md Database Rules). Migrations run automatically at container startup — so a schema mistake ships instantly.

## Conventions

- **Time:** datetimes are stored **naive but semantically UTC**. Backend strips tzinfo on ingest (`time_utils.entry_time_or_now`); API responses have no `Z` suffix; the frontend appends `Z` before display via `src/utils/dateTime.ts` — use those shared helpers, never per-page timestamp logic (SPEC rule). "Today" is computed in America/Chicago (`time_utils.CAREGIVER_TIMEZONE`).
- **New API route = four layers:** register the router in `app/main.py`, add the path to `frontend/nginx.conf`, add it to `frontend/vite.config.ts` proxy, add the client in `src/api/`. If the frontend gets HTML where it expects JSON, a proxy layer was missed.
- **Tracker modules are intentionally uniform.** When touching one, match the existing pattern (create with `entry_time_or_now`, list newest-first, update-all-fields, delete, 404 via HTTPException) rather than inventing a new one.
- Validation for enumerated fields uses `Literal` in `schemas.py` (see vomit severity); ratings use `Field(ge=..., le=...)`.

## Do not touch without explicit instruction

- The production database / `gizmo-data` volume, and any `*.db` file.
- `backend/app/database.py` migration functions — schema changes go through the safe-migration procedure, never a quick edit.
- No auth exists **by design** (trusted two-person LAN). Do not add login/auth scaffolding.
- Do not add new root-level Markdown files or spec variants; spec changes are edits to `SPEC.md`.
