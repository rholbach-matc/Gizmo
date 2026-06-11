from datetime import datetime
from unittest import TestCase

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.routes.bowls import delete_bowl


class BowlDeleteSafetyTest(TestCase):
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

    def test_delete_bowl_is_blocked_when_used_by_open_feeding(self):
        open_entry = models.FoodEntry(
            entry_time=datetime(2026, 6, 11, 12, 0, 0),
            bowl_id=self.bowl.id,
            food_id=self.food.id,
            starting_total_weight_grams=110,
            starting_food_weight_grams=100,
        )
        self.db.add(open_entry)
        self.db.commit()

        with self.assertRaises(HTTPException) as context:
            delete_bowl(self.bowl.id, self.db)

        self.assertEqual(context.exception.status_code, 409)
        self.assertEqual(
            context.exception.detail,
            "This bowl is currently being used by an open feeding. "
            "Finish or delete that feeding first.",
        )
        self.assertIsNotNone(
            self.db.query(models.Bowl).filter(models.Bowl.id == self.bowl.id).first()
        )

    def test_delete_bowl_allows_unused_bowl(self):
        delete_bowl(self.bowl.id, self.db)

        self.assertIsNone(
            self.db.query(models.Bowl).filter(models.Bowl.id == self.bowl.id).first()
        )
