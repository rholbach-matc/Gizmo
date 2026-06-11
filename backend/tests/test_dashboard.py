from datetime import date, datetime
from unittest import TestCase
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, schemas
from app.database import Base
from app.routes.dashboard import get_today_dashboard
from app.routes.food_entries import update_food_entry


class DashboardTotalsTest(TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=engine)
        session = sessionmaker(bind=engine)
        self.db = session()

        self.bowl = models.Bowl(name="Test Bowl", empty_weight_grams=10)
        self.food = models.Food(
            name="Test Food",
            can_size_grams=100,
            calories_per_can=200,
            calories_per_gram=2,
            moisture_percent=80,
            dry_matter_percent=20,
            protein_as_fed_percent=10,
            protein_dry_matter_percent=50,
            fat_as_fed_percent=5,
            fat_dry_matter_percent=25,
            phosphorus_as_fed_percent=0.1,
            phosphorus_dry_matter_percent=0.5,
            sodium_as_fed_percent=0.05,
            sodium_dry_matter_percent=0.25,
        )
        self.db.add_all([self.bowl, self.food])
        self.db.commit()
        self.db.refresh(self.bowl)
        self.db.refresh(self.food)

    def tearDown(self):
        self.db.close()

    def add_food_entry(
        self,
        entry_time: datetime,
        calories_eaten: float | None,
        ending_total_weight_grams: float | None,
    ):
        is_completed = ending_total_weight_grams is not None
        self.db.add(
            models.FoodEntry(
                entry_time=entry_time,
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=ending_total_weight_grams,
                starting_food_weight_grams=100,
                leftover_food_weight_grams=50 if is_completed else None,
                food_eaten_grams=50 if is_completed else None,
                calories_eaten=calories_eaten,
                protein_consumed_grams=5 if is_completed else None,
                fat_consumed_grams=2.5 if is_completed else None,
                phosphorus_consumed_mg=50 if is_completed else None,
                sodium_consumed_mg=25 if is_completed else None,
                moisture_consumed_grams=40 if is_completed else None,
                dry_matter_consumed_grams=10 if is_completed else None,
            )
        )
        self.db.commit()

    def test_dashboard_counts_open_and_completed_feedings_separately(self):
        self.add_food_entry(datetime(2026, 6, 11, 14, 0), 100, 60)
        self.add_food_entry(datetime(2026, 6, 11, 15, 0), None, None)
        self.add_food_entry(datetime(2026, 6, 10, 14, 0), 80, 70)

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            dashboard = get_today_dashboard(self.db)

        self.assertEqual(dashboard.feedings_count, 1)
        self.assertEqual(dashboard.open_feedings_count, 1)
        self.assertEqual(dashboard.calories_eaten, 100)
        self.assertEqual(dashboard.yesterday_calories_eaten, 80)

    def test_dashboard_omits_yesterday_calories_when_no_completed_feedings(self):
        self.add_food_entry(datetime(2026, 6, 10, 14, 0), None, None)

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            dashboard = get_today_dashboard(self.db)

        self.assertIsNone(dashboard.yesterday_calories_eaten)

    def test_dashboard_totals_use_updated_completed_feedings_only(self):
        self.add_food_entry(datetime(2026, 6, 11, 14, 0), 100, 60)
        self.add_food_entry(datetime(2026, 6, 11, 15, 0), None, None)
        completed_entry = (
            self.db.query(models.FoodEntry)
            .filter(models.FoodEntry.ending_total_weight_grams.is_not(None))
            .one()
        )

        update_food_entry(
            completed_entry.id,
            schemas.FoodEntryUpdate(
                entry_time=datetime(2026, 6, 11, 14, 0),
                starting_total_weight_grams=130,
                ending_total_weight_grams=70,
            ),
            self.db,
        )

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            dashboard = get_today_dashboard(self.db)

        self.assertEqual(dashboard.feedings_count, 1)
        self.assertEqual(dashboard.open_feedings_count, 1)
        self.assertEqual(dashboard.calories_eaten, 120)
