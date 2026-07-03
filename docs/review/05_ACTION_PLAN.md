# 05 — Sequenced Action Plan

Dependency-ordered, smallest and safest first. Sizes: S (≤1 session), M (1–3 sessions), L (multi-stage). Execution routing per `04_HANDOFF_TEMPLATE.md`. Nothing here is application code — this is the plan only.

## Phase 0 — Safety net (do before any code change)

**0. Document & rehearse the real backup story** — S, risk none, prereqs none, relay OK.
Write the actual automated-backup facts (schedule, both destinations, restore steps, last tested date) into README's backup section, and adopt the safe-migration skill (from `SKILL.safe-sqlite-migration.draft.md` → `.claude/skills/safe-sqlite-migration/SKILL.md`). Why first: every subsequent item leans on "restore works and everyone knows how."

## Phase 1 — Cleanup pass (independent, low-risk; any order, though listed smallest-first)

**1. Pin backend dependencies** — S, risk low, prereqs none, relay OK.
`pip freeze`-derived exact pins in `requirements.txt`; add `requirements-dev.txt` (pytest). Align frontend `package.json` versions with the committed lockfile (cosmetic; `npm ci` already protects builds). Why: currently every homelab rebuild silently upgrades the entire backend under production data — the cheapest reliability win in the repo.

**2. Doc consolidation** — S, risk none, prereqs none, relay OK.
Execute `02_DOC_AUDIT.md`'s plan: fix README local-dev port line and compose port comment; unify the priority list (SPEC owns it, add data safety; ROADMAP points to it); de-duplicate Mixed Feedings into ROADMAP; fix the medication "Editing" over-claim; update ROADMAP's stale backup section. Land agent docs: `AGENTS.md` (from `CLAUDE.draft.md`) + `CLAUDE.md` symlink/pointer + `ARCHITECTURE.md` (from draft).

**3. Enable SQLite FK enforcement + fix delete guards** — S/M, risk medium (behavior change on deletes), prereqs: item 0, **direct execution**.
`connect`-event `PRAGMA foreign_keys=ON` in `database.py`; extend the bowl-delete guard to completed feedings and add the missing food-delete guard (409 instead of today's 500 — Integrity Finding N1); decide water/medication nullable-FK delete semantics; tests for all three. No schema change, but verify against a production copy because FK-on can surface latent orphans.

**4. `utcnow()` migration** — S, risk low, prereqs none, direct or relay.
Single `utc_now()` helper in `time_utils.py`; replace the 16 `datetime.utcnow` uses (models defaults, food_entries, time_utils). Keep naive-UTC storage semantics identical; also remove the duplicated `normalizeTimestamp` in `DashboardPage.tsx` in favor of the shared util. Tests must stay green with zero behavior change.

**5. Consolidate `get_db` + validation pass** — S, risk low, prereqs none, relay OK.
One `get_db` in `app/dependencies.py` (deletes 13 copies). Schema tightening per Integrity Finding 8: `Literal` water observation type, `gt=0` on weight/fluids/tare, `min_length=1` on names, percent upper bounds. Coordinate with frontend form inputs.

**6. Test-suite upgrade** — S/M, risk none, prereqs item 1 (pytest pinned), relay OK.
Add HTTP-layer tests via FastAPI TestClient (serialization incl. the no-`Z` datetime contract, 422s, router wiring); rewrite `test_update_completed_food_entry_recalculates_nutrition` into its historical-preservation form **as a currently-failing/xfail spec test** documenting the intended contract for item 8.

## Phase 2 — Nutrition snapshot fix (the preparation for mixed feedings)

**7. Adopt versioned migrations (minimal)** — M, risk medium, prereqs items 0, 3, **direct execution**.
Either Alembic or a minimal `schema_version`-table runner executing numbered, ordered, one-shot scripts (recommendation: the minimal runner — Alembic's autogenerate is overkill for SQLite-only and the simplicity priority; revisit if it chafes). Existing idempotent startup functions stay as-is for old DBs; new changes go through the runner. First rehearsal of the safe-migration skill end-to-end.

**8. Historical-nutrition snapshot fix** — M, risk **high** (touches the most important data), prereqs items 0, 6, 7, **direct execution — one atomic change**.
Per Integrity Finding 1: add snapshot columns to `food_entries` (bowl tare, calories/gram, five as-fed percents); populate at create/finish; rewrite `update_food_entry` to recalculate **only from the entry's own row** (both food and bowl inputs); backfill existing rows from current catalog (documented as best-available); flip the xfail tests from item 6 to green. This is deliberately sequenced *before* mixed feedings: it fixes the standing SPEC violation and establishes the per-line snapshot shape mixed feedings will reuse.

## Phase 3 — Mixed feedings

**9. Mixed feedings** — L, risk high, prereqs everything above (esp. 7, 8), **direct execution, staged** with the reviews SPEC.md:514–523 mandates (product/architecture/data/migration/UX) before code.
Shape sketched in Integrity Finding 6: new `food_entry_items` child table carrying per-food weights + per-gram snapshots; migration backfills one item per existing entry; `food_entries` keeps entry-level lifecycle (open/finished, bowl, times) and aggregate totals; dashboard sums stay entry-level; feeding UI gains multi-food entry. Suggested stages: (a) schema + backfill behind unchanged API, (b) backend API for multi-item entries, (c) UI. While in there, allow correcting a mis-logged food on an item (Finding N5) — free at that point.

## Explicitly deferred

- Generic CRUD-factory refactor of the 13 tracker modules (indirection vs. simplicity — the "add a tracker" skill is the better mitigation, written after item 5).
- Timezone-aware storage migration (zero caregiver value, real risk).
- Frontend URL router, pagination, CI pipeline — revisit only if they start costing caregiver-visible reliability.

## Dependency graph (summary)

```
0 ─┬─► 3 ─► 7 ─► 8 ─► 9
   │         ▲    ▲
1 ─┴─► 6 ────┘────┘      2, 4, 5: independent, anytime in Phase 1
```
