# 01 — Code & Spec Integrity Review

Reviewed: 2026-07-03, at commit `40a40a2` (branch `main`, clean tree).
Method: every file cited below was read in full; the delete-with-history behavior (Finding N1) was verified empirically against the actual models with an in-memory SQLite database. The full backend test suite was run (`python -m unittest discover -s tests`): **40 tests, all pass**.

Severity scale: **Critical** (violates a written domain rule or corrupts data) / **High** (can corrupt or lose data in realistic use) / **Medium** (user-visible failure, no data loss) / **Low** (hygiene, drift risk).

---

## Finding 1 — Historical-nutrition spec violation ✅ CONFIRMED (and it is worse than reported)

**Severity: Critical** — direct violation of SPEC.md "Historical Nutrition Rule" (SPEC.md:140–149: "Never recalculate historical nutrition values from current Food definitions").

**Confirmed mechanics.** `update_food_entry` (`backend/app/routes/food_entries.py:150–205`) fetches the **live** parent records — `get_food(db, db_food_entry.food_id)` at line 175 and `get_bowl(...)` at line 174 — and, for a completed entry, calls `calculate_completed_food_entry(...)` at lines 195–200, which derives calories/protein/fat/phosphorus/sodium/moisture/dry-matter from the live `Food`'s current per-gram values (`food_entries.py:65–105`).

`FoodEntry` (`backend/app/models.py:59–98`) stores only consumed **totals** plus `food_id`. There is **no per-gram nutrition snapshot** on the entry, so once a `Food` is edited there is no way to correctly re-derive a historical entry — any edit to a historical entry (even just fixing a typo in `notes` or adjusting `entry_time`, since `FoodEntryUpdate` requires and rewrites all weights — `schemas.py:106–110`) silently rewrites its nutrition from today's food definition.

**Worse than the prior review stated — the bowl is a second live parent.** `update_food_entry` also recomputes `starting_food_weight_grams` from the live bowl tare (`food_entries.py:182–184`: `starting_total_weight_grams - db_bowl.empty_weight_grams`), and `calculate_completed_food_entry` uses `bowl.empty_weight_grams` for the leftover math (`food_entries.py:77–84`). If a bowl is re-weighed/re-tared via `update_bowl` (`backend/app/routes/bowls.py:39–61`), every subsequent edit of a historical feeding in that bowl silently shifts its food weights *and* nutrition. This applies to **open** entries too (line 182 runs unconditionally). The bowl tare, like the food's per-gram values, is a point-in-time fact that is not snapshotted.

**Sweep of every other create/edit path for the same class of bug** (all 13 route modules read in full):

| Path | Recomputes from live parent on edit? | Verdict |
|---|---|---|
| `food_entries.update_food_entry` | Yes — live `Food` + live `Bowl` | **The bug** (only occurrence) |
| `food_entries.finish_food_entry` (`food_entries.py:208–248`) | Uses live food/bowl **at completion time** | Correct by design — completion *is* the snapshot moment |
| `food_entries.create_food_entry` (`food_entries.py:108–147`) | Live food/bowl at creation | Correct by design |
| `foods.update_food` (`foods.py:123–162`) | Recomputes the Food's own derived fields (dry-matter %, cal/g) from its own inputs | Fine — self-derived, not historical |
| `medication_entries.update_medication_entry` (`medication_entries.py:98–129`) | Re-snapshots `medication_name` from the live `Medication` for the `medication_id` supplied in the update | Acceptable — the name is an identity label, not a derived historical measurement, and there is no medication-rename route. Note the snapshot *pattern itself* (`medication_name` copied onto the entry at create, `medication_entries.py:74`) is exactly the design `FoodEntry` lacks. |
| All simple trackers (bm, fluid, weight, water, episode, vomit, mood, vet-visit) | No parent-derived values stored | No recurrence |

**Conclusion:** `food_entries` is the only place the bug occurs, but it has **two** live-parent dependencies (Food and Bowl), and the fix must snapshot both.

**Fix sketch (no code).** Add snapshot columns to `food_entries` capturing what the calculation needs at completion time: `bowl_empty_weight_grams`, `calories_per_gram`, and the five as-fed percents (protein, fat, phosphorus, sodium, moisture; dry-matter % is derivable as 100 − moisture). Populate them in `create_food_entry`/`finish_food_entry`; make `update_food_entry` recalculate **only from the entry's own snapshot columns**, never touching `foods`/`bowls`. Backfill existing rows from the current catalog (accepting that already-drifted history cannot be recovered — note this in the migration). This is also the load-bearing prerequisite for mixed feedings (see Finding 6).

---

## Finding 2 — A test that enshrines the bug ✅ CONFIRMED

**Severity: High** (it will make the correct fix look like a regression only if written carelessly; today it green-lights the violation).

`test_update_completed_food_entry_recalculates_nutrition` (`backend/tests/test_food_entries.py:130–160`) creates an entry and edits it **without ever changing the Food or Bowl in between**, so recalculating from the live food and recalculating from a snapshot produce identical numbers. The test name itself ("recalculates_nutrition") codifies the wrong contract.

**Other tests locking in SPEC-contradicting behavior:**

- `test_delete_bowl_is_blocked_when_used_by_open_feeding` (`backend/tests/test_bowls.py:48`) enshrines the **incomplete** delete guard — it asserts the 409 for open feedings only. Deleting a bowl used by *completed* feedings passes the guard and crashes with a 500 (see Finding N1).
- `test_food_entry_response_includes_unknown_food_when_catalog_row_is_deleted` (`test_food_entries.py:95–113`) deletes the Food via a **bulk query delete that bypasses the ORM** (`synchronize_session=False`), enshrining a state (orphaned entry, `food_id` dangling) that the actual `DELETE /foods/{id}` route can never produce — it 500s instead (Finding N1). The test documents a code path production cannot reach.

**Notably good tests that are *adjacent* but not contradictory:** `test_update_food_does_not_recalculate_existing_food_entry` and `test_update_bowl_does_not_modify_existing_food_entry` (`backend/tests/test_reference_updates.py:49–90, 143–176`) correctly pin "editing a Food/Bowl leaves entries at rest untouched." The uncovered gap is the compound scenario: *edit Food, then edit the historical entry* — precisely the missing test that would have caught Finding 1.

**Fix sketch.** Rename/rewrite the update test to "preserves historical nutrition": create entry → change the Food's calories and the Bowl's tare → edit the entry's notes/time → assert all nutrition and weight values are unchanged. Add the same for the bowl-tare path. Fix the bowl-delete test once the guard covers completed feedings.

---

## Finding 3 — SQLite foreign keys not enforced ✅ CONFIRMED

**Severity: Medium** (mitigated today by app-level checks and, accidentally, by Finding N1's crash; becomes High the moment raw-SQL migrations or new delete paths are written).

SQLite ships with `foreign_keys=OFF` per connection. The only `PRAGMA foreign_keys` statements in the codebase are inside the one-shot table-rebuild migration (`backend/app/database.py:53` and `:131`), scoped to that single migration connection. There is no SQLAlchemy `connect` event listener, so **every runtime connection (app and tests) has FK enforcement off**.

Everything that assumes referential integrity holds:

- `food_entries.bowl_id` / `food_id` (NOT NULL FKs, `models.py:65–66`) — dashboard summaries join through `entry.food`/`entry.bowl`; `FoodEntry.food_name` falls back to "Unknown Food" if the food is gone (`models.py:89–98`); `update_food_entry` **404s** ("Bowl/Food not found", `food_entries.py:21–40, 174–175`) making an orphaned entry permanently uneditable.
- `water_entries.bowl_id` (nullable FK, `models.py:137`) — `db.delete(bowl)` would silently NULL it via ORM cascade (data loss of which bowl, no error).
- `medication_entries.medication_id` (nullable FK, `models.py:183`) — same silent-NULL exposure.
- The migration backfill `UPDATE medication_entries SET medication_id = (SELECT ...)` (`database.py:200–210`) assumes names align — unchecked by the DB.
- All create paths do app-level existence checks (`get_bowl`, `get_food`, `get_medication`, `get_optional_bowl`), so *inserts* are protected in practice — the exposure is deletes and any future raw SQL.

**Fix sketch.** Register a SQLAlchemy `event.listens_for(engine, "connect")` hook in `database.py` executing `PRAGMA foreign_keys=ON` per connection. Then decide deliberate delete semantics for referenced foods/bowls (see N1) — with FKs on, the current deletes will fail with an `IntegrityError` you should catch and convert to a clean 409, matching the existing open-feeding guard's UX.

---

## Finding 4 — Unpinned dependencies ✅ CONFIRMED for backend; **overstated for frontend**

**Severity: Medium (backend) / Low (frontend).**

- **Backend:** `backend/requirements.txt` is four bare names (`fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`). The Docker image (`backend/Dockerfile`) does a fresh `pip install` on every `--build`, so **every homelab redeploy silently upgrades to the newest releases**. The dev venv currently holds fastapi 0.136.3 / SQLAlchemy 2.0.50 / pydantic 2.13.4; a future pydantic 3 or SQLAlchemy 2.x behavior change lands unreviewed on the machine holding production caregiving data. This is the single largest *reliability* (SPEC priority #2) hole after Finding 1. Also missing: any dev/test requirements — `pytest` is not installed or declared (the suite only runs via `unittest`).
- **Frontend:** `package.json` does use `"latest"` for all deps — but `package-lock.json` **is committed** and the Docker build uses `npm ci` (`frontend/Dockerfile`), so production builds are fully reproducible (lockfile pins react 19.2.6, vite 8.0.14, typescript 6.0.3). The real risk is confined to dev machines: any casual `npm install <pkg>` or `npm update` leaps every package to its newest major at once. The prior review's "latest-style ranges" claim is accurate about `package.json` but missed that the lockfile + `npm ci` already neutralize the deploy-time risk.

**Fix sketch.** Backend: pin exact versions (`pip freeze`-derived) in `requirements.txt`; add `requirements-dev.txt` with pytest. Frontend: replace `"latest"` with caret ranges matching the lockfile (e.g. `^19.2.6`) so `package.json` and lockfile agree; keep `npm ci` in Docker.

---

## Finding 5 — Time-handling fragility ✅ CONFIRMED; full surface mapped

**Severity: Medium** (deprecation is Low; the naive/aware boundaries are Medium because they are invisible conventions with no enforcement).

The system convention: **store naive datetimes that are implicitly UTC; convert at the edges.** It currently works, but only because five separate conventions all cooperate.

**Backend surface:**

| Location | Behavior | Risk |
|---|---|---|
| `models.py` — 11 `created_at` columns | `default=datetime.utcnow` (naive UTC) | `utcnow()` deprecated in Python 3.12 (image is `python:3.12-slim`); emits DeprecationWarning today, removal later |
| `time_utils.py:8–15` `entry_time_or_now` | Naive input **passed through unchanged** (assumed already UTC); aware input → UTC → tzinfo stripped | If any client ever sends a naive *local* time, it is silently misfiled as UTC. Today's frontend always sends `Z`-suffixed ISO, so this is latent, not live |
| `time_utils.py:5` | `CAREGIVER_TIMEZONE = ZoneInfo("America/Chicago")` hardcoded | Deliberate for one household; day-boundary math (`caregiver_day_bounds_for_utc_storage`, :28–35) correctly converts through the zone, DST-safe (verified by `tests/test_time_utils.py`) |
| `food_entries.py:141, 240` | `finished_at = datetime.utcnow()` | Same deprecation; consistent with the naive-UTC convention |
| Response serialization | Naive datetimes serialize as ISO strings **without** `Z` or offset | The entire frontend depends on the append-`Z` heuristic below; nothing tests this boundary at the HTTP layer (tests call route functions directly, bypassing serialization) |

**Frontend surface:**

| Location | Behavior | Risk |
|---|---|---|
| `src/utils/dateTime.ts:1–14` | `timestampIncludesTimezone` regex; appends `"Z"` when missing, then renders local | The load-bearing counterpart of the backend's naive-UTC convention |
| `src/utils/dateTime.ts:17–19` | Form input → `new Date(value).toISOString()` (aware, UTC) | Correct pairing with `entry_time_or_now` |
| `src/utils/dateTime.ts:21–27` | UTC → `datetime-local` input value via `getTimezoneOffset` shift | Correct |
| `src/pages/DashboardPage.tsx:48–50` | **Duplicate** `normalizeTimestamp` re-implements the append-`Z` heuristic | Direct violation of SPEC.md:420–433 ("Use shared timestamp utilities. Do not introduce per-page timestamp logic") |
| `src/pages/DashboardPage.tsx:52–62, 77–97` | Day grouping / "days since" use **browser-local** dates | Backend day counts use America/Chicago; frontend grouping uses browser zone. Identical for a Chicago household; a caregiver checking from another timezone sees dashboard cards and backend counts disagree at day edges |
| `src/pages/HistoricalDayPage.tsx:19–26` | Date label via `new Date(\`${value}T12:00:00\`)` noon trick; `localDateKey` browser-local | Same browser-vs-Chicago asymmetry |

**Naive/aware boundary inventory (the places where a mistake would corrupt or mis-file data):** (1) `entry_time_or_now` naive passthrough; (2) response serialization without `Z` + frontend append-`Z` heuristic ×2 implementations; (3) `caregiver_day_bounds_for_utc_storage` naive-UTC comparisons against stored naive columns; (4) frontend browser-local day keys vs backend Chicago day bounds.

**Fix sketch.** Mechanical, behavior-preserving pass: replace `datetime.utcnow` with a single `utc_now()` helper in `time_utils.py` returning `datetime.now(timezone.utc).replace(tzinfo=None)` (keeps naive-UTC storage, kills the deprecation); have `entry_time_or_now` call it. Delete `DashboardPage.normalizeTimestamp` in favor of the shared util. Document the naive-UTC convention in ARCHITECTURE.md (drafted, see `docs/review/ARCHITECTURE.draft.md`). Do **not** migrate stored data to aware datetimes — high risk, zero caregiver value.

---

## Finding 6 — Migration fragility ✅ CONFIRMED; mixed-feedings collision assessed

**Severity: Medium today; becomes High when mixed feedings starts.**

Current approach: `Base.metadata.create_all` plus three hand-rolled, SQLite-only, idempotent functions run at **every startup** (`backend/app/main.py:44–49`; `backend/app/database.py:22–234`). They are guard-by-inspection (`PRAGMA table_info`), unversioned, and unordered except by call sequence.

Specific fragilities found by reading them:

- **The table-rebuild migration has a stale schema frozen inside it.** `migrate_food_entries_for_open_feedings` recreates `food_entries` from a hardcoded CREATE TABLE (`database.py:56–79`) that **omits `finished_at`**. Its trigger condition (any of the nutrition columns NOT NULL) can only be true on pre-`finished_at` databases today, so it's latent — but any future edit that reorders migrations or loosens the trigger would silently **drop the `finished_at` column and its data**. This is the canonical failure mode of copy-paste table rebuilds.
- The rebuild recreates only `ix_food_entries_id` (`database.py:127–129`); any other index added later would silently vanish.
- Auto-migration at container startup structurally conflicts with SPEC.md:479–490 ("Backup before schema changes… Deploy only after verification") — `git pull && docker compose up` migrates the production DB with no backup step in the loop. The discipline exists only as an out-of-band human habit.
- No `alembic_version`-style stamp, so there is no way to tell what state a DB is in except by probing columns.

**Mixed-feedings collision.** The feature (SPEC.md:494–523, ROADMAP.md:23–69) turns one-food-per-feeding into many. That is not an `ADD COLUMN` — it is a parent/child split:

1. New table `food_entry_items` (or similar): `food_entry_id` FK, `food_id`, per-item served/leftover grams, and — because of Finding 1 — **per-gram nutrition snapshot columns per item**.
2. Data migration: for every existing `food_entries` row, insert exactly one item row carrying its `food_id`, weights, and backfilled snapshot.
3. Schema change on `food_entries`: drop or deprecate `food_id` (SQLite `DROP COLUMN` needs 3.35+, else another full table rebuild), keep entry-level totals as either stored aggregates or computed-from-items.
4. Every consumer changes: dashboard totals (`dashboard.py:222–261, 475–486` sum entry-level columns), `FoodEntryResponse.food_name`, the feeding UI.

Running that through unversioned startup functions means a multi-statement, order-dependent, destructive migration executing automatically on boot with no version stamp and no dry-run — exactly the scenario the current approach cannot handle safely. **Sketch of the required shape:** adopt either Alembic (standard, small learning cost) or a minimal numbered-migration runner (a `schema_version` table + ordered scripts — simpler, in keeping with SPEC's simplicity priority), and make the deploy procedure "backup → migrate on a copy → verify → swap," per SPEC's own Database Rules. Do the Finding-1 snapshot columns as the *first* versioned migration — it is small, additive, and rehearses the process before the big one.

---

## Finding 7 — Duplication ✅ CONFIRMED and quantified

**Severity: Low** (it has not yet caused a bug; divergences are cosmetic so far).

- **`get_db`:** defined **13 times**, character-identical, once per route module (`routes/{bm_entries,bowls,dashboard,episode_entries,fluid_entries,food_entries,foods,medication_entries,mood_entries,vet_visit_entries,vomit_entries,water_entries,weight_entries}.py`, always lines ~10–18).
- **CRUD copy-paste:** 7 modules are the same simple tracker stamped out (`bm_entries`, `fluid_entries`, `weight_entries`, `vomit_entries`, `episode_entries`, `mood_entries`, `vet_visit_entries` — 93–116 lines each): create-with-`entry_time_or_now` / list / update-all-fields / delete, with identical 404 blocks. Divergences found: list ordering (`entry_time desc, id desc` for trackers vs `id asc` for `foods`/`bowls`/`food_entries` list at `food_entries.py:253`); `weight_entries` declares update before list; mood adds its validator (in the schema, not the route). `water_entries` (+bowl ref) and `medication_entries` (+catalog) are variations; `food_entries` and `dashboard` are genuinely distinct.
- Frontend mirrors this: 13 near-identical `src/api/*.ts` fetch modules and a family of similar tracker pages.

**Safest consolidation (in order of risk):** (1) one shared `get_db` in an `app/dependencies.py` — mechanical, zero behavior change, deletes ~150 duplicated lines; (2) optionally a shared "fetch-or-404" helper. A generic CRUD router factory is **not** recommended: it trades visible simplicity for indirection, against SPEC priority order, and the honest mitigation for the remaining duplication is a documented procedure ("add a tracker module" skill — see `docs/review/03_AGENT_DOCS.md`).

---

## Finding 8 — Validation inconsistency ✅ CONFIRMED; full schema inventory

**Severity: Low–Medium** (two trusted users; worst case is a nonsense value in a chart, not corruption — but negative weights/amounts would pollute trend data).

Complete inventory of `backend/app/schemas.py` (+ route-level checks):

| Field | Validation | Assessment |
|---|---|---|
| Vomit `severity` | `Literal["mild","moderate","severe"]` (schemas.py:252–264) | Strict ✓ |
| Mood ratings ×5 | `ge=1, le=5` + rating-or-notes model validator (schemas.py:277–300) | Strict ✓ |
| Food nutrition inputs | Range-checked **in the route**, not the schema (`foods.py:18–59`: can size > 0, calories > 0, 0 ≤ moisture < 100, percents ≥ 0) | Strict but misplaced; also as-fed percents have no upper bound (a 200% protein typo passes) |
| Food-entry weights | Route-level: starting ≥ bowl tare; ending ≤ starting; ending ≥ bowl tare (`food_entries.py:43–48, 71–81`) | Adequate ✓ |
| **Water `observation_type`** | Bare `str`, default `"drank_water"` (schemas.py:205–227) | **Loose** — the dashboard knows exactly three values and maps unknowns to a generic label (`dashboard.py:28–33`); model default duplicated in `models.py:136`. Should be a `Literal` |
| **Episode `severity`** | Bare optional `str` (schemas.py:230–239) | **Loose** — free text; dashboard falls back to "Shaking/wobbly episode" (`dashboard.py:144`). Decide: either a real enum or rename the field to reflect free text |
| **Weight `weight_lbs`** | No bounds (schemas.py:183–192) | **Loose** — 0, negative, or 500 lbs accepted; pollutes the most trend-sensitive tracker. Needs `gt=0` (+ sane upper bound) |
| **Fluid `amount_ml`** | No bounds (schemas.py:161–170) | **Loose** — negative ml accepted |
| **Bowl `empty_weight_grams`** | No bounds (schemas.py:7–18) | **Loose** — negative tare would silently distort every future feeding calculation in that bowl |
| Name fields (`Bowl.name`, `Food.name`, `Medication.name`) | Bare `str` | **Loose** — empty string accepted (`min_length=1` warranted); `Medication.name` unique at DB level only |
| Medication `dose` | Optional free `str` | Acceptable — genuinely free-form ("1/4 tab") |
| Vet visit fields, `notes` everywhere | Optional free text | Correct as-is |
| `FoodCreate.brand`, BM `occurred` | typed appropriately | ✓ |

**Fix sketch.** One schema pass: `Literal` for water observation type; `gt=0` on weight/fluid/tare; `min_length=1` on names; upper bounds on as-fed percents; move food nutrition range checks from the route into the Pydantic schema (or field validators) so the contract is visible in one place. Coordinate with the frontend forms, which currently constrain some of this via UI options only (e.g. `HydrationPage` select).

---

## Finding 9 — Doc/deploy port mismatch ⚠️ MOSTLY FIXED; residue remains

**Severity: Low.** The prior review's claim is stale: commit `40a40a2` ("corrected port on README") updated README to 3010/8010, matching `docker-compose.yml:12,22` and SPEC.md:437–444. Remaining residue:

- **README.md:23** — the *local dev* section says `curl http://127.0.0.1:8010/health`, but the command it just gave (`uvicorn app.main:app --reload`, README.md:17) serves on **8000**. The correction overshot: local dev docs now carry the Docker port.
- **docker-compose.yml:21** — comment says "web app on the LAN at `http://<gamehendge-ip>:3000`" beside the `"3010:80"` mapping. Stale comment.
- **`backend/app/main.py:31–34`** — CORS `allowed_origins` lists `localhost:5173` and `localhost:3000` only. Harmless in production (nginx proxies same-origin so CORS never fires; Vite dev proxy likewise), but `:3000` is a fossil and direct-to-`:8010` browser access from a LAN origin would be blocked. Fix or document as intentionally dev-only.

---

## New findings not previously identified

**N1 — Deleting a Food (or a Bowl with completed feedings) returns a 500. Severity: Medium.** *Verified empirically against the real models:* `DELETE /foods/{id}` (`foods.py:165–176`) has **no usage guard at all**; `DELETE /bowls/{id}` guards only **open** feedings (`bowls.py:74–90`). In both cases, `db.delete(parent)` triggers SQLAlchemy's default nullify cascade onto `food_entries.food_id`/`bowl_id`, which are NOT NULL — producing `sqlite3.IntegrityError: NOT NULL constraint failed` and an unhandled 500 to the caregiver. (Accidentally, this *protects* historical data — the delete never completes — but via a crash instead of the friendly 409 the open-feeding path already has.) Water entries are the silent counterpart: `water_entries.bowl_id` is nullable, so a bowl delete that gets past food entries would NULL those references without warning. **Fix sketch:** extend the bowl guard to any referencing feeding; add the equivalent guard to food delete; return 409 with the existing message style; test both.

**N2 — Bowl-tare variant of the historical rule** — folded into Finding 1 above because it is the same defect class (live parent read on edit), but it was not in the prior review and doubles the snapshot requirement.

**N3 — SPEC timestamp rule violated in the dashboard.** `DashboardPage.tsx:48–50` re-implements `normalizeTimestamp` locally instead of using `src/utils/dateTime.ts`; SPEC.md:431–433 explicitly forbids per-page timestamp logic. Severity: Low (drift hazard — two copies of the append-`Z` heuristic can diverge).

**N4 — No HTTP-layer test coverage.** Every test calls route functions directly with a session (e.g. `tests/test_food_entries.py`), so FastAPI serialization (including the no-`Z` datetime boundary the frontend depends on), status codes-as-HTTP, validation-as-422, and the router wiring in `main.py` are all untested. Also no pytest/httpx in any requirements file. Severity: Medium for a data-bearing app with an auto-migrating startup.

**N5 — A mis-logged feeding's food/bowl cannot be corrected.** `FoodEntryUpdate` (`schemas.py:106–110`) has no `food_id`/`bowl_id`, so picking the wrong food requires delete-and-recreate. Minor caregiver-usefulness gap; becomes free to fix inside the mixed-feedings redesign. Severity: Low.

**N6 — `GET /food-entries` returns every row ever, ordered by id ascending** (`food_entries.py:251–253`), and `FoodEntryResponse.food_name` lazy-loads each entry's food (N+1). Fine at one-cat scale for years; note only. Severity: Low.

**N7 — Deprecated FastAPI startup hook.** `@app.on_event("startup")` (`main.py:44`) is deprecated in favor of lifespan handlers; will warn/break on a future FastAPI upgrade — which Finding 4 makes an *unpinned* upgrade. Severity: Low.

**N8 — Latent naive-passthrough in `entry_time_or_now`** (`time_utils.py:12–13`): naive client timestamps are trusted as UTC. Today's only client always sends `Z`-suffixed values, so this is a tripwire for future clients/scripts, not a live bug. Severity: Low. (Also the reason a curl-based manual entry with a local time would be silently misfiled.)

---

## Spec-vs-code drift list

Read against `SPEC.md` (the only spec in the repo or its git history — no `SPEC_v4.md` variant exists; see `02_DOC_AUDIT.md`):

1. **SPEC.md:140–149 (Historical Nutrition Rule) vs `food_entries.py:150–205`** — violated on entry edit. The headline finding.
2. **SPEC.md:431–433 (shared timestamp utilities only) vs `DashboardPage.tsx:48–50`** — duplicated per-page timestamp logic.
3. **SPEC.md:479–490 (Database Rules: backup → test on copy → verify → deploy) vs `main.py:44–49`** — migrations execute automatically at container startup; nothing in the deploy path enforces or even mentions the backup-first procedure. Process exists only as habit.
4. **SPEC.md:374–383 (Medication Tracking "Supports … Editing") vs `medication_entries.py`** — medication catalog rows can be created and listed but **not edited or deleted** (`medication_entries.py:34–57`); only administration *entries* are editable. Either the spec over-claims or the feature is half-shipped.
5. **SPEC.md:59–65 vs ROADMAP.md:7–13 — the two documents disagree on the project's priority order** (SPEC: …simplicity > maintainability > learning; ROADMAP: …simplicity > data safety > safe incremental improvements). Both claim to govern development. Genuine contradiction; see doc audit.
6. **ROADMAP.md:124–127 ("Current backups are manual") vs operational reality** stated in the project brief (daily 2am backups to two machines, restore tested). The roadmap is stale on the single most important safety fact, and the real backup procedure is documented nowhere in the repo.
7. **SPEC.md:437–444 (ports 3010/8010)** — compose matches; README's *local dev* health-check line and the compose comment do not (Finding 9).
8. **SPEC.md:117–120 ("Backend remains the source of truth. Do not move nutrition calculations into the frontend")** — respected for nutrition math; borderline: the daily calorie goal is a hardcoded frontend constant (`CALORIE_GOAL = 190`, `DashboardPage.tsx:10`), a care-domain number living outside the backend. Not a violation of the letter; worth a deliberate decision.
9. **SPEC.md:406–416 (UI: `.ref-card` etc.)** — not audited class-by-class in this review; no claim made. (Explicitly marked unverified.)

**Prior-review claims corrected:** the port mismatch (Finding 9) is fixed on `main`; the frontend dependency risk (Finding 4) is materially smaller than reported because of the committed lockfile + `npm ci`; the historical-nutrition bug (Finding 1) is *larger* than reported (bowl tare included); root doc inventory in the brief (`SPEC_v4.md`, `codebase-overview.md`) does not match the repo — neither file exists on `main` or anywhere in git history.
