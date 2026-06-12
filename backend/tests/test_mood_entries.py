from datetime import datetime
from unittest import TestCase

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schemas
from app.database import Base
from app.routes.mood_entries import (
    create_mood_entry,
    delete_mood_entry,
    list_mood_entries,
    update_mood_entry,
)


class MoodEntriesTest(TestCase):
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

    def test_mood_entry_crud_and_newest_first_listing_with_partial_ratings(self):
        older_entry = create_mood_entry(
            schemas.MoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 10, 0),
                mood_rating=4,
                energy_rating=2,
                notes="quiet morning",
            ),
            self.db,
        )
        newer_entry = create_mood_entry(
            schemas.MoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                yowling_rating=5,
            ),
            self.db,
        )

        entries = list_mood_entries(self.db)

        self.assertEqual([entry.id for entry in entries], [newer_entry.id, older_entry.id])
        self.assertEqual(older_entry.mood_rating, 4)
        self.assertIsNone(older_entry.appetite_rating)
        self.assertEqual(older_entry.energy_rating, 2)
        self.assertEqual(older_entry.notes, "quiet morning")

        updated_entry = update_mood_entry(
            older_entry.id,
            schemas.MoodEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                appetite_rating=3,
                social_rating=4,
                notes="edited note",
            ),
            self.db,
        )

        self.assertIsNone(updated_entry.mood_rating)
        self.assertEqual(updated_entry.appetite_rating, 3)
        self.assertEqual(updated_entry.social_rating, 4)
        self.assertEqual(updated_entry.notes, "edited note")

        delete_mood_entry(newer_entry.id, self.db)

        entries_after_delete = list_mood_entries(self.db)
        self.assertEqual([entry.id for entry in entries_after_delete], [older_entry.id])

    def test_mood_entry_allows_notes_only(self):
        entry = create_mood_entry(
            schemas.MoodEntryCreate(
                entry_time=datetime(2026, 6, 11, 10, 0),
                notes="hid under bed after visitors",
            ),
            self.db,
        )

        self.assertEqual(entry.notes, "hid under bed after visitors")
        self.assertIsNone(entry.mood_rating)

    def test_mood_entry_rejects_empty_entry(self):
        with self.assertRaises(ValidationError):
            schemas.MoodEntryCreate(notes="   ")

    def test_mood_entry_rejects_out_of_range_rating(self):
        with self.assertRaises(ValidationError):
            schemas.MoodEntryCreate(mood_rating=6)

    def test_update_missing_mood_entry_returns_404(self):
        with self.assertRaises(HTTPException) as context:
            update_mood_entry(
                9999,
                schemas.MoodEntryUpdate(
                    entry_time=datetime(2026, 6, 11, 13, 0),
                    mood_rating=4,
                ),
                self.db,
            )

        self.assertEqual(context.exception.status_code, 404)

    def test_delete_missing_mood_entry_returns_404(self):
        with self.assertRaises(HTTPException) as context:
            delete_mood_entry(9999, self.db)

        self.assertEqual(context.exception.status_code, 404)
