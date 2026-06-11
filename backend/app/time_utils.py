from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


CAREGIVER_TIMEZONE = ZoneInfo("America/Chicago")


def entry_time_or_now(entry_time: datetime | None):
    if entry_time is None:
        return datetime.utcnow()

    if entry_time.tzinfo is None:
        return entry_time

    return entry_time.astimezone(timezone.utc).replace(tzinfo=None)


def caregiver_today(now: datetime | None = None) -> date:
    if now is None:
        now = datetime.now(timezone.utc)

    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    return now.astimezone(CAREGIVER_TIMEZONE).date()


def caregiver_day_bounds_for_utc_storage(day: date) -> tuple[datetime, datetime]:
    start_of_day = datetime.combine(day, time.min, tzinfo=CAREGIVER_TIMEZONE)
    start_of_next_day = start_of_day + timedelta(days=1)

    return (
        start_of_day.astimezone(timezone.utc).replace(tzinfo=None),
        start_of_next_day.astimezone(timezone.utc).replace(tzinfo=None),
    )
