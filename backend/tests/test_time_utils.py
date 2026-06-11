from datetime import date, datetime, timezone
from unittest import TestCase

from app.time_utils import caregiver_day_bounds_for_utc_storage, caregiver_today


class CaregiverTimeUtilsTest(TestCase):
    def test_caregiver_today_uses_chicago_date_before_utc_midnight(self):
        now = datetime(2026, 6, 11, 3, 30, tzinfo=timezone.utc)

        self.assertEqual(caregiver_today(now), date(2026, 6, 10))

    def test_caregiver_day_bounds_match_utc_storage_during_dst(self):
        start, end = caregiver_day_bounds_for_utc_storage(date(2026, 6, 10))

        self.assertEqual(start, datetime(2026, 6, 10, 5, 0))
        self.assertEqual(end, datetime(2026, 6, 11, 5, 0))

    def test_caregiver_day_bounds_match_utc_storage_outside_dst(self):
        start, end = caregiver_day_bounds_for_utc_storage(date(2026, 1, 10))

        self.assertEqual(start, datetime(2026, 1, 10, 6, 0))
        self.assertEqual(end, datetime(2026, 1, 11, 6, 0))

    def test_yesterday_evening_is_outside_today_window(self):
        start, end = caregiver_day_bounds_for_utc_storage(date(2026, 6, 10))
        yesterday_evening = datetime(2026, 6, 10, 4, 59, 59)
        today_evening = datetime(2026, 6, 11, 4, 59, 59)

        self.assertFalse(start <= yesterday_evening < end)
        self.assertTrue(start <= today_evening < end)
