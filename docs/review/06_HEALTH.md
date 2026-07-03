# 06 — Health Snapshot

**Classification: production-in-fact MVP.** Not a prototype — it holds real caregiving data, is used daily by two people, has 40 passing tests, working Docker deployment, cache-correct nginx, and tested backups. Not production-*ready* by general standards (unpinned deps, one standing spec violation, hand-rolled migrations), but production-*operating* within its stated scope.

**Worth saving? Unambiguously yes.** The architecture is coherent, the spec is unusually good, the codebase is small (~4.5k lines backend incl. tests), and every serious defect found has a bounded, sequenced fix (see 05). Rewriting would discard a working, data-bearing system to fix problems that are two or three weekends of careful work.

| Dimension | Score | One line |
|---|---|---|
| Documentation | 7/10 | SPEC.md is genuinely strong on domain rules; docked for the SPEC/ROADMAP priority-list contradiction, stale backup story, and the undocumented architecture conventions (naive-UTC, snapshot model). |
| Architecture | 6/10 | Clean layering and a correct snapshot *philosophy*, but the flagship table doesn't implement it (no per-gram snapshot), and unversioned auto-migrations at startup are a ceiling on safe evolution. |
| Maintainability | 6/10 | Small, uniform, readable modules and good tests-per-line; docked for 13× `get_db`, copy-paste CRUD, and one test that enshrines the core bug. |
| Deployment readiness | 7/10 | Compose + volume persistence + cache headers + tested restore is better than most hobby projects; docked for unpinned backend deps making every rebuild a lottery, and no health-gated migration step. |
| Code quality | 7/10 | Consistent, boring-in-the-good-way Python and TypeScript with real validation in places; docked for the update-path recalculation bug, 500-on-delete, and loose validation on weight/fluids. |

**Net: 6.5/10 — a healthy small system with one critical, well-understood defect and a clear path.** The single score-moving action is Phase 2 of the action plan (snapshot fix); the single risk-moving action is pinning the backend dependencies, which costs about ten minutes.
