from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/water-entries", tags=["Water Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.DrinkingWaterEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_water_entry(
    water_entry: schemas.DrinkingWaterEntryCreate,
    db: Session = Depends(get_db),
):
    db_water_entry = models.DrinkingWaterEntry(
        entry_time=entry_time_or_now(water_entry.entry_time),
        notes=water_entry.notes,
    )

    db.add(db_water_entry)
    db.commit()
    db.refresh(db_water_entry)

    return db_water_entry


@router.get("", response_model=list[schemas.DrinkingWaterEntryResponse])
def list_water_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.DrinkingWaterEntry)
        .order_by(
            models.DrinkingWaterEntry.entry_time.desc(),
            models.DrinkingWaterEntry.id.desc(),
        )
        .all()
    )


@router.delete("/{water_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_entry(water_entry_id: int, db: Session = Depends(get_db)):
    db_water_entry = (
        db.query(models.DrinkingWaterEntry)
        .filter(models.DrinkingWaterEntry.id == water_entry_id)
        .first()
    )

    if db_water_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water entry not found",
        )

    db.delete(db_water_entry)
    db.commit()
