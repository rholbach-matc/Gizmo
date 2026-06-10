from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/bm-entries", tags=["BM Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.BMEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bm_entry(
    bm_entry: schemas.BMEntryCreate,
    db: Session = Depends(get_db),
):
    db_bm_entry = models.BMEntry(
        entry_time=entry_time_or_now(bm_entry.entry_time),
        occurred=bm_entry.occurred,
        notes=bm_entry.notes,
    )

    db.add(db_bm_entry)
    db.commit()
    db.refresh(db_bm_entry)

    return db_bm_entry


@router.get("", response_model=list[schemas.BMEntryResponse])
def list_bm_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.BMEntry)
        .order_by(models.BMEntry.entry_time.desc(), models.BMEntry.id.desc())
        .all()
    )


@router.delete("/{bm_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bm_entry(bm_entry_id: int, db: Session = Depends(get_db)):
    db_bm_entry = (
        db.query(models.BMEntry)
        .filter(models.BMEntry.id == bm_entry_id)
        .first()
    )

    if db_bm_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BM entry not found",
        )

    db.delete(db_bm_entry)
    db.commit()
