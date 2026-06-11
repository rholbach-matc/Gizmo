from unittest import TestCase

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, schemas
from app.database import Base
from app.routes.food_entries import create_food_entry, finish_food_entry


class FoodEntryWorkflowTest(TestCase):
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

    def test_create_food_entry_can_start_open_feeding(self):
        entry = create_food_entry(
            schemas.FoodEntryCreate(
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
            ),
            self.db,
        )

        self.assertTrue(entry.is_open)
        self.assertEqual(entry.starting_food_weight_grams, 100)
        self.assertIsNone(entry.ending_total_weight_grams)
        self.assertIsNone(entry.food_eaten_grams)
        self.assertIsNone(entry.calories_eaten)

    def test_finish_food_entry_calculates_nutrition(self):
        entry = create_food_entry(
            schemas.FoodEntryCreate(
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
            ),
            self.db,
        )

        finished_entry = finish_food_entry(
            entry.id,
            schemas.FoodEntryFinish(ending_total_weight_grams=60),
            self.db,
        )

        self.assertFalse(finished_entry.is_open)
        self.assertEqual(finished_entry.leftover_food_weight_grams, 50)
        self.assertEqual(finished_entry.food_eaten_grams, 50)
        self.assertEqual(finished_entry.calories_eaten, 100)
        self.assertEqual(finished_entry.protein_consumed_grams, 5)
        self.assertEqual(finished_entry.fat_consumed_grams, 2.5)
        self.assertEqual(finished_entry.phosphorus_consumed_mg, 50)
        self.assertEqual(finished_entry.sodium_consumed_mg, 25)
        self.assertEqual(finished_entry.moisture_consumed_grams, 40)
        self.assertEqual(finished_entry.dry_matter_consumed_grams, 10)

    def test_create_food_entry_still_supports_completed_entry(self):
        entry = create_food_entry(
            schemas.FoodEntryCreate(
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=60,
            ),
            self.db,
        )

        self.assertFalse(entry.is_open)
        self.assertEqual(entry.food_eaten_grams, 50)
        self.assertEqual(entry.calories_eaten, 100)
