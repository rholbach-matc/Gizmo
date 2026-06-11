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


def get_medication(db: Session, medication_id: int):
    db_medication = (
        db.query(models.Medication)
        .filter(models.Medication.id == medication_id)
        .first()
    )
    if db_medication is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found",
        )

    return db_medication


@router.post(
    "/medications",
    response_model=schemas.MedicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medication(
    medication: schemas.MedicationCreate,
    db: Session = Depends(get_db),
):
    db_medication = models.Medication(
        name=medication.name,
        notes=medication.notes,
    )

    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)

    return db_medication


@router.get("/medications", response_model=list[schemas.MedicationResponse])
def list_medications(db: Session = Depends(get_db)):
    return db.query(models.Medication).order_by(models.Medication.name).all()


@router.post(
    "",
    response_model=schemas.MedicationEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medication_entry(
    medication_entry: schemas.MedicationEntryCreate,
    db: Session = Depends(get_db),
):
    db_medication = get_medication(db, medication_entry.medication_id)

    db_medication_entry = models.MedicationEntry(
        entry_time=entry_time_or_now(medication_entry.entry_time),
        medication_id=db_medication.id,
        medication_name=db_medication.name,
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


@router.patch("/{medication_entry_id}", response_model=schemas.MedicationEntryResponse)
def update_medication_entry(
    medication_entry_id: int,
    medication_entry_update: schemas.MedicationEntryUpdate,
    db: Session = Depends(get_db),
):
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

    db_medication = get_medication(db, medication_entry_update.medication_id)

    db_medication_entry.entry_time = entry_time_or_now(
        medication_entry_update.entry_time
    )
    db_medication_entry.medication_id = db_medication.id
    db_medication_entry.medication_name = db_medication.name
    db_medication_entry.dose = medication_entry_update.dose
    db_medication_entry.notes = medication_entry_update.notes

    db.commit()
    db.refresh(db_medication_entry)

    return db_medication_entry


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
