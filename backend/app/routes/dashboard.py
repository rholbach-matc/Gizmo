from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

RECENT_ACTIVITY_LIMIT = 10


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def format_number(value: float):
    return round(value, 2)


def build_activity_items(
    food_entries: list[models.FoodEntry],
    bm_entries: list[models.BMEntry],
    fluid_entries: list[models.FluidEntry],
    weight_entries: list[models.WeightEntry],
    water_entries: list[models.DrinkingWaterEntry],
):
    activity_items = []

    for entry in food_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="food",
                entry_time=entry.entry_time,
                title="Food entry",
                summary=(
                    f"{format_number(entry.food_eaten_grams)} g eaten, "
                    f"{format_number(entry.calories_eaten)} cal"
                ),
            )
        )

    for entry in bm_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="bm",
                entry_time=entry.entry_time,
                title="BM entry",
                summary="BM occurred" if entry.occurred else "No BM",
            )
        )

    for entry in fluid_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="fluids",
                entry_time=entry.entry_time,
                title="Sub-Q fluids",
                summary=f"{format_number(entry.amount_ml)} ml",
            )
        )

    for entry in weight_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="weight",
                entry_time=entry.entry_time,
                title="Weight",
                summary=f"{format_number(entry.weight_lbs)} lbs",
            )
        )

    for entry in water_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="water",
                entry_time=entry.entry_time,
                title="Water observation",
                summary="Seen drinking water",
            )
        )

    return sorted(
        activity_items,
        key=lambda item: item.entry_time,
        reverse=True,
    )[:RECENT_ACTIVITY_LIMIT]


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

    last_food_entry = (
        db.query(models.FoodEntry)
        .order_by(models.FoodEntry.entry_time.desc(), models.FoodEntry.id.desc())
        .first()
    )
    last_bm_entry = (
        db.query(models.BMEntry)
        .order_by(models.BMEntry.entry_time.desc(), models.BMEntry.id.desc())
        .first()
    )
    last_fluid_entry = (
        db.query(models.FluidEntry)
        .order_by(models.FluidEntry.entry_time.desc(), models.FluidEntry.id.desc())
        .first()
    )
    latest_weight_entry = (
        db.query(models.WeightEntry)
        .order_by(models.WeightEntry.entry_time.desc(), models.WeightEntry.id.desc())
        .first()
    )
    last_water_entry = (
        db.query(models.DrinkingWaterEntry)
        .order_by(
            models.DrinkingWaterEntry.entry_time.desc(),
            models.DrinkingWaterEntry.id.desc(),
        )
        .first()
    )

    today_water_observation_count = (
        db.query(func.count(models.DrinkingWaterEntry.id))
        .filter(models.DrinkingWaterEntry.entry_time >= start_of_today)
        .filter(models.DrinkingWaterEntry.entry_time < start_of_tomorrow)
        .scalar()
        or 0
    )

    recent_food_entries = (
        db.query(models.FoodEntry)
        .order_by(models.FoodEntry.entry_time.desc(), models.FoodEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_bm_entries = (
        db.query(models.BMEntry)
        .order_by(models.BMEntry.entry_time.desc(), models.BMEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_fluid_entries = (
        db.query(models.FluidEntry)
        .order_by(models.FluidEntry.entry_time.desc(), models.FluidEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_weight_entries = (
        db.query(models.WeightEntry)
        .order_by(models.WeightEntry.entry_time.desc(), models.WeightEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_water_entries = (
        db.query(models.DrinkingWaterEntry)
        .order_by(
            models.DrinkingWaterEntry.entry_time.desc(),
            models.DrinkingWaterEntry.id.desc(),
        )
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
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
        last_food_entry=last_food_entry,
        last_bm_entry=last_bm_entry,
        last_fluid_entry=last_fluid_entry,
        latest_weight_entry=latest_weight_entry,
        last_water_entry=last_water_entry,
        today_water_observation_count=today_water_observation_count,
        recent_activity=build_activity_items(
            recent_food_entries,
            recent_bm_entries,
            recent_fluid_entries,
            recent_weight_entries,
            recent_water_entries,
        ),
    )
