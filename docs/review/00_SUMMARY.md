# Gizmo Deep Review — Summary & Index

Review date: 2026-07-03, commit `40a40a2` (`main`, clean). Every claim verified against source with file:line citations; one finding (delete-with-history → 500) verified empirically; full backend test suite run (40/40 pass).

## Index of deliverables

| File | Contents |
|---|---|
| `01_INTEGRITY.md` | The 9 prior findings confirmed/corrected with severities and fix sketches; 8 new findings; full spec-vs-code drift list |
| `02_DOC_AUDIT.md` | Root-doc inventory (3 files — the rumored `SPEC_v4.md`/`codebase-overview.md` have never existed in git), contradictions, consolidation plan |
| `03_AGENT_DOCS.md` | Recommendations: single-sourced AGENTS.md/CLAUDE.md, ARCHITECTURE.md, one skill now |
| `CLAUDE.draft.md` | Ready-to-adopt agent guide (written agent-agnostic, usable as AGENTS.md) |
| `ARCHITECTURE.draft.md` | Module map, data flow, snapshot model, time convention, migration approach |
| `SKILL.safe-sqlite-migration.draft.md` | Backup → rehearse-on-copy → verify → rollback procedure |
| `04_HANDOFF_TEMPLATE.md` | Multi-agent brief template + relay-vs-direct routing rules |
| `05_ACTION_PLAN.md` | Dependency-ordered plan: safety net → cleanup → snapshot fix → mixed feedings |
| `06_HEALTH.md` | Classification (production-in-fact MVP), verdict (save it), 1–10 scores |

## Top 5 things that matter most

1. **The Historical Nutrition Rule is violated — and via *two* live parents.** `update_food_entry` (`backend/app/routes/food_entries.py:150–205`) recalculates a completed entry's nutrition from the **live Food** and recomputes weights from the **live Bowl tare**; `FoodEntry` stores no per-gram snapshot, so any edit of a historical entry after a food/bowl edit silently rewrites history. This is the exact thing SPEC.md:140–149 forbids, and the test suite passes only because its test never changes the food in between (`tests/test_food_entries.py:130`). The fix (snapshot columns) is also the architectural prerequisite for mixed feedings. (01 §1–2)
2. **Every homelab rebuild silently upgrades the entire backend.** `requirements.txt` is four bare names and the Dockerfile pip-installs fresh on `--build` — unreviewed framework majors can land under production caregiving data at any redeploy. Frontend is safer than previously reported (committed lockfile + `npm ci`). Pinning is a ten-minute fix. (01 §4)
3. **Schema changes deploy themselves.** Unversioned migrations run at every container startup, one existing rebuild migration embeds a stale frozen schema, and SPEC's backup-test-verify rule exists only as habit. Mixed feedings (a destructive parent/child split) cannot ride this safely — hence the versioned-migration step and the safe-migration skill. (01 §6, skill draft)
4. **Deletes are broken at the edges.** `DELETE /foods/{id}` with any feeding history, or a bowl with completed feedings, crashes with an unhandled 500 (verified); SQLite FK enforcement is off on every runtime connection, so only app-level checks and that accidental crash protect referential integrity. (01 §3, N1)
5. **The docs disagree about what governs the project, and the planning loop cites files that don't exist.** SPEC and ROADMAP carry different priority lists; ROADMAP's backup section is stale; the real backup procedure is documented nowhere; and this review's own brief referenced `SPEC_v4.md` and `codebase-overview.md`, which have never been in the repo — evidence that spec revisions live in chat threads outside git. (02, 04)

## The single most important thing to do next

**Fix the historical-nutrition snapshot (action plan item 8) — but reach it through the short safety runway in front of it:** pin the backend deps, land the corrected tests as the executable spec, enable FK enforcement, and stand up minimal versioned migrations (items 1, 3, 6, 7 — roughly one focused week). That one arc removes the only Critical finding, converts the spec's most important rule from prose into tests, rehearses the migration discipline on a small additive change, and leaves the codebase genuinely ready for mixed feedings — the feature Jackie actually asked for.
