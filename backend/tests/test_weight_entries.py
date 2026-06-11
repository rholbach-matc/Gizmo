from datetime import datetime
from unittest import TestCase

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schemas
from app.database import Base
from app.routes.weight_entries import create_weight_entry, update_weight_entry


class WeightEntryWorkflowTest(TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=engine)
        session = sessionmaker(bind=engine)
        self.db = session()

    def tearDown(self):
        self.db.close()

    def test_update_weight_entry_persists_changes(self):
        entry = create_weight_entry(
            schemas.WeightEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                weight_lbs=8.25,
                notes="Before breakfast",
            ),
            self.db,
        )

        updated_entry = update_weight_entry(
            entry.id,
            schemas.WeightEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 30),
                weight_lbs=8.4,
                notes="Corrected scale",
            ),
            self.db,
        )

        self.assertEqual(updated_entry.entry_time, datetime(2026, 6, 11, 13, 30))
        self.assertEqual(updated_entry.weight_lbs, 8.4)
        self.assertEqual(updated_entry.notes, "Corrected scale")
