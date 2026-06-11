from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import entry_time_or_now

router = APIRouter(prefix="/food-entries", tags=["Food Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_bowl(db: Session, bowl_id: int):
    db_bowl = db.query(models.Bowl).filter(models.Bowl.id == bowl_id).first()
    if db_bowl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bowl not found",
        )

    return db_bowl


def get_food(db: Session, food_id: int):
    db_food = db.query(models.Food).filter(models.Food.id == food_id).first()
    if db_food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found",
        )

    return db_food


def validate_starting_weight(starting_total_weight_grams: float, bowl: models.Bowl):
    if starting_total_weight_grams < bowl.empty_weight_grams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Starting total weight cannot be less than empty bowl weight",
        )


def reset_completed_food_entry_values(food_entry: models.FoodEntry):
    food_entry.ending_total_weight_grams = None
    food_entry.leftover_food_weight_grams = None
    food_entry.food_eaten_grams = None
    food_entry.calories_eaten = None
    food_entry.protein_consumed_grams = None
    food_entry.fat_consumed_grams = None
    food_entry.phosphorus_consumed_mg = None
    food_entry.sodium_consumed_mg = None
    food_entry.moisture_consumed_grams = None
    food_entry.dry_matter_consumed_grams = None


def calculate_completed_food_entry(
    food_entry: models.FoodEntry,
    ending_total_weight_grams: float,
    bowl: models.Bowl,
    food: models.Food,
):
    if ending_total_weight_grams > food_entry.starting_total_weight_grams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ending total weight cannot be greater than starting total weight",
        )

    if ending_total_weight_grams < bowl.empty_weight_grams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ending total weight cannot be less than empty bowl weight",
        )

    leftover_food_weight_grams = ending_total_weight_grams - bowl.empty_weight_grams
    food_eaten_grams = food_entry.starting_food_weight_grams - leftover_food_weight_grams

    food_entry.ending_total_weight_grams = ending_total_weight_grams
    food_entry.leftover_food_weight_grams = leftover_food_weight_grams
    food_entry.food_eaten_grams = food_eaten_grams
    food_entry.calories_eaten = food_eaten_grams * food.calories_per_gram
    food_entry.protein_consumed_grams = food_eaten_grams * (
        food.protein_as_fed_percent / 100
    )
    food_entry.fat_consumed_grams = food_eaten_grams * (food.fat_as_fed_percent / 100)
    food_entry.phosphorus_consumed_mg = (
        food_eaten_grams * (food.phosphorus_as_fed_percent / 100) * 1000
    )
    food_entry.sodium_consumed_mg = (
        food_eaten_grams * (food.sodium_as_fed_percent / 100) * 1000
    )
    food_entry.moisture_consumed_grams = food_eaten_grams * (
        food.moisture_percent / 100
    )
    food_entry.dry_matter_consumed_grams = food_eaten_grams * (
        food.dry_matter_percent / 100
    )


@router.post(
    "",
    response_model=schemas.FoodEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_food_entry(
    food_entry: schemas.FoodEntryCreate,
    db: Session = Depends(get_db),
):
    db_bowl = get_bowl(db, food_entry.bowl_id)
    db_food = get_food(db, food_entry.food_id)
    validate_starting_weight(food_entry.starting_total_weight_grams, db_bowl)

    starting_food_weight_grams = (
        food_entry.starting_total_weight_grams - db_bowl.empty_weight_grams
    )

    db_food_entry = models.FoodEntry(
        entry_time=entry_time_or_now(food_entry.entry_time),
        bowl_id=food_entry.bowl_id,
        food_id=food_entry.food_id,
        starting_total_weight_grams=food_entry.starting_total_weight_grams,
        starting_food_weight_grams=starting_food_weight_grams,
        notes=food_entry.notes,
    )

    if food_entry.ending_total_weight_grams is not None:
        calculate_completed_food_entry(
            db_food_entry,
            food_entry.ending_total_weight_grams,
            db_bowl,
            db_food,
        )

    db.add(db_food_entry)
    db.commit()
    db.refresh(db_food_entry)

    return db_food_entry


@router.patch("/{food_entry_id}", response_model=schemas.FoodEntryResponse)
def update_food_entry(
    food_entry_id: int,
    food_entry_update: schemas.FoodEntryUpdate,
    db: Session = Depends(get_db),
):
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

    if db_food_entry.is_open and food_entry_update.ending_total_weight_grams is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ending weight can only be edited for completed food entries",
        )

    db_bowl = get_bowl(db, db_food_entry.bowl_id)
    db_food = get_food(db, db_food_entry.food_id)
    validate_starting_weight(food_entry_update.starting_total_weight_grams, db_bowl)

    db_food_entry.entry_time = entry_time_or_now(food_entry_update.entry_time)
    db_food_entry.starting_total_weight_grams = (
        food_entry_update.starting_total_weight_grams
    )
    db_food_entry.starting_food_weight_grams = (
        food_entry_update.starting_total_weight_grams - db_bowl.empty_weight_grams
    )
    db_food_entry.notes = food_entry_update.notes

    if db_food_entry.is_open:
        reset_completed_food_entry_values(db_food_entry)
    else:
        ending_total_weight_grams = (
            food_entry_update.ending_total_weight_grams
            if food_entry_update.ending_total_weight_grams is not None
            else db_food_entry.ending_total_weight_grams
        )
        calculate_completed_food_entry(
            db_food_entry,
            ending_total_weight_grams,
            db_bowl,
            db_food,
        )

    db.commit()
    db.refresh(db_food_entry)

    return db_food_entry


@router.patch("/{food_entry_id}/finish", response_model=schemas.FoodEntryResponse)
def finish_food_entry(
    food_entry_id: int,
    food_entry_finish: schemas.FoodEntryFinish,
    db: Session = Depends(get_db),
):
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

    if not db_food_entry.is_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Food entry is already finished",
        )

    db_bowl = get_bowl(db, db_food_entry.bowl_id)
    db_food = get_food(db, db_food_entry.food_id)
    calculate_completed_food_entry(
        db_food_entry,
        food_entry_finish.ending_total_weight_grams,
        db_bowl,
        db_food,
    )

    if food_entry_finish.notes is not None:
        db_food_entry.notes = food_entry_finish.notes

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
