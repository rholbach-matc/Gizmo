# Gizmo SPEC.md v3

## Project Purpose

Gizmo is a caregiving application for tracking, reviewing, and understanding health data for a chronically ill senior cat.

Primary users:

* Jackie
* Ryan

Primary goal:

Help caregivers quickly answer:

* How is Gizmo doing today?
* Did he eat enough?
* Has he been drinking?
* When were fluids last given?
* Has he had a BM?
* Have there been recent episodes?
* Have there been recent yowls?
* Has vomiting increased?
* Is his condition improving, stable, or declining?

The application prioritizes caregiver usefulness over technical perfection.

---

# Technology Stack

Frontend

* React
* TypeScript
* Vite
* Plain CSS

Backend

* FastAPI
* SQLAlchemy

Database

* SQLite

Deployment

* Docker
* Docker Compose
* nginx
* Gamehendge Homelab

---

# Core Product Rules

Priority Order

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

* Name
* Empty Weight
* Color
* Notes

---

## Foods

Nutrition data is based on guaranteed analysis.

Foods store:

### Package Information

* Can Size
* Calories Per Can
* Calories Per Gram

### As-Fed Values

* Moisture
* Protein
* Fat
* Phosphorus
* Sodium

### Dry Matter Values

* Protein
* Fat
* Phosphorus
* Sodium

Backend remains the source of truth.

Do not move nutrition calculations into the frontend.

---

## Food Entries

Food entries represent feeding events.

Food entries store calculated nutrition values.

Stored values include:

* Food Eaten
* Calories Consumed
* Protein Consumed
* Fat Consumed
* Phosphorus Consumed
* Sodium Consumed
* Moisture Consumed
* Dry Matter Consumed

### Historical Nutrition Rule

Historical food entry values must remain accurate even when Foods are edited later.

FoodEntry records are the source of truth.

Never recalculate historical nutrition values from current Food definitions.

Food edits affect future feedings only.

---

# Functional Areas

## Dashboard

Dashboard is the primary application screen.

Current responsibilities:

* Today Overview
* Behavior Overview
* Open Feeding Visibility
* Daily Calorie Visibility
* Care Status
* Recent Care Activity
* Unified Timeline
* Historical Navigation
* Basic Trend Visibility

Dashboard goal:

Answer:

> How is Gizmo doing today?

in under 10 seconds.

Dashboard additions should be evaluated carefully to avoid excessive scrolling.

---

## Historical Day View

Implemented.

Provides:

* Historical summaries
* Historical timeline review
* Historical feeding review
* Historical care review

---

## Foods Reference Library

Foods function as a caregiver reference library.

### Collapsed View

Displays:

* Brand
* Can Size
* Calories Per Can
* Food Name
* Calories Per Gram
* Protein Dry Matter %
* Phosphorus Dry Matter %
* Sodium Dry Matter %

### Expanded View

Displays grouped nutrition information:

PACKAGE

* Can Size
* Calories Per Can
* Calories Per Gram

AS-FED

* Moisture
* Protein
* Fat
* Phosphorus
* Sodium

DRY MATTER

* Protein
* Fat
* Phosphorus
* Sodium

Actions belong in expanded views only.

---

## Food Entries

Supports:

* Open Feedings
* Finished Feedings
* Editing
* Nutrition calculations

### Card Architecture

Food Entry cards use:

Status Badge
↓
Food Name
↓
Brand
↓
Summary Metrics
↓
Expandable Details
↓
Actions

Important:

Food names should never share horizontal rows with timestamps, badges, or metrics.

Use mobile-first stacked layouts.

---

## BM Tracking

Supports:

* Create
* Edit
* Delete

---

## Fluid Tracking

Supports:

* Create
* Edit
* Delete

Tracks Sub-Q fluid administration.

---

## Weight Tracking

Supports:

* Create
* Edit
* Delete

---

## Water Observations

Supports:

* Create
* Edit
* Delete

Tracks observed drinking events.

---

## Episode Tracking

Supports:

* Create
* Edit
* Delete

Tracks:

* Shaking
* Wobbling

Episodes are intentionally not labeled as seizures.

---

## Vomit Tracking

Supports:

* Create
* Edit
* Delete

Fields:

* Date/Time
* Severity
* Notes

Integrated into dashboard timelines.

---

## Mood Tracking

Supports:

* Create
* Edit
* Delete

Optional fields:

* Mood
* Appetite
* Energy
* Social
* Yowling
* Notes

Yowling observations contribute to dashboard behavior visibility.

---

## Medication Tracking

Supports:

* Medication Catalog
* Medication Administration Tracking
* Editing

No schedules or reminders currently.

---

## Vet Visits

Supports:

* Create
* Edit
* Delete

Tracks:

* Reason
* Summary
* Follow-Up
* Notes

---

# UI Architecture

Reusable shared styles exist.

Reference-library pages should use:

* .ref-card
* .ref-card-collapsed
* .ref-card-expanded
* .nutrition-grid
* .form-compact
* .form-section-label

Prefer extending existing patterns rather than creating new visual systems.

---

# Timestamp Rules

All caregiving entries support:

* Current timestamp
* Optional user-provided timestamp

Display:

* Local browser time

Use shared timestamp utilities.

Do not introduce per-page timestamp logic.

---

# Deployment Rules

Current deployment:

* Frontend: 3010
* Backend: 8010

SQLite must persist across container restarts.

---

# Cache Rules

Frontend updates should be visible after deployment without requiring manual cache clearing.

nginx rules:

* index.html must not be cached
* SPA fallback must not be cached
* Hashed Vite assets may be cached long-term

---

# API Routing Rules

When adding backend routes:

Update:

* Backend registration
* Frontend API client
* nginx proxy
* Vite proxy

Verify all routing layers.

If frontend receives HTML instead of JSON:

Check proxy routing first.

---

# Database Rules

SQLite remains the primary database.

Production data rules:

1. Backup before schema changes
2. Test migrations on copied database
3. Verify migration results
4. Deploy only after verification

Protecting caregiving data takes priority over development speed.

---

# Upcoming Architecture Work

## Mixed Feedings

Planned feature.

Goal:

Allow a single feeding to contain multiple foods in one bowl.

This affects:

* FoodEntry architecture
* Nutrition calculations
* Historical data rules
* Dashboard totals
* Feeding workflows

Do not redesign feeding architecture casually.

Mixed Feedings requires:

* Product review
* Architecture review
* Data review
* Migration review
* UX review

before implementation.

---

# Success Criteria

Gizmo is successful if caregivers can quickly determine:

* Did Gizmo eat enough?
* How many calories has he consumed?
* How much phosphorus has he consumed?
* Has he been drinking?
* When were fluids last given?
* Has he had a BM?
* Have there been recent episodes?
* Have there been recent yowls?
* Has vomiting increased?
* How is he doing today?

Usefulness is more important than technical perfection.
