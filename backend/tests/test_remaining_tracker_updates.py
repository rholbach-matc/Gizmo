from datetime import date, datetime
from unittest import TestCase
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models, schemas
from app.database import Base
from app.routes.bm_entries import update_bm_entry
from app.routes.dashboard import get_today_dashboard
from app.routes.episode_entries import update_episode_entry
from app.routes.fluid_entries import update_fluid_entry
from app.routes.medication_entries import update_medication_entry
from app.routes.vet_visit_entries import update_vet_visit_entry
from app.routes.water_entries import update_water_entry


class RemainingTrackerUpdateTest(TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=engine)
        session = sessionmaker(bind=engine)
        self.db = session()

        self.bowl = models.Bowl(name="Kitchen Bowl", empty_weight_grams=10)
        self.other_bowl = models.Bowl(name="Bedroom Bowl", empty_weight_grams=12)
        self.medication = models.Medication(name="Cerenia")
        self.other_medication = models.Medication(name="Gabapentin")
        self.db.add_all(
            [self.bowl, self.other_bowl, self.medication, self.other_medication]
        )
        self.db.commit()
        for model in [
            self.bowl,
            self.other_bowl,
            self.medication,
            self.other_medication,
        ]:
            self.db.refresh(model)

    def tearDown(self):
        self.db.close()

    def test_updates_remaining_simple_trackers(self):
        bm_entry = models.BMEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            occurred=False,
        )
        fluid_entry = models.FluidEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            amount_ml=50,
        )
        episode_entry = models.EpisodeEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            severity="Mild",
        )
        vet_visit_entry = models.VetVisitEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            reason="Checkup",
            follow_up_needed=False,
        )
        self.db.add_all([bm_entry, fluid_entry, episode_entry, vet_visit_entry])
        self.db.commit()

        updated_bm = update_bm_entry(
            bm_entry.id,
            schemas.BMEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                occurred=True,
                notes="edited bm",
            ),
            self.db,
        )
        updated_fluid = update_fluid_entry(
            fluid_entry.id,
            schemas.FluidEntryUpdate(
                entry_time=datetime(2026, 6, 11, 14, 0),
                amount_ml=80,
                notes="edited fluids",
            ),
            self.db,
        )
        updated_episode = update_episode_entry(
            episode_entry.id,
            schemas.EpisodeEntryUpdate(
                entry_time=datetime(2026, 6, 11, 15, 0),
                severity="Severe",
                notes="edited episode",
            ),
            self.db,
        )
        updated_vet_visit = update_vet_visit_entry(
            vet_visit_entry.id,
            schemas.VetVisitEntryUpdate(
                entry_time=datetime(2026, 6, 11, 16, 0),
                reason="Kidney panel",
                summary="Stable labs",
                follow_up_needed=True,
                notes="edited vet",
            ),
            self.db,
        )

        self.assertTrue(updated_bm.occurred)
        self.assertEqual(updated_bm.notes, "edited bm")
        self.assertEqual(updated_fluid.amount_ml, 80)
        self.assertEqual(updated_fluid.notes, "edited fluids")
        self.assertEqual(updated_episode.severity, "Severe")
        self.assertEqual(updated_episode.notes, "edited episode")
        self.assertEqual(updated_vet_visit.reason, "Kidney panel")
        self.assertEqual(updated_vet_visit.summary, "Stable labs")
        self.assertTrue(updated_vet_visit.follow_up_needed)

    def test_medication_update_uses_existing_reference(self):
        medication_entry = models.MedicationEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            medication_id=self.medication.id,
            medication_name=self.medication.name,
            dose="1 tablet",
        )
        self.db.add(medication_entry)
        self.db.commit()

        updated_entry = update_medication_entry(
            medication_entry.id,
            schemas.MedicationEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                medication_id=self.other_medication.id,
                dose="0.5 ml",
                notes="edited medication",
            ),
            self.db,
        )

        self.assertEqual(updated_entry.medication_id, self.other_medication.id)
        self.assertEqual(updated_entry.medication_name, self.other_medication.name)
        self.assertEqual(updated_entry.dose, "0.5 ml")

        with self.assertRaises(HTTPException) as context:
            update_medication_entry(
                medication_entry.id,
                schemas.MedicationEntryUpdate(
                    entry_time=datetime(2026, 6, 11, 14, 0),
                    medication_id=9999,
                ),
                self.db,
            )

        self.assertEqual(context.exception.status_code, 404)
        self.db.refresh(medication_entry)
        self.assertEqual(medication_entry.medication_id, self.other_medication.id)

    def test_water_update_uses_observation_type_and_bowl_reference(self):
        water_entry = models.DrinkingWaterEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            observation_type="drank_water",
            bowl_id=self.bowl.id,
        )
        self.db.add(water_entry)
        self.db.commit()

        updated_entry = update_water_entry(
            water_entry.id,
            schemas.DrinkingWaterEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                observation_type="refused_water",
                bowl_id=self.other_bowl.id,
                notes="edited water",
            ),
            self.db,
        )

        self.assertEqual(updated_entry.observation_type, "refused_water")
        self.assertEqual(updated_entry.bowl_id, self.other_bowl.id)

        with self.assertRaises(HTTPException) as context:
            update_water_entry(
                water_entry.id,
                schemas.DrinkingWaterEntryUpdate(
                    entry_time=datetime(2026, 6, 11, 14, 0),
                    observation_type="visited_bowl",
                    bowl_id=9999,
                ),
                self.db,
            )

        self.assertEqual(context.exception.status_code, 404)
        self.db.refresh(water_entry)
        self.assertEqual(water_entry.bowl_id, self.other_bowl.id)

    def test_dashboard_reflects_updated_remaining_tracker_values(self):
        bm_entry = models.BMEntry(
            entry_time=datetime(2026, 6, 11, 10, 0),
            occurred=False,
        )
        fluid_entry = models.FluidEntry(
            entry_time=datetime(2026, 6, 11, 10, 30),
            amount_ml=50,
        )
        episode_entry = models.EpisodeEntry(
            entry_time=datetime(2026, 6, 11, 11, 0),
            severity="Mild",
        )
        medication_entry = models.MedicationEntry(
            entry_time=datetime(2026, 6, 11, 11, 30),
            medication_id=self.medication.id,
            medication_name=self.medication.name,
        )
        vet_visit_entry = models.VetVisitEntry(
            entry_time=datetime(2026, 6, 11, 12, 0),
            reason="Checkup",
        )
        water_entry = models.DrinkingWaterEntry(
            entry_time=datetime(2026, 6, 11, 12, 30),
            observation_type="drank_water",
            bowl_id=self.bowl.id,
        )
        self.db.add_all(
            [
                bm_entry,
                fluid_entry,
                episode_entry,
                medication_entry,
                vet_visit_entry,
                water_entry,
            ]
        )
        self.db.commit()

        update_bm_entry(
            bm_entry.id,
            schemas.BMEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 0),
                occurred=True,
            ),
            self.db,
        )
        update_fluid_entry(
            fluid_entry.id,
            schemas.FluidEntryUpdate(
                entry_time=datetime(2026, 6, 11, 13, 30),
                amount_ml=90,
            ),
            self.db,
        )
        update_episode_entry(
            episode_entry.id,
            schemas.EpisodeEntryUpdate(
                entry_time=datetime(2026, 6, 11, 14, 0),
                severity="Moderate",
            ),
            self.db,
        )
        update_medication_entry(
            medication_entry.id,
            schemas.MedicationEntryUpdate(
                entry_time=datetime(2026, 6, 11, 14, 30),
                medication_id=self.other_medication.id,
                dose="0.5 ml",
            ),
            self.db,
        )
        update_vet_visit_entry(
            vet_visit_entry.id,
            schemas.VetVisitEntryUpdate(
                entry_time=datetime(2026, 6, 11, 15, 0),
                reason="Kidney panel",
                summary="Stable labs",
                follow_up_needed=True,
            ),
            self.db,
        )
        update_water_entry(
            water_entry.id,
            schemas.DrinkingWaterEntryUpdate(
                entry_time=datetime(2026, 6, 11, 15, 30),
                observation_type="visited_bowl",
                bowl_id=self.other_bowl.id,
            ),
            self.db,
        )

        with patch("app.routes.dashboard.caregiver_today", return_value=date(2026, 6, 11)):
            dashboard = get_today_dashboard(self.db)

        self.assertEqual(dashboard.today_bm_count, 1)
        self.assertEqual(dashboard.last_bm_entry.id, bm_entry.id)
        self.assertEqual(dashboard.last_fluid_entry.amount_ml, 90)
        self.assertEqual(
            dashboard.latest_medication_entry.medication_id,
            self.other_medication.id,
        )
        self.assertEqual(
            dashboard.latest_medication_entry.medication_name,
            self.other_medication.name,
        )

        summaries = [item.summary for item in dashboard.recent_activity]
        self.assertIn("BM occurred", summaries)
        self.assertIn("90.0 ml", summaries)
        self.assertIn("Moderate", summaries)
        self.assertIn(self.other_medication.name, summaries)
        self.assertIn("Kidney panel", summaries)
        self.assertIn("Visited bowl", summaries)
