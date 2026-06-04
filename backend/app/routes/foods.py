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
    if food.serving_size_grams <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serving size must be greater than 0",
        )

    if food.calories_per_serving <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calories per serving must be greater than 0",
        )

    if (
        food.phosphorus_mg_per_serving is not None
        and food.phosphorus_mg_per_serving < 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phosphorus per serving cannot be negative",
        )

    if (
        food.protein_grams_per_serving is not None
        and food.protein_grams_per_serving < 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Protein per serving cannot be negative",
        )

    calories_per_gram = food.calories_per_serving / food.serving_size_grams
    phosphorus_mg_per_gram = None
    protein_grams_per_gram = None

    if food.phosphorus_mg_per_serving is not None:
        phosphorus_mg_per_gram = (
            food.phosphorus_mg_per_serving / food.serving_size_grams
        )

    if food.protein_grams_per_serving is not None:
        protein_grams_per_gram = (
            food.protein_grams_per_serving / food.serving_size_grams
        )

    db_food = models.Food(
        name=food.name,
        brand=food.brand,
        serving_size_grams=food.serving_size_grams,
        calories_per_serving=food.calories_per_serving,
        calories_per_gram=calories_per_gram,
        phosphorus_mg_per_serving=food.phosphorus_mg_per_serving,
        phosphorus_mg_per_gram=phosphorus_mg_per_gram,
        protein_grams_per_serving=food.protein_grams_per_serving,
        protein_grams_per_gram=protein_grams_per_gram,
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
