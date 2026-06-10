from datetime import datetime, timezone


def entry_time_or_now(entry_time: datetime | None):
    if entry_time is None:
        return datetime.utcnow()

    if entry_time.tzinfo is None:
        return entry_time

    return entry_time.astimezone(timezone.utc).replace(tzinfo=None)
