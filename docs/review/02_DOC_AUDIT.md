# 02 — Documentation Audit (root Markdown)

Audited: 2026-07-03 at commit `40a40a2`.

## Inventory — the actual file list

The repository root contains exactly **three** Markdown files (verified by `git ls-files` and a full filesystem listing):

| File | Lines | Self-declared version | Last touched |
|---|---|---|---|
| `README.md` | 119 | — | `40a40a2` (port correction) |
| `SPEC.md` | 542 | "Gizmo SPEC.md v3" (SPEC.md:1) | `a80d262` |
| `ROADMAP.md` | 282 | "Gizmo Roadmap v3" (ROADMAP.md:1) | `a80d262` |

**The review brief's expected inventory is wrong.** There is no `SPEC_v4.md` and no `codebase-overview.md` — not in the working tree, not ignored on disk, and not anywhere in git history (`git log --all -- SPEC_v4.md codebase-overview.md` returns nothing; the only spec file ever committed is `SPEC.md`, across 4 commits). There is **no version drift between multiple SPEC files, because only one exists.** The "v3" in the heading is an internal revision label, not a filename variant. Whatever `SPEC_v4.md` the planning agent referenced lives outside this repository (likely in a ChatGPT conversation) — which is itself a workflow finding: spec revisions are being drafted somewhere Git can't see, and the handoff process (see `04_HANDOFF_TEMPLATE.md`) should require that the in-repo `SPEC.md` is the only citable spec.

Non-root docs: none (no other `*.md` tracked anywhere). `codex-logs/` and `codexSession` are gitignored scratch, correctly excluded.

## Per-file assessment

### README.md — purpose: run & deploy instructions. **Canonical, mostly accurate.**
- Accurate: repo layout, Docker workflow, volume name `gizmo_gizmo-data`, restore procedure, LAN URLs (3010/8010 — fixed in `40a40a2`).
- Wrong: the local-dev health check `curl http://127.0.0.1:8010/health` (README.md:20–24) — bare `uvicorn --reload` (README.md:17) serves on **8000**. The port fix overcorrected.
- Stale: "Simple backup option" via `docker compose cp` (README.md:106–118) reads as the *only* backup story; per the project brief, automated daily 2am backups to two machines exist and a restore has been tested. **The real backup/restore procedure is documented nowhere in the repo** — the highest-value doc gap found in this audit, given data safety is the project's stated non-negotiable.
- Bloat: none worth removing; the file is appropriately small.

### SPEC.md — purpose: product intent + domain rules + operating rules. **Canonical and load-bearing, with drift.**
This is the best document in the repo: the Historical Nutrition Rule (SPEC.md:140–149), priority order (:59–65), timestamp rules (:420–433), routing checklist (:460–476), and database rules (:479–490) are exactly the kind of content agents need. Issues:
- **Code actively contradicts it** in two places (violated nutrition rule; duplicated page-level timestamp logic) — detailed in `01_INTEGRITY.md` §Drift. The spec is right; the code is wrong. Do not "fix" the spec.
- Over-claims: Medication Tracking "Supports … Editing" (:374–383) — the catalog has no edit/delete routes.
- Scope creep into UI micro-detail: the Food Entry card layout diagram (:250–271) and the exact collapsed/expanded field lists for Foods (:196–237) freeze pixel-level decisions that the git log shows changing every few weeks (commits `5e027a2`, `29cb69b`, `760ab25` are all feeding-card redesigns). This is where SPEC.md will rot first. Recommend trimming to the *invariants* ("actions belong in expanded views only", "mobile-first stacked layouts") and letting the code own the rest.
- Duplication with ROADMAP: the Mixed Feedings section (:494–523) restates ROADMAP.md:23–69 nearly verbatim (goal, affected areas, required reviews).

### ROADMAP.md — purpose: future work & priorities. **Canonical for planning, stale in spots.**
- **Contradicts SPEC.md on the governing priority list**: ROADMAP.md:7–13 says `…3. Simplicity, 4. Data safety, 5. Safe incremental improvements` while SPEC.md:59–65 says `…3. Simplicity, 4. Maintainability, 5. Learning`. Two documents each claiming to define the tradeoff order is a genuine internal contradiction — an agent optimizing "learning" vs one optimizing "data safety" will make different calls. Pick one list (recommendation: SPEC's, amended to include data safety explicitly, since SPEC is the constitution) and make ROADMAP defer to it with a one-line pointer.
- Stale: "Current backups are manual" (ROADMAP.md:124–127) — backups are automated per the project brief. The whole "Backup Automation" priority (#4) appears substantially done and should be rewritten as "backup *verification/restore drill* automation" or closed out.
- Healthy: the Deferred list (:249–266) and Guiding Principle (:270–282) are genuinely useful guardrails against scope creep.
- Duplication: Mixed Feedings (see above); the Dashboard Evolution section (:158–180) restates SPEC's dashboard goal.

## Duplication / contradiction summary

| Issue | Where | Type |
|---|---|---|
| Priority order differs | SPEC.md:59–65 vs ROADMAP.md:7–13 | **Contradiction** |
| Mixed Feedings spec'd twice | SPEC.md:494–523 vs ROADMAP.md:23–69 | Duplication (will drift) |
| Dashboard "10 seconds" goal | SPEC.md:170–178 vs ROADMAP.md:158–166 | Duplication (benign, but pick one home) |
| Backup story | README (manual cp) vs ROADMAP ("manual") vs reality (automated ×2 machines) | Staleness ×2 + missing doc |
| Local dev port | README.md:23 vs README.md:17 | Internal contradiction |
| Medication editing | SPEC.md:374–383 vs `medication_entries.py` | Code contradicts doc |
| Historical Nutrition Rule | SPEC.md:140–149 vs `food_entries.py:150–205` | **Code contradicts doc (fix code)** |

## Consolidation plan

Target document set — four files, each the single source of truth for one kind of information, plus the agent docs proposed in `03_AGENT_DOCS.md`:

1. **README.md** — *how to run and deploy.* Fix the local-dev port line; add a short "Backups" section documenting the real automated backup (schedule, both destinations, restore procedure and the fact it's been tested) or link to wherever that script lives. Nothing else changes.
2. **SPEC.md** — *what the product is and the non-negotiable rules.* Keep: purpose, priority order (make it the **only** priority list, adding data safety), domain rules, timestamp rules, API routing rules, database rules, success criteria. Trim: the pixel-level card layout and field-list sections down to their invariant sentences. Replace the Mixed Feedings section with two lines + pointer to ROADMAP. Fix the medication over-claim. Net effect: shorter and more durable, not longer.
3. **ROADMAP.md** — *what's next and why.* Own Mixed Feedings entirely. Delete its local priority list in favor of "Priorities: see SPEC.md." Update the backup section to reflect reality. Keep the deferred list.
4. **ARCHITECTURE.md** (new — drafted at `docs/review/ARCHITECTURE.draft.md`) — *how the system actually works*: module map, data flow, the snapshot model, time-handling convention, migration approach. This absorbs the role the phantom `codebase-overview.md` was presumably meant to play, and gives SPEC.md somewhere to *not* grow implementation detail.

Explicitly **not** proposed (anti-bloat): no CONTRIBUTING.md, no CHANGELOG.md, no per-module docs, no duplicate SPEC variants. When a spec revision is drafted with an outside agent, the deliverable is an edit to `SPEC.md` in a PR — never a new versioned file. If `docs/review/` (this folder) has served its purpose after the action plan is executed, delete it too.
