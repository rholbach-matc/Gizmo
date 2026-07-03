# Gizmo Architecture

How the system actually works, for humans and agents. Product intent and domain rules live in `SPEC.md`; this file covers the mechanisms. Line references are as of commit `40a40a2`.

## System shape

```
Browser (LAN) ──► nginx :3010 (frontend container)
                    ├── serves built Vite app (/, /assets/*; index.html never cached)
                    └── proxies each API prefix (/foods, /food-entries, …) ──► backend :8000
                                                                    (published on host as :8010)
Backend: FastAPI ── SQLAlchemy ── SQLite at /data/gizmo.db (named volume gizmo-data)
```

- Dev mode replaces nginx with the Vite dev server, whose proxy list (`frontend/vite.config.ts`) mirrors `frontend/nginx.conf`. **Both lists must be updated when a route is added** — plus router registration in `backend/app/main.py` and a client module in `frontend/src/api/`.
- No auth, by design: two trusted users on a private LAN.

## Backend module map

| File | Role |
|---|---|
| `app/main.py` | App wiring: CORS, router registration, startup hook (`create_all` + migrations), `/health` |
| `app/database.py` | Engine, `SessionLocal`, `Base`, and three idempotent startup migrations |
| `app/models.py` | All SQLAlchemy models (12 tables) |
| `app/schemas.py` | All Pydantic request/response schemas |
| `app/time_utils.py` | The only place timezone logic is allowed to live |
| `app/routes/*.py` | One module per tracker; each currently defines its own `get_db()` (13 copies — consolidation candidate) |

Trackers fall into three tiers: **simple trackers** (bm, fluid, weight, vomit, episode, mood, vet-visit — identical CRUD), **reference-linked trackers** (water → optional bowl; medication entries → medication catalog), and **feedings** (`food_entries` — the only module with real domain logic). `dashboard.py` is read-only aggregation over everything.

## Data flow: a feeding (the core workflow)

1. **Start (open feeding):** caregiver weighs bowl+food. `POST /food-entries` validates the bowl and food exist, checks `starting_total ≥ bowl tare`, stores `starting_food_weight = starting_total − bowl.empty_weight_grams`. Nutrition columns stay NULL; `is_open` is derived from `ending_total_weight_grams IS NULL` (`models.py:85–87`).
2. **Finish:** `PATCH /food-entries/{id}/finish` takes the ending weight and computes leftover, grams eaten, and the seven nutrition totals from the food's per-gram values (`routes/food_entries.py:65–105`), sets `finished_at`.
3. **Dashboard:** sums the stored per-entry totals for the caregiver's current day; it never recomputes from `foods`.

### The point-in-time snapshot model

The **completion moment is the snapshot moment**: whatever the `Food` and `Bowl` said when the feeding finished is what the entry means forever. `foods` and `bowls` are *reference/current-state* tables; `*_entries` are *historical-fact* tables. Editing a reference row must never change an existing entry (SPEC "Historical Nutrition Rule"). The medication tracker implements this correctly by copying `medication_name` onto each entry at creation.

**Known deviation (bug, not design):** `FoodEntry` stores only the computed totals, not the per-gram inputs, and `update_food_entry` (`routes/food_entries.py:150–205`) re-reads the live `Food` and `Bowl` to recalculate on edit. Until fixed (see `docs/review/01_INTEGRITY.md` Finding 1), editing an old entry after a food/bowl edit silently rewrites history. The planned fix adds snapshot columns (bowl tare, calories/gram, as-fed percents) to `food_entries` so edits recalculate purely from the entry's own row.

## Time handling

One convention, enforced by habit: **naive datetimes, semantically UTC, everywhere in the database and API.**

- Ingest: `time_utils.entry_time_or_now` — `None` → now (UTC); aware input → converted to UTC, tzinfo stripped; naive input → trusted as already-UTC and stored as-is (the frontend always sends `Z`-suffixed ISO from `Date.toISOString()`, so this trust holds today).
- Egress: FastAPI serializes the naive datetimes **without** `Z`. The frontend's `src/utils/dateTime.ts` appends `Z` when no offset is present, then renders in browser-local time. This append-`Z` heuristic is load-bearing; all timestamp handling must go through that shared module.
- **Day boundaries:** the caregiving "day" is America/Chicago (`time_utils.CAREGIVER_TIMEZONE`). `caregiver_day_bounds_for_utc_storage(day)` converts a Chicago calendar day to a naive-UTC half-open interval `[start, next_start)` for querying; it is DST-correct (tests in `tests/test_time_utils.py`). A feeding belongs to the day it was **started**, even if finished after midnight (`routes/dashboard.py:480–482`).
- Caveat: frontend day-grouping uses the *browser's* zone; identical to Chicago for the household, divergent for a traveling caregiver.

## Migrations

Schema management is `Base.metadata.create_all` (new tables only) plus hand-rolled, idempotent, SQLite-only functions in `app/database.py`, executed **on every backend startup** (`app/main.py:44–49`). Three exist: a `food_entries` table rebuild that relaxed NOT NULLs for open feedings, an `ADD COLUMN finished_at`, and the medications/water reference backfill. There is no version stamp; each function probes `PRAGMA table_info` to decide whether to act.

Consequences to respect:

- A schema change deploys itself the moment the container restarts — so SPEC's Database Rules (backup → test on a copy → verify → deploy) are the *only* safety net. Follow the safe-migration procedure (see skill draft) for every schema change.
- Table-rebuild migrations embed a frozen copy of the schema; they silently drop any column/index added after they were written. Prefer additive `ADD COLUMN` migrations; if a rebuild is unavoidable, regenerate its CREATE TABLE from the current model.
- The planned mixed-feedings work (parent/child split of `food_entries`) exceeds what this approach can carry safely; adopting versioned migrations (Alembic or a minimal numbered-script runner) is planned prep — see `docs/review/05_ACTION_PLAN.md`.

## Frontend structure

`src/App.tsx` holds a `useState<Page>` switch (no URL router) over ~14 pages. Each page owns its data fetching via the matching `src/api/*.ts` module (plain `fetch`, errors normalized by `src/api/errors.ts`). Styling is one shared `src/style.css` with reusable card/form classes (`.ref-card`, `.form-compact`, …) — extend those patterns rather than adding new visual systems (SPEC UI rules). The dashboard is the primary screen; its daily calorie goal is currently a frontend constant (`DashboardPage.tsx: CALORIE_GOAL`).

## Testing

Backend: `unittest` suite in `backend/tests/` (40 tests) calling route functions directly with an in-memory SQLite session — fast, but nothing exercises the HTTP layer (serialization, status codes, router wiring). Frontend: no tests; `npm run build` (tsc) is the check. There is no CI; tests run manually before merge.
