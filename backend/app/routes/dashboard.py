from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.time_utils import caregiver_day_bounds_for_utc_storage, caregiver_today

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

RECENT_ACTIVITY_LIMIT = 15


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def format_number(value: float):
    return round(value, 2)


def format_water_observation_type(observation_type: str):
    return {
        "drank_water": "Drank water",
        "visited_bowl": "Visited bowl",
        "refused_water": "Refused water",
    }.get(observation_type, "Water observation")


def mood_entry_lines(entry: models.MoodEntry):
    rating_fields = [
        ("Mood", entry.mood_rating),
        ("Appetite", entry.appetite_rating),
        ("Energy", entry.energy_rating),
        ("Social", entry.social_rating),
        ("Yowling", entry.yowling_rating),
    ]
    lines = [f"{label}: {rating}" for label, rating in rating_fields if rating is not None]

    if entry.notes:
        lines.append(entry.notes)

    return lines


def build_activity_items(
    food_entries: list[models.FoodEntry],
    bm_entries: list[models.BMEntry],
    fluid_entries: list[models.FluidEntry],
    weight_entries: list[models.WeightEntry],
    water_entries: list[models.DrinkingWaterEntry],
    episode_entries: list[models.EpisodeEntry],
    vomit_entries: list[models.VomitEntry],
    mood_entries: list[models.MoodEntry],
    medication_entries: list[models.MedicationEntry],
    vet_visit_entries: list[models.VetVisitEntry],
    *,
    reverse: bool = True,
    limit: int | None = RECENT_ACTIVITY_LIMIT,
):
    activity_items = []

    for entry in food_entries:
        if entry.is_open:
            summary = f"{format_number(entry.starting_food_weight_grams)} g served"
            details = "Feeding in progress"
        else:
            summary = (
                f"{format_number(entry.food_eaten_grams)} g eaten of {entry.food_name}, "
                f"{format_number(entry.calories_eaten)} cal"
            )
            details = f"{format_number(entry.phosphorus_consumed_mg)} mg phosphorus"

        activity_items.append(
            schemas.DashboardActivityItem(
                type="food",
                entry_time=entry.entry_time,
                title="Food entry",
                summary=summary,
                details=details,
            )
        )

    for entry in bm_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="bm",
                entry_time=entry.entry_time,
                title="BM entry",
                summary="BM occurred" if entry.occurred else "No BM",
                details=entry.notes,
            )
        )

    for entry in fluid_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="fluids",
                entry_time=entry.entry_time,
                title="Sub-Q fluids",
                summary=f"{format_number(entry.amount_ml)} ml",
                details=entry.notes,
            )
        )

    for entry in weight_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="weight",
                entry_time=entry.entry_time,
                title="Weight",
                summary=f"{format_number(entry.weight_lbs)} lbs",
                details=entry.notes,
            )
        )

    for entry in water_entries:
        summary = format_water_observation_type(entry.observation_type)
        details_parts = [part for part in [entry.bowl.name if entry.bowl else None, entry.notes] if part]
        details = " - ".join(details_parts) if details_parts else None

        activity_items.append(
            schemas.DashboardActivityItem(
                type="water",
                entry_time=entry.entry_time,
                title="Water observation",
                summary=summary,
                details=details,
            )
        )

    for entry in episode_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="episode",
                entry_time=entry.entry_time,
                title="Episode",
                summary=entry.severity or "Shaking/wobbly episode",
                details=entry.notes,
            )
        )

    for entry in vomit_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="vomit",
                entry_time=entry.entry_time,
                title="Vomit",
                summary=entry.severity,
                details=entry.notes,
            )
        )

    for entry in mood_entries:
        lines = mood_entry_lines(entry)
        activity_items.append(
            schemas.DashboardActivityItem(
                type="mood",
                entry_time=entry.entry_time,
                title="Mood Check-In",
                summary=lines[0] if lines else "Mood Check-In",
                details="\n".join(lines[1:]) if len(lines) > 1 else None,
            )
        )

    for entry in medication_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="medication",
                entry_time=entry.entry_time,
                title="Medication",
                summary=entry.medication_name,
                details=entry.dose or entry.notes,
            )
        )

    for entry in vet_visit_entries:
        activity_items.append(
            schemas.DashboardActivityItem(
                type="vet_visit",
                entry_time=entry.entry_time,
                title="Vet visit",
                summary=entry.reason or "Vet visit",
                details=entry.summary or entry.notes,
            )
        )

    return sorted(
        activity_items,
        key=lambda item: item.entry_time,
        reverse=reverse,
    )[:limit]


def entries_for_day(query, model, start_of_day, start_of_next_day, *, ascending=False):
    order_method = model.entry_time.asc if ascending else model.entry_time.desc
    id_order_method = model.id.asc if ascending else model.id.desc

    return (
        query.filter(model.entry_time >= start_of_day)
        .filter(model.entry_time < start_of_next_day)
        .order_by(order_method(), id_order_method())
        .all()
    )


@router.get("/today", response_model=schemas.TodayDashboardResponse)
def get_today_dashboard(db: Session = Depends(get_db)):
    today = caregiver_today()
    start_of_today, start_of_tomorrow = caregiver_day_bounds_for_utc_storage(today)
    yesterday = today - timedelta(days=1)
    start_of_yesterday, start_of_today_for_yesterday = (
        caregiver_day_bounds_for_utc_storage(yesterday)
    )

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
        .filter(models.FoodEntry.ending_total_weight_grams.is_not(None))
        .one()
    )

    open_feedings_count = (
        db.query(func.count(models.FoodEntry.id))
        .filter(models.FoodEntry.entry_time >= start_of_today)
        .filter(models.FoodEntry.entry_time < start_of_tomorrow)
        .filter(models.FoodEntry.ending_total_weight_grams.is_(None))
        .scalar()
        or 0
    )

    yesterday_totals = (
        db.query(
            func.count(models.FoodEntry.id),
            func.sum(models.FoodEntry.calories_eaten),
        )
        .filter(models.FoodEntry.entry_time >= start_of_yesterday)
        .filter(models.FoodEntry.entry_time < start_of_today_for_yesterday)
        .filter(models.FoodEntry.ending_total_weight_grams.is_not(None))
        .one()
    )
    yesterday_calories_eaten = (
        yesterday_totals[1] or 0 if yesterday_totals[0] else None
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
    latest_episode_entry = (
        db.query(models.EpisodeEntry)
        .order_by(models.EpisodeEntry.entry_time.desc(), models.EpisodeEntry.id.desc())
        .first()
    )
    latest_medication_entry = (
        db.query(models.MedicationEntry)
        .order_by(
            models.MedicationEntry.entry_time.desc(),
            models.MedicationEntry.id.desc(),
        )
        .first()
    )
    latest_vet_visit_entry = (
        db.query(models.VetVisitEntry)
        .order_by(
            models.VetVisitEntry.entry_time.desc(),
            models.VetVisitEntry.id.desc(),
        )
        .first()
    )

    today_bm_count = (
        db.query(func.count(models.BMEntry.id))
        .filter(models.BMEntry.entry_time >= start_of_today)
        .filter(models.BMEntry.entry_time < start_of_tomorrow)
        .filter(models.BMEntry.occurred.is_(True))
        .scalar()
        or 0
    )
    today_fluid_count = (
        db.query(func.count(models.FluidEntry.id))
        .filter(models.FluidEntry.entry_time >= start_of_today)
        .filter(models.FluidEntry.entry_time < start_of_tomorrow)
        .scalar()
        or 0
    )
    today_medication_count = (
        db.query(func.count(models.MedicationEntry.id))
        .filter(models.MedicationEntry.entry_time >= start_of_today)
        .filter(models.MedicationEntry.entry_time < start_of_tomorrow)
        .scalar()
        or 0
    )
    today_episode_count = (
        db.query(func.count(models.EpisodeEntry.id))
        .filter(models.EpisodeEntry.entry_time >= start_of_today)
        .filter(models.EpisodeEntry.entry_time < start_of_tomorrow)
        .scalar()
        or 0
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
    recent_episode_entries = (
        db.query(models.EpisodeEntry)
        .order_by(models.EpisodeEntry.entry_time.desc(), models.EpisodeEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_vomit_entries = (
        db.query(models.VomitEntry)
        .order_by(models.VomitEntry.entry_time.desc(), models.VomitEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_mood_entries = (
        db.query(models.MoodEntry)
        .order_by(models.MoodEntry.entry_time.desc(), models.MoodEntry.id.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_medication_entries = (
        db.query(models.MedicationEntry)
        .order_by(
            models.MedicationEntry.entry_time.desc(),
            models.MedicationEntry.id.desc(),
        )
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_vet_visit_entries = (
        db.query(models.VetVisitEntry)
        .order_by(
            models.VetVisitEntry.entry_time.desc(),
            models.VetVisitEntry.id.desc(),
        )
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )

    return schemas.TodayDashboardResponse(
        date=today,
        feedings_count=totals[0] or 0,
        open_feedings_count=open_feedings_count,
        food_eaten_grams=totals[1] or 0,
        calories_eaten=totals[2] or 0,
        yesterday_calories_eaten=yesterday_calories_eaten,
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
        latest_episode_entry=latest_episode_entry,
        latest_medication_entry=latest_medication_entry,
        latest_vet_visit_entry=latest_vet_visit_entry,
        today_water_observation_count=today_water_observation_count,
        today_bm_count=today_bm_count,
        today_fluid_count=today_fluid_count,
        today_medication_count=today_medication_count,
        today_episode_count=today_episode_count,
        recent_activity=build_activity_items(
            recent_food_entries,
            recent_bm_entries,
            recent_fluid_entries,
            recent_weight_entries,
            recent_water_entries,
            recent_episode_entries,
            recent_vomit_entries,
            recent_mood_entries,
            recent_medication_entries,
            recent_vet_visit_entries,
        ),
    )


@router.get("/day/{day}", response_model=schemas.DayDashboardResponse)
def get_day_dashboard(day: date, db: Session = Depends(get_db)):
    start_of_day, start_of_next_day = caregiver_day_bounds_for_utc_storage(day)

    totals = (
        db.query(
            func.count(models.FoodEntry.id),
            func.sum(models.FoodEntry.calories_eaten),
        )
        # Feedings are attributed to the day they were started, so a feeding
        # that spans midnight remains on its creation/start date.
        .filter(models.FoodEntry.entry_time >= start_of_day)
        .filter(models.FoodEntry.entry_time < start_of_next_day)
        .filter(models.FoodEntry.ending_total_weight_grams.is_not(None))
        .one()
    )

    bm_count = (
        db.query(func.count(models.BMEntry.id))
        .filter(models.BMEntry.entry_time >= start_of_day)
        .filter(models.BMEntry.entry_time < start_of_next_day)
        .filter(models.BMEntry.occurred.is_(True))
        .scalar()
        or 0
    )
    fluid_count = (
        db.query(func.count(models.FluidEntry.id))
        .filter(models.FluidEntry.entry_time >= start_of_day)
        .filter(models.FluidEntry.entry_time < start_of_next_day)
        .scalar()
        or 0
    )
    water_observation_count = (
        db.query(func.count(models.DrinkingWaterEntry.id))
        .filter(models.DrinkingWaterEntry.entry_time >= start_of_day)
        .filter(models.DrinkingWaterEntry.entry_time < start_of_next_day)
        .scalar()
        or 0
    )
    episode_count = (
        db.query(func.count(models.EpisodeEntry.id))
        .filter(models.EpisodeEntry.entry_time >= start_of_day)
        .filter(models.EpisodeEntry.entry_time < start_of_next_day)
        .scalar()
        or 0
    )
    medication_count = (
        db.query(func.count(models.MedicationEntry.id))
        .filter(models.MedicationEntry.entry_time >= start_of_day)
        .filter(models.MedicationEntry.entry_time < start_of_next_day)
        .scalar()
        or 0
    )
    latest_weight_entry = (
        db.query(models.WeightEntry)
        .filter(models.WeightEntry.entry_time >= start_of_day)
        .filter(models.WeightEntry.entry_time < start_of_next_day)
        .order_by(models.WeightEntry.entry_time.desc(), models.WeightEntry.id.desc())
        .first()
    )

    food_entries = entries_for_day(
        db.query(models.FoodEntry),
        models.FoodEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    bm_entries = entries_for_day(
        db.query(models.BMEntry),
        models.BMEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    fluid_entries = entries_for_day(
        db.query(models.FluidEntry),
        models.FluidEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    weight_entries = entries_for_day(
        db.query(models.WeightEntry),
        models.WeightEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    water_entries = entries_for_day(
        db.query(models.DrinkingWaterEntry),
        models.DrinkingWaterEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    episode_entries = entries_for_day(
        db.query(models.EpisodeEntry),
        models.EpisodeEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    vomit_entries = entries_for_day(
        db.query(models.VomitEntry),
        models.VomitEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    mood_entries = entries_for_day(
        db.query(models.MoodEntry),
        models.MoodEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    medication_entries = entries_for_day(
        db.query(models.MedicationEntry),
        models.MedicationEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )
    vet_visit_entries = entries_for_day(
        db.query(models.VetVisitEntry),
        models.VetVisitEntry,
        start_of_day,
        start_of_next_day,
        ascending=True,
    )

    return schemas.DayDashboardResponse(
        date=day,
        calories_eaten=totals[1] or 0,
        feedings_count=totals[0] or 0,
        bm_count=bm_count,
        water_observation_count=water_observation_count,
        episode_count=episode_count,
        medication_count=medication_count,
        fluids_given=fluid_count > 0,
        latest_weight_entry=latest_weight_entry,
        activity=build_activity_items(
            food_entries,
            bm_entries,
            fluid_entries,
            weight_entries,
            water_entries,
            episode_entries,
            vomit_entries,
            mood_entries,
            medication_entries,
            vet_visit_entries,
            reverse=False,
            limit=None,
        ),
    )
