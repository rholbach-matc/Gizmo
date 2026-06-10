from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/today", response_model=schemas.TodayDashboardResponse)
def get_today_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    start_of_today = datetime.combine(today, time.min)
    start_of_tomorrow = start_of_today + timedelta(days=1)

    totals = (
        db.query(
            func.count(models.FoodEntry.id),
            func.sum(models.FoodEntry.food_eaten_grams),
            func.sum(models.FoodEntry.calories_eaten),
            func.sum(models.FoodEntry.protein_consumed_grams),
            func.sum(models.FoodEntry.fat_consumed_grams),
            func.sum(models.FoodEntry.phosphorus_consumed_mg),
            func.sum(models.FoodEntry.sodium_consumed_mg),
            func.sum(models.FoodEntry.moisture_consumed_grams),
            func.sum(models.FoodEntry.dry_matter_consumed_grams),
        )
        .filter(models.FoodEntry.entry_time >= start_of_today)
        .filter(models.FoodEntry.entry_time < start_of_tomorrow)
        .one()
    )

    return schemas.TodayDashboardResponse(
        date=today,
        feedings_count=totals[0] or 0,
        food_eaten_grams=totals[1] or 0,
        calories_eaten=totals[2] or 0,
        protein_consumed_grams=totals[3] or 0,
        fat_consumed_grams=totals[4] or 0,
        phosphorus_consumed_mg=totals[5] or 0,
        sodium_consumed_mg=totals[6] or 0,
        moisture_consumed_grams=totals[7] or 0,
        dry_matter_consumed_grams=totals[8] or 0,
    )
