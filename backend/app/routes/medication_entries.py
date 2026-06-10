from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/medication-entries", tags=["Medication Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.MedicationEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medication_entry(
    medication_entry: schemas.MedicationEntryCreate,
    db: Session = Depends(get_db),
):
    db_medication_entry = models.MedicationEntry(
        entry_time=entry_time_or_now(medication_entry.entry_time),
        medication_name=medication_entry.medication_name,
        dose=medication_entry.dose,
        notes=medication_entry.notes,
    )

    db.add(db_medication_entry)
    db.commit()
    db.refresh(db_medication_entry)

    return db_medication_entry


@router.get("", response_model=list[schemas.MedicationEntryResponse])
def list_medication_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.MedicationEntry)
        .order_by(
            models.MedicationEntry.entry_time.desc(),
            models.MedicationEntry.id.desc(),
        )
        .all()
    )


@router.delete("/{medication_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication_entry(medication_entry_id: int, db: Session = Depends(get_db)):
    db_medication_entry = (
        db.query(models.MedicationEntry)
        .filter(models.MedicationEntry.id == medication_entry_id)
        .first()
    )

    if db_medication_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication entry not found",
        )

    db.delete(db_medication_entry)
    db.commit()
