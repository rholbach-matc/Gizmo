from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/mood-entries", tags=["Mood Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.MoodEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mood_entry(
    mood_entry: schemas.MoodEntryCreate,
    db: Session = Depends(get_db),
):
    db_mood_entry = models.MoodEntry(
        entry_time=entry_time_or_now(mood_entry.entry_time),
        mood_rating=mood_entry.mood_rating,
        appetite_rating=mood_entry.appetite_rating,
        energy_rating=mood_entry.energy_rating,
        social_rating=mood_entry.social_rating,
        yowling_rating=mood_entry.yowling_rating,
        notes=mood_entry.notes,
    )

    db.add(db_mood_entry)
    db.commit()
    db.refresh(db_mood_entry)

    return db_mood_entry


@router.get("", response_model=list[schemas.MoodEntryResponse])
def list_mood_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.MoodEntry)
        .order_by(models.MoodEntry.entry_time.desc(), models.MoodEntry.id.desc())
        .all()
    )


@router.patch("/{mood_entry_id}", response_model=schemas.MoodEntryResponse)
def update_mood_entry(
    mood_entry_id: int,
    mood_entry_update: schemas.MoodEntryUpdate,
    db: Session = Depends(get_db),
):
    db_mood_entry = (
        db.query(models.MoodEntry)
        .filter(models.MoodEntry.id == mood_entry_id)
        .first()
    )

    if db_mood_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found",
        )

    db_mood_entry.entry_time = entry_time_or_now(mood_entry_update.entry_time)
    db_mood_entry.mood_rating = mood_entry_update.mood_rating
    db_mood_entry.appetite_rating = mood_entry_update.appetite_rating
    db_mood_entry.energy_rating = mood_entry_update.energy_rating
    db_mood_entry.social_rating = mood_entry_update.social_rating
    db_mood_entry.yowling_rating = mood_entry_update.yowling_rating
    db_mood_entry.notes = mood_entry_update.notes

    db.commit()
    db.refresh(db_mood_entry)

    return db_mood_entry


@router.delete("/{mood_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mood_entry(mood_entry_id: int, db: Session = Depends(get_db)):
    db_mood_entry = (
        db.query(models.MoodEntry)
        .filter(models.MoodEntry.id == mood_entry_id)
        .first()
    )

    if db_mood_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found",
        )

    db.delete(db_mood_entry)
    db.commit()
