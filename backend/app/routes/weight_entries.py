from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/weight-entries", tags=["Weight Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.WeightEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_weight_entry(
    weight_entry: schemas.WeightEntryCreate,
    db: Session = Depends(get_db),
):
    db_weight_entry = models.WeightEntry(
        entry_time=datetime.utcnow(),
        weight_lbs=weight_entry.weight_lbs,
        notes=weight_entry.notes,
    )

    db.add(db_weight_entry)
    db.commit()
    db.refresh(db_weight_entry)

    return db_weight_entry


@router.get("", response_model=list[schemas.WeightEntryResponse])
def list_weight_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.WeightEntry)
        .order_by(models.WeightEntry.entry_time.desc(), models.WeightEntry.id.desc())
        .all()
    )


@router.delete("/{weight_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight_entry(weight_entry_id: int, db: Session = Depends(get_db)):
    db_weight_entry = (
        db.query(models.WeightEntry)
        .filter(models.WeightEntry.id == weight_entry_id)
        .first()
    )

    if db_weight_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weight entry not found",
        )

    db.delete(db_weight_entry)
    db.commit()
