# Gizmo SPEC.md

## Project Purpose

Gizmo is a caregiving application for tracking and reviewing health data for a chronically ill senior cat.

Primary users:

* Jackie
* Ryan

Primary goal:

Help caregivers quickly answer:

* How is Gizmo doing today?
* Did he eat enough?
* When were fluids last given?
* Has he been drinking?
* Has he had a BM?
* Have there been recent shaking episodes?

The application prioritizes caregiver usefulness over technical perfection.

---

# Current Technology Stack

Frontend:

* React
* TypeScript
* Vite
* Plain CSS

Backend:

* FastAPI
* SQLAlchemy

Database:

* SQLite

Deployment:

* Docker
* Docker Compose
* Gamehendge Homelab

---

# Core Product Rules

Priorities:

1. Caregiver usefulness
2. Reliability
3. Simplicity
4. Maintainability
5. Learning

When tradeoffs exist:

Prefer shipping useful functionality unless significant technical debt would be introduced.

---

# Domain Rules

## Bowls

Bowls represent tare weights.

Food calculations must always subtract bowl weight from measured totals.

Bowls store:

* name
* empty weight
* color
* notes

---

## Foods

Nutrition data is based on guaranteed analysis.

Foods store:

* can size grams
* calories per can
* calories per gram

As-fed values:

* moisture
* protein
* fat
* phosphorus
* sodium

Dry matter basis values:

* protein
* fat
* phosphorus
* sodium

Important:

Do not move nutrition calculations into the frontend.

Backend remains the source of truth.

---

## Food Entries

Food entries represent feeding events.

Backend calculates and stores:

* food eaten grams
* calories eaten
* protein consumed
* fat consumed
* phosphorus consumed
* sodium consumed
* moisture consumed
* dry matter consumed

Historical nutrition values must remain accurate even if food definitions change later.

Therefore:

Calculated values are stored on food entries.

---

# Current Functional Areas

## Dashboard

Dashboard is the primary application screen.

Current responsibilities:

* Today overview
* Care summary
* Care status
* Unified care timeline

The dashboard should answer:

"How is Gizmo doing today?"

in under 10 seconds.

---

## Food Tracking

Supports:

* Foods
* Bowls
* Food Entries
* Nutrition calculations

---

## BM Tracking

Supports:

* Create
* List
* Delete

---

## Fluid Tracking

Supports:

* Create
* List
* Delete

Tracks Sub-Q fluid administration.

---

## Weight Tracking

Supports:

* Create
* List
* Delete

---

## Water Observation Tracking

Supports:

* Create
* List
* Delete

Tracks observed drinking events.

Does not estimate water volume.

---

## Episode Tracking

Supports:

* Create
* List
* Delete

Tracks:

* Shaking
* Wobbling

Important:

Episodes are not labeled as seizures.

---

## Medication Tracking

Supports:

* Create
* List
* Delete

Tracks medication administration.

Does not currently manage schedules or reminders.

---

## Vet Visit Tracking

Supports:

* Create
* List
* Delete

Tracks:

* Reason
* Summary
* Follow-up requirements
* Notes

---

# Timestamp Rules

All caregiving entries support:

* Automatic current timestamp
* Optional user-provided timestamp

Display rules:

* Store consistently
* Display in local browser time

Use the shared frontend timestamp utilities.

Do not introduce per-page timestamp logic.

---

# Deployment Rules

Application runs through Docker Compose.

Current deployment:

* Frontend: port 3010
* Backend: port 8010

SQLite data must persist across container restarts.

Do not introduce infrastructure complexity without a clear benefit.

---

# Development Rules

When implementing tasks:

* Keep scope narrow
* Preserve existing workflows
* Follow existing CRUD patterns
* Keep code beginner-readable
* Avoid unnecessary abstractions
* Avoid large refactors unless explicitly requested

Prefer consistency over cleverness.

---

# Git Rules

Before changing code:

* Check current branch
* Check git status
* Mention unrelated modified files

After implementation:

* Summarize changed files
* Summarize verification steps
* Suggest a commit message

Do not automatically commit.

---

# Database Rules

SQLite remains the primary database.

Alembic is not currently required.

While pre-production:

Deleting and recreating the database is acceptable when schema changes require it.

Do not commit database files.

---

# Success Criteria

Gizmo is successful if caregivers can quickly determine:

* Did Gizmo eat enough?
* How many calories has he consumed?
* How much phosphorus has he consumed?
* When were fluids last given?
* Has he been drinking?
* Has he had a BM?
* Have there been recent shaking episodes?
* How is he doing today?

Usefulness is more important than technical perfection.
