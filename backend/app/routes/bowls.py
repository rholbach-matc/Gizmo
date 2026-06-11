from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/bowls", tags=["Bowls"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=schemas.BowlResponse, status_code=status.HTTP_201_CREATED)
def create_bowl(bowl: schemas.BowlCreate, db: Session = Depends(get_db)):
    db_bowl = models.Bowl(
        name=bowl.name,
        empty_weight_grams=bowl.empty_weight_grams,
        color=bowl.color,
        notes=bowl.notes,
    )

    db.add(db_bowl)
    db.commit()
    db.refresh(db_bowl)

    return db_bowl


@router.get("", response_model=list[schemas.BowlResponse])
def list_bowls(db: Session = Depends(get_db)):
    return db.query(models.Bowl).order_by(models.Bowl.id).all()


@router.delete("/{bowl_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bowl(bowl_id: int, db: Session = Depends(get_db)):
    db_bowl = db.query(models.Bowl).filter(models.Bowl.id == bowl_id).first()

    if db_bowl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bowl not found",
        )

    open_feeding = (
        db.query(models.FoodEntry)
        .filter(
            models.FoodEntry.bowl_id == bowl_id,
            models.FoodEntry.ending_total_weight_grams.is_(None),
        )
        .first()
    )

    if open_feeding is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This bowl is currently being used by an open feeding. "
                "Finish or delete that feeding first."
            ),
        )

    db.delete(db_bowl)
    db.commit()
