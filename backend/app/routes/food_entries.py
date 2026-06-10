from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/food-entries", tags=["Food Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=schemas.FoodEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_food_entry(
    food_entry: schemas.FoodEntryCreate,
    db: Session = Depends(get_db),
):
    if food_entry.ending_total_weight_grams > food_entry.starting_total_weight_grams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ending total weight cannot be greater than starting total weight",
        )

    db_bowl = db.query(models.Bowl).filter(models.Bowl.id == food_entry.bowl_id).first()
    if db_bowl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bowl not found",
        )

    db_food = db.query(models.Food).filter(models.Food.id == food_entry.food_id).first()
    if db_food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found",
        )

    starting_food_weight_grams = (
        food_entry.starting_total_weight_grams - db_bowl.empty_weight_grams
    )
    leftover_food_weight_grams = (
        food_entry.ending_total_weight_grams - db_bowl.empty_weight_grams
    )
    food_eaten_grams = starting_food_weight_grams - leftover_food_weight_grams
    calories_eaten = food_eaten_grams * db_food.calories_per_gram
    protein_consumed_grams = food_eaten_grams * (
        db_food.protein_as_fed_percent / 100
    )
    fat_consumed_grams = food_eaten_grams * (db_food.fat_as_fed_percent / 100)
    phosphorus_consumed_mg = (
        food_eaten_grams * (db_food.phosphorus_as_fed_percent / 100) * 1000
    )
    sodium_consumed_mg = (
        food_eaten_grams * (db_food.sodium_as_fed_percent / 100) * 1000
    )
    moisture_consumed_grams = food_eaten_grams * (
        db_food.moisture_percent / 100
    )
    dry_matter_consumed_grams = food_eaten_grams * (
        db_food.dry_matter_percent / 100
    )

    db_food_entry = models.FoodEntry(
        entry_time=datetime.utcnow(),
        bowl_id=food_entry.bowl_id,
        food_id=food_entry.food_id,
        starting_total_weight_grams=food_entry.starting_total_weight_grams,
        ending_total_weight_grams=food_entry.ending_total_weight_grams,
        starting_food_weight_grams=starting_food_weight_grams,
        leftover_food_weight_grams=leftover_food_weight_grams,
        food_eaten_grams=food_eaten_grams,
        calories_eaten=calories_eaten,
        protein_consumed_grams=protein_consumed_grams,
        fat_consumed_grams=fat_consumed_grams,
        phosphorus_consumed_mg=phosphorus_consumed_mg,
        sodium_consumed_mg=sodium_consumed_mg,
        moisture_consumed_grams=moisture_consumed_grams,
        dry_matter_consumed_grams=dry_matter_consumed_grams,
        notes=food_entry.notes,
    )

    db.add(db_food_entry)
    db.commit()
    db.refresh(db_food_entry)

    return db_food_entry


@router.get("", response_model=list[schemas.FoodEntryResponse])
def list_food_entries(db: Session = Depends(get_db)):
    return db.query(models.FoodEntry).order_by(models.FoodEntry.id).all()


@router.get("/{food_entry_id}", response_model=schemas.FoodEntryResponse)
def get_food_entry(food_entry_id: int, db: Session = Depends(get_db)):
    db_food_entry = (
        db.query(models.FoodEntry)
        .filter(models.FoodEntry.id == food_entry_id)
        .first()
    )

    if db_food_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food entry not found",
        )

    return db_food_entry


@router.delete("/{food_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_entry(food_entry_id: int, db: Session = Depends(get_db)):
    db_food_entry = (
        db.query(models.FoodEntry)
        .filter(models.FoodEntry.id == food_entry_id)
        .first()
    )

    if db_food_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food entry not found",
        )

    db.delete(db_food_entry)
    db.commit()
