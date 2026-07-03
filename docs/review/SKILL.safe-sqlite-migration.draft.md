---
name: safe-sqlite-migration
description: Procedure for any Gizmo schema change or bulk data operation — backup, rehearse on a copy, verify, deploy. Use BEFORE editing models.py, database.py migrations, or running any UPDATE/DELETE/ALTER against gizmo.db.
---

# Safe SQLite Migration

Gizmo's database holds irreplaceable caregiving history, and migrations run **automatically at backend startup** (`app/main.py` startup hook) — merging a schema change means deploying it. SPEC.md Database Rules make this procedure mandatory: *"Protecting caregiving data takes priority over development speed."*

Never skip steps because a change "is just an ADD COLUMN."

## 1. Snapshot before touching anything

On the homelab (production):

```bash
docker compose cp backend:/data/gizmo.db ./pre-migration-$(date +%Y%m%d-%H%M%S).db
```

Confirm the copy is a valid database, not a truncated file:

```bash
sqlite3 pre-migration-*.db "PRAGMA integrity_check; SELECT count(*) FROM food_entries;"
```

Note the row counts of every table the migration touches — you will re-check them in step 4. Independent daily backups exist, but they are up to 24h old; this snapshot is your zero-loss rollback point.

## 2. Write the migration defensively

- Follow the existing pattern in `backend/app/database.py`: SQLite-dialect guard, probe current state (`PRAGMA table_info` / `sqlite_master`), act only if needed — the function must be **idempotent** (it runs on every startup, forever).
- Prefer additive changes (`ALTER TABLE ... ADD COLUMN` with a default or NULL). Avoid full table rebuilds; a rebuild embeds a frozen CREATE TABLE that will silently drop any column or index added after it was written (this footgun already exists in `migrate_food_entries_for_open_feedings` — it predates `finished_at`).
- If a rebuild is truly unavoidable: copy the CREATE TABLE from the *current* live schema (`sqlite3 db ".schema food_entries"`), recreate **all** indexes, wrap in `PRAGMA foreign_keys=OFF` … `ON` as the existing rebuild does, and keep the column list in one place for both CREATE and INSERT…SELECT.
- Backfills that derive values from reference tables (foods, bowls, medications) must handle missing parents explicitly — foreign keys are not enforced at the SQLite level.

## 3. Rehearse on the copy

Never let the first execution of a migration be against production. Locally:

```bash
cp pre-migration-*.db backend/rehearsal.db
cd backend
DATABASE_URL=sqlite:///./rehearsal.db uvicorn app.main:app --port 8001   # startup runs the migration
```

Then kill the server and **run it a second time** — the migration must be a no-op on an already-migrated database (idempotence check).

## 4. Verify the rehearsal result

Against `rehearsal.db`, check all of:

- `PRAGMA integrity_check;` returns `ok`.
- Row counts of touched tables match step 1 (or differ by exactly the intended amount).
- Spot-check 3–5 real historical rows: values unchanged where they should be unchanged — especially `food_entries` nutrition columns, which must never shift as a side effect (SPEC Historical Nutrition Rule).
- `PRAGMA table_info(<table>);` shows the expected columns, and `.schema` shows expected indexes survived.
- The app works against the rehearsed DB: open the dashboard, a tracker list, and edit one old entry.
- `python -m unittest discover -s tests` passes.

## 5. Deploy, then verify production the same way

Merge to `main`, then on the homelab: `git pull && docker compose up -d --build`. Immediately re-run the step-4 checks against production (`docker compose cp backend:/data/gizmo.db ./post-check.db` and inspect the copy — don't run ad-hoc SQL against the live file while the app writes to it).

## 6. Rollback plan (decide it BEFORE deploying)

If verification fails:

```bash
docker compose down
# revert the code (git revert / checkout previous main), rebuild, then restore:
docker compose up -d --no-start   # recreate containers with old code
docker compose cp ./pre-migration-<timestamp>.db backend:/data/gizmo.db
docker compose up -d
```

Restoring the snapshot **loses any entries logged after step 1** — so keep the deploy-to-verify window short and warn the other caregiver before migrating.

## Hard rules

- No schema or bulk-data change without a same-day snapshot (step 1).
- No migration whose first-ever run is against production.
- Never edit or reorder the existing migration functions' behavior for already-migrated databases.
- If anything in step 4 or 5 is surprising, stop and restore — investigate on the copy, not on production.
