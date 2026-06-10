# Gizmo SPEC.md

## Project Purpose

Gizmo is a caregiving app for tracking daily health data for a chronically ill senior cat.

Primary goal: help Jackie quickly record and review Gizmo's care information.

This is no longer primarily a learning project. Prioritize shipping useful functionality quickly.

## Current Tech Stack

* Frontend: React + Vite + TypeScript
* Backend: FastAPI + SQLAlchemy
* Database: SQLite
* Styling: plain CSS
* Development workflow: small Codex tasks, frequent commits

## Core Product Priorities

1. Help Jackie use the app immediately.
2. Keep workflows simple and fast.
3. Avoid unnecessary complexity.
4. Prefer working features over perfect architecture.
5. Preserve existing working functionality.

## Current Features

* Bowl management
* Food management
* Food entries / feedings
* Guaranteed analysis nutrition model
* Dry matter basis calculations
* Food entry nutrition calculations
* Today dashboard

## Important Domain Rules

### Bowls

Bowl weights are tare weights.

Food calculations must subtract empty bowl weight from total measured weight.

### Foods

Food nutrition is based on guaranteed analysis.

Foods store:

* can size grams
* calories per can
* calories per gram
* moisture percent
* dry matter percent
* protein as-fed percent
* protein dry matter percent
* fat as-fed percent
* fat dry matter percent
* phosphorus as-fed percent
* phosphorus dry matter percent
* sodium as-fed percent
* sodium dry matter percent

### Food Entries

Food entries represent one feeding / weighing event.

Backend calculates and stores:

* food eaten grams
* calories eaten
* protein consumed grams
* fat consumed grams
* phosphorus consumed mg
* sodium consumed mg
* moisture consumed grams
* dry matter consumed grams

Do not move nutrition calculations into the frontend.

## Development Rules for Codex

When implementing tasks:

* Keep scope narrow.
* Do not add unrelated features.
* Do not modify frontend when task says backend only.
* Do not modify backend when task says frontend only.
* Preserve existing routes and UI behavior.
* Keep code beginner-readable.
* Avoid large refactors unless explicitly requested.
* Prefer simple CRUD patterns already used in the project.

## Git Rules

Before changing code:

* Check current branch.
* Check git status.
* Mention any unrelated modified files.

After implementation:

* Summarize changed files.
* Summarize verification steps.
* Suggest a commit message.

Do not automatically commit.

## Database Rules

SQLite is currently used for development.

Alembic is not currently configured.

If models change during development, it is acceptable to delete and recreate `gizmo.db` while the app is still pre-production.

Do not commit SQLite database files.

## Immediate Roadmap

Next priorities:

1. BM Tracker
2. Sub-Q Fluids Tracker
3. Weight Tracker
4. Edit existing entries
5. Basic backups
6. LAN deployment to Gamehendge

## Success Criteria

The app is successful if Jackie can quickly answer:

* Did Gizmo eat today?
* How many calories did he consume?
* How much phosphorus did he consume?
* When did he last have fluids?
* When did he last poop?
* How is he doing today?

Usefulness matters more than technical perfection.
