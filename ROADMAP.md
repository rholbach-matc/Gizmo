# Gizmo Roadmap v3

This roadmap captures upcoming work for Gizmo and should guide future development priorities.

Gizmo is an actively used caregiving application containing production caregiving data.

Prioritize:

1. Caregiver usefulness
2. Reliability
3. Simplicity
4. Data safety
5. Safe incremental improvements

When roadmap priorities conflict with real caregiver feedback:

Jackie feedback takes precedence.

---

# Current Strategic Priorities

## 1. Mixed Feedings Architecture

Status:

Planned.

Requested by Jackie.

### Goal

Allow a single feeding to contain multiple foods within the same bowl.

Examples:

* Hill's k/d + Weruva WX
* Hill's k/d + Weruva WX + Tiki Cat

### Why It Matters

Current feeding workflows assume one food per feeding.

Real caregiving workflows increasingly involve:

* Mixing foods
* Gradual transitions
* Appetite management
* Calorie optimization

### Required Reviews Before Implementation

* Product review
* Architecture review
* Data model review
* Migration review
* Historical nutrition review
* UX review

### Risks

* Nutrition calculations
* Historical data integrity
* Dashboard totals
* Feeding workflow complexity

Design first.

Do not implement immediately.

---

## 2. Quality Of Life Check-In

Develop an original Gizmo Quality of Life Check-In.

Do not reproduce copyrighted questionnaires.

Store:

* Date
* Responses
* Total score
* Notes

Provide:

* Historical results
* Trend visibility

Goal:

Support caregiver awareness of long-term quality-of-life changes.

---

## 3. Trend Expansion

The dashboard should increasingly support trend awareness.

Potential trends:

* Calories
* Weight
* Episodes
* Yowls
* Vomits
* Fluids
* Mood
* Quality of Life

Goal:

Help caregivers identify:

* Improvement
* Stability
* Decline

without requiring manual interpretation.

---

## 4. Backup Automation

Current backups are manual.

Future work:

* Automated SQLite backups
* Retention policies
* Restore verification process

Goal:

Protect caregiving data without adding caregiver burden.

---

## 5. Reminder System

Future work:

* Fluid reminders
* Medication reminders
* Calorie reminders

Requirements:

* Configurable
* Informational
* Non-medical

Avoid hard-coded schedules.

---

# Dashboard Evolution

The dashboard remains the primary application screen.

The dashboard should answer:

> How is Gizmo doing today?

in under 10 seconds.

Future improvements should favor:

* Better visibility
* Better trends
* Better caregiver awareness

Avoid:

* Dashboard bloat
* Excessive scrolling
* Large numbers of new overview cards

Prefer improving existing dashboard components when possible.

---

# Reference Library Expansion

The Foods page now functions as a nutrition reference library.

Future opportunities:

* Search
* Filter
* Favorites
* Recently used foods
* Nutrition comparison views

These are lower priority than Mixed Feedings and Quality of Life work.

---

# Historical Review Improvements

Future possibilities:

* Day-to-day comparisons
* Weekly summaries
* Monthly summaries
* Feeding summaries
* Symptom summaries

Goal:

Make historical care review faster and more useful.

---

# Data Management

Future work:

* CSV export
* Date-range filtering
* Printable summaries
* Shareable reports
* Backup restore workflow

Protecting caregiving data remains mandatory.

---

# UI Improvements

Continue improving:

* Mobile usability
* Dashboard clarity
* Feeding workflows
* Reference library usability
* Historical review usability

Prioritize:

* Fewer taps
* Less typing
* Faster entry
* Reduced caregiver cognitive load

---

# Deferred / Complex Features

Not currently prioritized:

* Medication schedules
* Medication inventory tracking
* Refill management
* Authentication
* Multi-user support
* Multi-pet support
* Cloud synchronization
* Hosted deployment
* Push notifications
* Automated vet record imports
* Medical diagnosis
* Treatment recommendations

These should only be considered if they clearly improve caregiver usefulness.

---

# Guiding Principle

The most valuable future work is not necessarily new trackers.

The highest-value improvements are those that help caregivers:

* Understand Gizmo faster
* Make better care decisions
* Recognize meaningful changes over time
* Reduce caregiving stress

Usefulness is more important than technical sophistication.
