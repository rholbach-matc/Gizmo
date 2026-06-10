from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/vet-visit-entries", tags=["Vet Visit Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.VetVisitEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vet_visit_entry(
    vet_visit_entry: schemas.VetVisitEntryCreate,
    db: Session = Depends(get_db),
):
    db_vet_visit_entry = models.VetVisitEntry(
        entry_time=entry_time_or_now(vet_visit_entry.entry_time),
        reason=vet_visit_entry.reason,
        summary=vet_visit_entry.summary,
        follow_up_needed=vet_visit_entry.follow_up_needed,
        notes=vet_visit_entry.notes,
    )

    db.add(db_vet_visit_entry)
    db.commit()
    db.refresh(db_vet_visit_entry)

    return db_vet_visit_entry


@router.get("", response_model=list[schemas.VetVisitEntryResponse])
def list_vet_visit_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.VetVisitEntry)
        .order_by(
            models.VetVisitEntry.entry_time.desc(),
            models.VetVisitEntry.id.desc(),
        )
        .all()
    )


@router.delete("/{vet_visit_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vet_visit_entry(vet_visit_entry_id: int, db: Session = Depends(get_db)):
    db_vet_visit_entry = (
        db.query(models.VetVisitEntry)
        .filter(models.VetVisitEntry.id == vet_visit_entry_id)
        .first()
    )

    if db_vet_visit_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vet visit entry not found",
        )

    db.delete(db_vet_visit_entry)
    db.commit()
