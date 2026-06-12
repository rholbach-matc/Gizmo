from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/episode-entries", tags=["Episode Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.EpisodeEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_episode_entry(
    episode_entry: schemas.EpisodeEntryCreate,
    db: Session = Depends(get_db),
):
    db_episode_entry = models.EpisodeEntry(
        entry_time=entry_time_or_now(episode_entry.entry_time),
        severity=episode_entry.severity,
        notes=episode_entry.notes,
    )

    db.add(db_episode_entry)
    db.commit()
    db.refresh(db_episode_entry)

    return db_episode_entry


@router.get("", response_model=list[schemas.EpisodeEntryResponse])
def list_episode_entries(db: Session = Depends(get_db)):
    return (
        db.query(models.EpisodeEntry)
        .order_by(models.EpisodeEntry.entry_time.desc(), models.EpisodeEntry.id.desc())
        .all()
    )


@router.patch("/{episode_entry_id}", response_model=schemas.EpisodeEntryResponse)
def update_episode_entry(
    episode_entry_id: int,
    episode_entry_update: schemas.EpisodeEntryUpdate,
    db: Session = Depends(get_db),
):
    db_episode_entry = (
        db.query(models.EpisodeEntry)
        .filter(models.EpisodeEntry.id == episode_entry_id)
        .first()
    )

    if db_episode_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode entry not found",
        )

    db_episode_entry.entry_time = entry_time_or_now(episode_entry_update.entry_time)
    db_episode_entry.severity = episode_entry_update.severity
    db_episode_entry.notes = episode_entry_update.notes

    db.commit()
    db.refresh(db_episode_entry)

    return db_episode_entry


@router.delete("/{episode_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode_entry(episode_entry_id: int, db: Session = Depends(get_db)):
    db_episode_entry = (
        db.query(models.EpisodeEntry)
        .filter(models.EpisodeEntry.id == episode_entry_id)
        .first()
    )

    if db_episode_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode entry not found",
        )

    db.delete(db_episode_entry)
    db.commit()
