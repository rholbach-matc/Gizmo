from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/vomit-entries", tags=["Vomit Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.VomitEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vomit_entry(
    vomit_entry: schemas.VomitEntryCreate,
    db: Session = Depends(get_db),
):
    db_vomit_entry = models.VomitEntry(
        entry_time=entry_time_or_now(vomit_entry.entry_time),
        severity=vomit_entry.severity,
        notes=vomit_entry.notes,
    )

    db.add(db_vomit_entry)
    db.commit()
    db.refresh(db_vomit_entry)

    return db_vomit_entry


@router.get("", response_model=list[schemas.VomitEntryResponse])
def list_vomit_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.VomitEntry)
        .order_by(models.VomitEntry.entry_time.desc(), models.VomitEntry.id.desc())
        .all()
    )


@router.patch("/{vomit_entry_id}", response_model=schemas.VomitEntryResponse)
def update_vomit_entry(
    vomit_entry_id: int,
    vomit_entry_update: schemas.VomitEntryUpdate,
    db: Session = Depends(get_db),
):
    db_vomit_entry = (
        db.query(models.VomitEntry)
        .filter(models.VomitEntry.id == vomit_entry_id)
        .first()
    )

    if db_vomit_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vomit entry not found",
        )

    db_vomit_entry.entry_time = entry_time_or_now(vomit_entry_update.entry_time)
    db_vomit_entry.severity = vomit_entry_update.severity
    db_vomit_entry.notes = vomit_entry_update.notes

    db.commit()
    db.refresh(db_vomit_entry)

    return db_vomit_entry


@router.delete("/{vomit_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vomit_entry(vomit_entry_id: int, db: Session = Depends(get_db)):
    db_vomit_entry = (
        db.query(models.VomitEntry)
        .filter(models.VomitEntry.id == vomit_entry_id)
        .first()
    )

    if db_vomit_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vomit entry not found",
        )

    db.delete(db_vomit_entry)
    db.commit()
