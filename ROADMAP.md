# Gizmo Roadmap

This roadmap captures upcoming work for Gizmo and should be used to guide implementation priorities.

Gizmo is an actively used caregiving application containing real caregiving data.

Prioritize caregiver usefulness, reliability, simplicity, and safe incremental improvements.

---

# Current Priorities

1. Historical Day View
2. Vomit Tracker
3. Mood Tracker
4. Food Nutrition Improvements
5. Quality of Life Check-In
6. Trend Expansion
7. Backup Automation
8. Reminder System

When priorities conflict, caregiver feedback takes precedence over roadmap ordering.

---

# Near-Term Features

## Historical Day View

Allow caregivers to review a previous day's care activity.

Display:

* Calories consumed
* Food entries
* Fluids
* Weight
* Medications
* Episodes
* Water observations
* BM activity
* Unified timeline

Goal:

Help caregivers answer:

"How was Gizmo doing on a specific day?"

---

## Vomit Tracker

Track:

* Date/time
* Severity
* Notes

Future considerations:

* Hairball
* Bile
* Blood
* Food present

Integrate with:

* Dashboard
* Timeline
* Future trends

---

## Mood Tracker

Track quality-of-life indicators over time.

Fields:

* Mood rating (1-5)
* Appetite rating (1-5)
* Energy rating (1-5)
* Notes

Integrate with:

* Timeline
* Historical trends

Goal:

Provide visibility into behavioral changes that may not be reflected in nutrition or weight data.

---

## Food Nutrition Improvements

Improve management of saved foods and bowls.

Allow editing of:

* Foods
* Bowls

Improve visibility of:

* Can size
* Calories per can
* Moisture
* Protein
* Fat
* Phosphorus
* Sodium

Protect reference data from accidental deletion.

---

# Quality Of Life

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

# Dashboard And Trends

The dashboard remains the primary application screen.

The dashboard should help caregivers identify:

* Improvement
* Stability
* Decline

Future work:

* Vomit trends
* Mood trends
* Episode trends
* Weight trends
* Medication adherence trends
* Quality-of-life trends
* Historical day comparisons
* Daily summaries
* Weekly summaries

The dashboard should continue answering:

"How is Gizmo doing today?"

in under 10 seconds.

---

# Notifications And Reminders

Future work:

* Fluid reminders
* Medication reminders
* Calorie goal reminders
* Configurable reminder schedules

Reminders should remain informational and should not provide medical advice.

---

# Data Management

Future work:

* SQLite backup automation
* Backup restore workflow
* CSV export
* Date-range filtering
* Printable summaries
* Shareable reports

Protecting caregiving data is mandatory.

---

# UI Improvements

Continue improving:

* Mobile usability
* Dashboard clarity
* Timeline readability
* Form usability
* Caregiver workflow speed

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
* Medical diagnosis or treatment recommendations

These features should only be considered when they clearly improve caregiver usefulness.
