# 03 — Agent-Facing Docs & Skills: Recommendations

Context: this repo is worked by ChatGPT (planning), Codex, Claude (review), and Claude Code (execution). Guiding constraint: SPEC's simplicity priority — every file below must earn its keep, and no rule should live in two places.

## CLAUDE.md — **Yes.** Draft: `docs/review/CLAUDE.draft.md`

Claude Code auto-reads it every session; today each session must rediscover the stack, the ports, how to run tests, and — critically — the Historical Nutrition Rule, which the code itself actively contradicts (an agent inferring conventions *from the code* will learn the wrong rule). That last point alone justifies the file. The draft is deliberately tight (~60 lines): stack, run/test commands, four non-negotiable domain rules, key conventions (naive-UTC, snapshot pattern, routing checklist), and a "do not touch" list. It **points to** SPEC.md rather than restating it, so there is one source of truth for domain rules and CLAUDE.md only carries the executive summary an agent needs before its first edit.

## AGENTS.md — **Yes, but as the same file, not a second document.**

Codex and most non-Claude agents read `AGENTS.md`; the content it needs is byte-for-byte what CLAUDE.md needs. Two hand-maintained copies **will** drift — this repo already demonstrates doc drift with only three docs (see `02_DOC_AUDIT.md`). Single-source strategy, in order of preference:

1. **Symlink** `CLAUDE.md → AGENTS.md` (git stores symlinks fine; both toolchains follow them). One file, two names, zero drift. Make `AGENTS.md` the real file since it's the vendor-neutral name.
2. If any tool on the team mishandles symlinks (e.g. a Windows checkout without symlink support), fall back to: `AGENTS.md` is canonical, `CLAUDE.md` contains a single line — "Read AGENTS.md; it is the agent guide for this repo." — and nothing else.

The draft is therefore written to be agent-agnostic (no Claude-specific phrasing) so it can serve as `AGENTS.md` verbatim.

## ARCHITECTURE.md — **Yes.** Draft: `docs/review/ARCHITECTURE.draft.md`

Justification: the three highest-risk areas found in `01_INTEGRITY.md` — the point-in-time snapshot model, the naive-UTC time convention, and the startup-migration approach — are all *invisible conventions*: nothing in the code declares them, and getting any of them wrong corrupts caregiving data. They need exactly one written home. SPEC.md is the wrong home (it's product intent, and it's already tempted to absorb implementation detail); CLAUDE.md is the wrong home (it should stay short). A ~120-line ARCHITECTURE.md is the right container, and it also absorbs the module map role of the phantom `codebase-overview.md`. It documents the *intended* snapshot model while flagging the known deviation, so agents fixing the bug don't mistake the bug for the design.

## Skills — one now, two when the work exists

Candidates evaluated against "repeatable + error-prone + agents will actually do it":

| Candidate | Verdict |
|---|---|
| **Safe SQLite migration** | **Draft now** (`docs/review/SKILL.safe-sqlite-migration.draft.md`). Highest value: the action plan (05) front-loads two schema changes (nutrition snapshot, then mixed feedings — a destructive parent/child split), the current hand-rolled migration style has a demonstrated footgun (a stale schema frozen inside a table rebuild, see 01 §6), and SPEC.md:479–490 mandates a backup-test-verify procedure that exists only as habit. A skill turns that habit into an executable checklist. |
| Pre-change backup + verify | **Fold into the migration skill**, not a separate file — backup/verify is steps 1–3 of any migration and has no standalone trigger distinct from "I'm about to change the schema or bulk-edit data." A second skill would be the doc equivalent of the `get_db` duplication. |
| Add a new tracker module | **Worth having, write later.** Genuinely repeatable (7 near-identical modules prove the template exists) and multi-layer (model + schema + route + `main.py` + nginx + Vite proxy + API client + page — SPEC.md:460–476 already lists the routing layers because people forget them). But ROADMAP explicitly says new trackers are *not* the priority (ROADMAP.md:270–282), and the template should be captured **after** the consolidation pass (shared `get_db`, validation conventions) so it stamps out the improved pattern, not today's. |

Not proposed: deploy skill (it's three commands already in README), test-running skill (one command once documented in CLAUDE.md/AGENTS.md).

## Summary of proposed final state

```
AGENTS.md            (canonical agent guide — from CLAUDE.draft.md)
CLAUDE.md            (symlink or one-line pointer to AGENTS.md)
ARCHITECTURE.md      (from ARCHITECTURE.draft.md)
.claude/skills/safe-sqlite-migration/SKILL.md   (from SKILL draft)
```
Four artifacts, no duplicated rules: domain rules live in SPEC.md; system conventions in ARCHITECTURE.md; the agent guide points at both; the skill operationalizes SPEC's database rules.
