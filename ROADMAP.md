# Gizmo Roadmap

This roadmap captures near-term usability needs and longer-term caregiving ideas for Gizmo. The focus remains helping Jackie quickly record and review Gizmo's daily care.

## Immediate Usability Fixes

- Add edit support for existing entries so mistakes can be corrected without deleting and recreating records.
- Make date/time entry easy and consistent across all trackers.
- Keep tracker lists sorted newest first and make older entries easy to find.
- Improve food entry speed for repeated meals and common bowls.
- Add clearer empty states and success feedback after saving entries.
- Review mobile layouts after more real phone use, especially dense dashboard and navigation areas.

## Care Tracking Ideas

- Add a daily calorie target with a 190 calorie minimum goal.
- Track Sub-Q fluids with care guidance context: every 3-4 days, typically 50-75 mL.
- Improve shaking/wobbly episode tracking for events that happen many times per day, possibly with quick count buttons or grouped daily summaries.
- Keep medication and supplement logging flexible because medications/supplements vary over time.
- Add outdoor leash time tracking, including date/time, duration, notes, and whether Gizmo seemed comfortable.
- Add yowling/vocalization tracking with optional time, frequency, intensity, and notes.
- Add quick-entry flows for high-frequency observations like drinking water and episodes.
- Consider appetite/interest notes separate from measured food intake.
- Consider stool quality details for BM entries, while keeping the basic BM workflow fast.

## Dashboard And Analytics Ideas

- Continue making the dashboard the central caregiving overview.
- Add trends/charts/analytics for calories, weight, fluids, water observations, BMs, medications, and episodes.
- Show whether Gizmo is on pace for the 190 calorie minimum goal today.
- Add simple weekly summaries for food intake, fluids, weight, and episode frequency.
- Add "last done" status for fluids, medications, vet visits, and leash time.
- Add lightweight risk/status indicators without medical diagnosis or advice.
- Add filters to the unified care timeline by event type.
- Add daily timeline grouping so high-frequency events do not overwhelm the dashboard.

## Notifications/Reminders

- Add optional notifications for fluids every 3-4 days.
- Add optional medication reminders only after medication logging is stable.
- Add reminders when calories are below the 190 calorie minimum goal late in the day.
- Add configurable reminder settings rather than hard-coding care schedules.
- Keep reminders informational and avoid medical advice.

## Data Management

- Add export for care history, likely CSV first.
- Add backup and restore flow for the SQLite database.
- Add food table/search/filter views for managing foods as the food list grows.
- Add filters for tracker pages by date range and event type.
- Add printable or shareable summaries for vet visits.
- Avoid committing SQLite database files.

## UI Improvements

- Improve dashboard polish while keeping the interface quiet, warm, and caregiver-focused.
- Make common actions reachable quickly on phone.
- Add compact table/search/filter views for foods.
- Improve timeline badges and event grouping as data volume grows.
- Keep plain CSS and avoid adding UI libraries unless there is a clear need.
- Make forms more forgiving with better validation messages.

## Deferred/Complex Ideas

- Medication schedules, inventory, and refill tracking.
- Advanced charts and correlations between symptoms, foods, medications, and fluids.
- Authentication and multi-user support.
- Multi-pet support.
- Cloud sync or hosted deployment.
- Push notifications across devices.
- Automated imports from vet records or lab reports.
- Medical interpretation, diagnosis, or treatment recommendations.
