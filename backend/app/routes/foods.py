from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/foods", tags=["Foods"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=schemas.FoodResponse, status_code=status.HTTP_201_CREATED)
def create_food(food: schemas.FoodCreate, db: Session = Depends(get_db)):
    db_food = models.Food(
        name=food.name,
        brand=food.brand,
        calories_per_gram=food.calories_per_gram,
        notes=food.notes,
    )

    db.add(db_food)
    db.commit()
    db.refresh(db_food)

    return db_food


@router.get("", response_model=list[schemas.FoodResponse])
def list_foods(db: Session = Depends(get_db)):
    return db.query(models.Food).order_by(models.Food.id).all()


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(food_id: int, db: Session = Depends(get_db)):
    db_food = db.query(models.Food).filter(models.Food.id == food_id).first()

    if db_food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found",
        )

    db.delete(db_food)
    db.commit()
