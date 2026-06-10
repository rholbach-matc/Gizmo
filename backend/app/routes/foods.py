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
    if food.can_size_grams <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can size must be greater than 0",
        )

    if food.calories_per_can <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calories per can must be greater than 0",
        )

    if food.moisture_percent < 0 or food.moisture_percent >= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Moisture percent must be at least 0 and less than 100",
        )

    if food.protein_as_fed_percent < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Protein as-fed percent cannot be negative",
        )

    if food.fat_as_fed_percent < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fat as-fed percent cannot be negative",
        )

    if food.phosphorus_as_fed_percent < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phosphorus as-fed percent cannot be negative",
        )

    if food.sodium_as_fed_percent < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sodium as-fed percent cannot be negative",
        )

    calories_per_gram = food.calories_per_can / food.can_size_grams
    dry_matter_percent = 100 - food.moisture_percent
    protein_dry_matter_percent = (
        food.protein_as_fed_percent / dry_matter_percent * 100
    )
    fat_dry_matter_percent = food.fat_as_fed_percent / dry_matter_percent * 100
    phosphorus_dry_matter_percent = (
        food.phosphorus_as_fed_percent / dry_matter_percent * 100
    )
    sodium_dry_matter_percent = (
        food.sodium_as_fed_percent / dry_matter_percent * 100
    )

    db_food = models.Food(
        name=food.name,
        brand=food.brand,
        can_size_grams=food.can_size_grams,
        calories_per_can=food.calories_per_can,
        calories_per_gram=calories_per_gram,
        moisture_percent=food.moisture_percent,
        dry_matter_percent=dry_matter_percent,
        protein_as_fed_percent=food.protein_as_fed_percent,
        protein_dry_matter_percent=protein_dry_matter_percent,
        fat_as_fed_percent=food.fat_as_fed_percent,
        fat_dry_matter_percent=fat_dry_matter_percent,
        phosphorus_as_fed_percent=food.phosphorus_as_fed_percent,
        phosphorus_dry_matter_percent=phosphorus_dry_matter_percent,
        sodium_as_fed_percent=food.sodium_as_fed_percent,
        sodium_dry_matter_percent=sodium_dry_matter_percent,
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
