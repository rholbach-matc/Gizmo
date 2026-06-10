from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/fluid-entries", tags=["Fluid Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.FluidEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_fluid_entry(
    fluid_entry: schemas.FluidEntryCreate,
    db: Session = Depends(get_db),
):
    db_fluid_entry = models.FluidEntry(
        entry_time=entry_time_or_now(fluid_entry.entry_time),
        amount_ml=fluid_entry.amount_ml,
        notes=fluid_entry.notes,
    )

    db.add(db_fluid_entry)
    db.commit()
    db.refresh(db_fluid_entry)

    return db_fluid_entry


@router.get("", response_model=list[schemas.FluidEntryResponse])
def list_fluid_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.FluidEntry)
        .order_by(models.FluidEntry.entry_time.desc(), models.FluidEntry.id.desc())
        .all()
    )


@router.delete("/{fluid_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fluid_entry(fluid_entry_id: int, db: Session = Depends(get_db)):
    db_fluid_entry = (
        db.query(models.FluidEntry)
        .filter(models.FluidEntry.id == fluid_entry_id)
        .first()
    )

    if db_fluid_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fluid entry not found",
        )

    db.delete(db_fluid_entry)
    db.commit()
