# 04 — Multi-Agent Handoff Brief Template

Purpose: carry full context across the GPT (planning) → Claude (review) → Codex / Claude Code (execution) relay without information loss. Copy the template, fill every field — "N/A" is an acceptable answer, a missing field is not, because each blank field is exactly where relay loss happens (this review found one concrete example: a planning brief citing `SPEC_v4.md` and `codebase-overview.md`, files that have never existed in the repo).

Ground rules for every brief:
- **Cite only in-repo artifacts.** The spec is `SPEC.md` on `main` — never a spec draft living in a chat thread. If planning produced a spec change, the brief's first task is "edit SPEC.md," not "per the new spec…".
- **File paths with line numbers**, verified against `main` at a named commit, not from memory of a previous conversation.
- The executing agent treats the brief as *claims to verify*, not facts — its first step is confirming the Affected Files and Current Behavior sections against the actual code.

---

## Template

```markdown
# Task Brief: <short title>
Date / base commit: <YYYY-MM-DD> / <sha on main>
Relay stage: <planned by … / reviewed by … / executed by …>

## Goal
One paragraph: the caregiver-visible outcome (or reliability outcome), and why now.
State where it sits in SPEC priority order (usefulness / reliability / simplicity / …).

## Scope
- In scope: exact behaviors/files to change.
- OUT of scope (explicit): what an eager agent might "helpfully" also do, forbidden here.
  (e.g. "Do NOT refactor the other tracker modules while touching this one.")

## Affected files
| File | Expected change |
|---|---|
| backend/app/... | ... |
Include every layer: for new API routes that means main.py, nginx.conf,
vite.config.ts, src/api/*, per SPEC.md API Routing Rules.

## Domain rules & spec references
Quote (don't paraphrase) each governing rule with its SPEC.md line range.
Always check: Historical Nutrition Rule (SPEC.md:140–149), Timestamp Rules
(:420–433), Database Rules (:479–490). State explicitly if none apply.

## Current behavior (verified)
What the code does today, with file:line citations the executor can re-verify.
Mark anything unverified as UNVERIFIED.

## Acceptance tests
- Concrete, checkable: "editing entry X after changing food Y leaves calories_eaten == Z".
- Which automated tests to add/modify, and the exact command that must pass
  (backend: `python -m unittest discover -s tests` from backend/).
- Manual check in the running app, if any.

## Safety & rollback
- Git checkpoint: work on a branch off main; note the base sha above.
- Does this touch the DB schema or bulk data? If yes → the safe-sqlite-migration
  procedure is mandatory (backup, rehearse on copy, verify, rollback plan) and this
  task is DIRECT-EXECUTION class (see below).
- Rollback: what to revert and in what order if acceptance fails post-deploy.

## Context the next agent can't see
Everything that lived in a conversation, a caregiver's comment, or a prior agent's
reasoning and is NOT in the repo: why alternatives were rejected, Jackie's feedback,
constraints from the homelab, half-decisions ("we considered snapshotting per-gram
values as JSON and rejected it because …"). If this section is empty, say why.
```

---

## Relay loop vs. direct execution — routing rule

**Default rule of thumb:** isolated, single-layer, easily-reversible features → the relay loop (GPT plan → review → Codex/Claude Code execute) is fine and cheap. Anything where the *coupling itself* is the risk — migration + domain logic + tests must change in one coherent motion — goes **straight to Claude Code in-repo**, because relay loss between tightly coupled parts is exactly how half-migrations happen.

| Task type | Route | Why |
|---|---|---|
| New simple tracker / new page section / CSS & layout work | Relay OK | Pattern is established (7 near-identical modules); low blast radius; acceptance is visual/behavioral |
| Doc edits (README, SPEC, ROADMAP consolidation) | Relay OK | Reversible, no runtime risk |
| Dependency pinning, config hygiene (CORS, ports) | Relay OK, but executor must run tests + build | Mechanical |
| Bug fixes inside one module with existing tests | Relay OK | Tests define acceptance |
| **Anything touching `models.py` schema or `database.py` migrations** | **Direct execution** | Schema + logic + tests + rehearsal must stay coherent; auto-migration on startup means mistakes deploy themselves |
| **Nutrition snapshot fix** (05 plan item 8) | **Direct execution** | Migration + calculation rewrite + test rewrite are one atomic change |
| **Mixed feedings** | **Direct execution**, staged | Parent/child table split, backfill, dashboard, UI — the definitional coupled change |
| FK enforcement + delete-guard semantics | Direct execution (small but cross-cutting: DB pragma + route behavior + tests) |
| Multi-file mechanical refactors (shared `get_db`) | Either; direct is cheaper than writing the brief | Verification is "tests still pass" |

One more routing rule: if writing the brief's "Affected files" table takes longer than the change itself, skip the relay and execute directly with a self-written brief committed alongside the PR description.
