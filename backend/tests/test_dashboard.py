from datetime import date, datetime
from unittest import TestCase
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, schemas
from app.database import Base
from app.routes.dashboard import get_day_dashboard, get_today_dashboard
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

        self.medication = models.Medication(name="Test Medication")
        self.db.add(self.medication)
        self.db.commit()
        self.db.refresh(self.medication)

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

    def test_day_dashboard_returns_summary_and_chronological_activity(self):
        self.add_food_entry(datetime(2026, 6, 10, 23, 30), 90, 65)
        self.add_food_entry(datetime(2026, 6, 11, 6, 30), 110, 55)
        self.db.add_all(
            [
                models.BMEntry(
                    entry_time=datetime(2026, 6, 11, 7, 0),
                    occurred=True,
                ),
                models.FluidEntry(
                    entry_time=datetime(2026, 6, 11, 8, 0),
                    amount_ml=90,
                ),
                models.WeightEntry(
                    entry_time=datetime(2026, 6, 11, 9, 0),
                    weight_lbs=9.1,
                ),
                models.WeightEntry(
                    entry_time=datetime(2026, 6, 11, 15, 0),
                    weight_lbs=9.3,
                ),
                models.DrinkingWaterEntry(
                    entry_time=datetime(2026, 6, 11, 10, 0),
                    observation_type="drank_water",
                    bowl_id=self.bowl.id,
                ),
                models.EpisodeEntry(
                    entry_time=datetime(2026, 6, 11, 11, 0),
                    severity="mild",
                ),
                models.VomitEntry(
                    entry_time=datetime(2026, 6, 11, 11, 30),
                    severity="moderate",
                    notes="after breakfast",
                ),
                models.MoodEntry(
                    entry_time=datetime(2026, 6, 11, 11, 45),
                    mood_rating=4,
                    energy_rating=2,
                    yowling_rating=5,
                ),
                models.MedicationEntry(
                    entry_time=datetime(2026, 6, 11, 12, 0),
                    medication_id=self.medication.id,
                    medication_name=self.medication.name,
                    dose="1 tablet",
                ),
                models.VetVisitEntry(
                    entry_time=datetime(2026, 6, 11, 13, 0),
                    reason="Checkup",
                ),
                models.BMEntry(
                    entry_time=datetime(2026, 6, 12, 7, 0),
                    occurred=True,
                ),
            ]
        )
        self.db.commit()

        dashboard = get_day_dashboard(date(2026, 6, 11), self.db)

        self.assertEqual(dashboard.calories_eaten, 110)
        self.assertEqual(dashboard.feedings_count, 1)
        self.assertEqual(dashboard.bm_count, 1)
        self.assertEqual(dashboard.water_observation_count, 1)
        self.assertEqual(dashboard.episode_count, 1)
        self.assertEqual(dashboard.medication_count, 1)
        self.assertTrue(dashboard.fluids_given)
        self.assertEqual(dashboard.latest_weight_entry.weight_lbs, 9.3)
        self.assertEqual(
            [item.type for item in dashboard.activity],
            [
                "food",
                "bm",
                "fluids",
                "weight",
                "water",
                "episode",
                "vomit",
                "mood",
                "medication",
                "vet_visit",
                "weight",
            ],
        )
        self.assertEqual(
            [item.entry_time for item in dashboard.activity],
            sorted(item.entry_time for item in dashboard.activity),
        )

    def test_day_dashboard_attributes_midnight_spanning_food_to_start_date(self):
        self.db.add(
            models.FoodEntry(
                entry_time=datetime(2026, 6, 11, 23, 30),
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=60,
                starting_food_weight_grams=100,
                leftover_food_weight_grams=50,
                food_eaten_grams=50,
                calories_eaten=100,
                protein_consumed_grams=5,
                fat_consumed_grams=2.5,
                phosphorus_consumed_mg=50,
                sodium_consumed_mg=25,
                moisture_consumed_grams=40,
                dry_matter_consumed_grams=10,
                created_at=datetime(2026, 6, 12, 1, 0),
            )
        )
        self.db.commit()

        start_day_dashboard = get_day_dashboard(date(2026, 6, 11), self.db)
        finish_day_dashboard = get_day_dashboard(date(2026, 6, 12), self.db)

        self.assertEqual(start_day_dashboard.feedings_count, 1)
        self.assertEqual(start_day_dashboard.calories_eaten, 100)
        self.assertEqual([item.type for item in start_day_dashboard.activity], ["food"])
        self.assertEqual(finish_day_dashboard.feedings_count, 0)
        self.assertEqual(finish_day_dashboard.activity, [])

    def test_today_dashboard_includes_vomit_in_recent_activity_without_overview_count(self):
        self.db.add(
            models.VomitEntry(
                entry_time=datetime(2026, 6, 11, 18, 0),
                severity="severe",
                notes="evening event",
            )
        )
        self.db.commit()

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            dashboard = get_today_dashboard(self.db)

        vomit_items = [
            item for item in dashboard.recent_activity if item.type == "vomit"
        ]
        self.assertEqual(len(vomit_items), 1)
        self.assertEqual(vomit_items[0].summary, "severe")
        self.assertEqual(vomit_items[0].details, "evening event")
        self.assertFalse(hasattr(dashboard, "today_vomit_count"))

    def test_dashboard_includes_mood_in_activity_with_entered_ratings_only(self):
        self.db.add(
            models.MoodEntry(
                entry_time=datetime(2026, 6, 11, 18, 0),
                mood_rating=4,
                energy_rating=2,
                yowling_rating=5,
            )
        )
        self.db.commit()

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            today_dashboard = get_today_dashboard(self.db)
        day_dashboard = get_day_dashboard(date(2026, 6, 11), self.db)

        mood_items = [
            item for item in today_dashboard.recent_activity if item.type == "mood"
        ]
        self.assertEqual(len(mood_items), 1)
        self.assertEqual(mood_items[0].title, "Mood Check-In")
        self.assertEqual(mood_items[0].summary, "Mood: 4")
        self.assertEqual(mood_items[0].details, "Energy: 2\nYowling: 5")
        self.assertNotIn("Appetite", mood_items[0].details)
        self.assertEqual([item.type for item in day_dashboard.activity], ["mood"])
