from datetime import datetime
from unittest import TestCase

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, schemas
from app.database import Base
from app.routes.bowls import update_bowl
from app.routes.food_entries import create_food_entry
from app.routes.foods import update_food


class ReferenceUpdateTest(TestCase):
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

    def test_update_food_does_not_recalculate_existing_food_entry(self):
        entry = create_food_entry(
            schemas.FoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=60,
            ),
            self.db,
        )
        original_entry_values = {
            "food_eaten_grams": entry.food_eaten_grams,
            "calories_eaten": entry.calories_eaten,
            "protein_consumed_grams": entry.protein_consumed_grams,
            "fat_consumed_grams": entry.fat_consumed_grams,
            "phosphorus_consumed_mg": entry.phosphorus_consumed_mg,
            "sodium_consumed_mg": entry.sodium_consumed_mg,
            "moisture_consumed_grams": entry.moisture_consumed_grams,
            "dry_matter_consumed_grams": entry.dry_matter_consumed_grams,
        }

        updated_food = update_food(
            self.food.id,
            schemas.FoodUpdate(
                can_size_grams=100,
                calories_per_can=300,
                moisture_percent=70,
                protein_as_fed_percent=12,
                fat_as_fed_percent=6,
                phosphorus_as_fed_percent=0.2,
                sodium_as_fed_percent=0.1,
            ),
            self.db,
        )
        self.db.refresh(entry)

        self.assertEqual(updated_food.calories_per_gram, 3)
        for field, value in original_entry_values.items():
            self.assertEqual(getattr(entry, field), value)

    def test_food_entries_created_after_food_update_use_new_definition(self):
        update_food(
            self.food.id,
            schemas.FoodUpdate(
                can_size_grams=100,
                calories_per_can=300,
                moisture_percent=70,
                protein_as_fed_percent=12,
                fat_as_fed_percent=6,
                phosphorus_as_fed_percent=0.2,
                sodium_as_fed_percent=0.1,
            ),
            self.db,
        )

        entry = create_food_entry(
            schemas.FoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=60,
            ),
            self.db,
        )

        self.assertEqual(entry.food_eaten_grams, 50)
        self.assertEqual(entry.calories_eaten, 150)
        self.assertEqual(entry.protein_consumed_grams, 6)
        self.assertEqual(entry.phosphorus_consumed_mg, 100)

    def test_food_response_includes_reference_library_fields(self):
        response = schemas.FoodResponse.model_validate(self.food)

        self.assertEqual(response.can_size_grams, 100)
        self.assertEqual(response.calories_per_can, 200)
        self.assertEqual(response.calories_per_gram, 2)
        self.assertEqual(response.moisture_percent, 80)
        self.assertEqual(response.protein_as_fed_percent, 10)
        self.assertEqual(response.fat_as_fed_percent, 5)
        self.assertEqual(response.phosphorus_as_fed_percent, 0.1)
        self.assertEqual(response.sodium_as_fed_percent, 0.05)
        self.assertEqual(response.protein_dry_matter_percent, 50)
        self.assertEqual(response.fat_dry_matter_percent, 25)
        self.assertEqual(response.phosphorus_dry_matter_percent, 0.5)
        self.assertEqual(response.sodium_dry_matter_percent, 0.25)

    def test_update_bowl_does_not_modify_existing_food_entry(self):
        entry = create_food_entry(
            schemas.FoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                bowl_id=self.bowl.id,
                food_id=self.food.id,
                starting_total_weight_grams=110,
                ending_total_weight_grams=60,
            ),
            self.db,
        )
        original_entry_values = {
            "starting_total_weight_grams": entry.starting_total_weight_grams,
            "ending_total_weight_grams": entry.ending_total_weight_grams,
            "starting_food_weight_grams": entry.starting_food_weight_grams,
            "leftover_food_weight_grams": entry.leftover_food_weight_grams,
            "food_eaten_grams": entry.food_eaten_grams,
            "calories_eaten": entry.calories_eaten,
        }

        updated_bowl = update_bowl(
            self.bowl.id,
            schemas.BowlUpdate(
                name="Updated Bowl",
                empty_weight_grams=20,
                color="Blue",
                notes="Corrected tare",
            ),
            self.db,
        )
        self.db.refresh(entry)

        self.assertEqual(updated_bowl.empty_weight_grams, 20)
        for field, value in original_entry_values.items():
            self.assertEqual(getattr(entry, field), value)
