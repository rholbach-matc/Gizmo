from datetime import datetime
from unittest import TestCase

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schemas
from app.database import Base
from app.routes.vomit_entries import (
    create_vomit_entry,
    delete_vomit_entry,
    list_vomit_entries,
    update_vomit_entry,
)


class VomitEntriesTest(TestCase):
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

    def test_vomit_entry_crud_and_newest_first_listing(self):
        older_entry = create_vomit_entry(
            schemas.VomitEntryCreate(
                entry_time=datetime(2026, 6, 11, 10, 0),
                severity="mild",
                notes="small amount",
            ),
            self.db,
        )
        newer_entry = create_vomit_entry(
            schemas.VomitEntryCreate(
                entry_time=datetime(2026, 6, 11, 12, 0),
                severity="severe",
            ),
            self.db,
        )

        entries = list_vomit_entries(self.db)

        self.assertEqual([entry.id for entry in entries], [newer_entry.id, older_entry.id])
        self.assertEqual(older_entry.severity, "mild")
        self.assertEqual(older_entry.notes, "small amount")

        updated_entry = update_vomit_entry(
            older_entry.id,
            schemas.VomitEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                severity="moderate",
                notes="edited note",
            ),
            self.db,
        )

        self.assertEqual(updated_entry.severity, "moderate")
        self.assertEqual(updated_entry.notes, "edited note")

        delete_vomit_entry(newer_entry.id, self.db)

        entries_after_delete = list_vomit_entries(self.db)
        self.assertEqual([entry.id for entry in entries_after_delete], [older_entry.id])

    def test_update_missing_vomit_entry_returns_404(self):
        with self.assertRaises(HTTPException) as context:
            update_vomit_entry(
                9999,
                schemas.VomitEntryUpdate(
                    entry_time=datetime(2026, 6, 11, 13, 0),
                    severity="moderate",
                ),
                self.db,
            )

        self.assertEqual(context.exception.status_code, 404)

    def test_delete_missing_vomit_entry_returns_404(self):
        with self.assertRaises(HTTPException) as context:
            delete_vomit_entry(9999, self.db)

        self.assertEqual(context.exception.status_code, 404)
