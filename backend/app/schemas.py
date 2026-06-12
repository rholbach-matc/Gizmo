from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BowlCreate(BaseModel):
    name: str
    empty_weight_grams: float
    color: str | None = None
    notes: str | None = None


class BowlResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    empty_weight_grams: float
    color: str | None
    notes: str | None
    created_at: datetime


class MedicationCreate(BaseModel):
    name: str
    notes: str | None = None


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    notes: str | None
    created_at: datetime


class FoodCreate(BaseModel):
    name: str
    brand: str | None = None
    can_size_grams: float
    calories_per_can: float
    moisture_percent: float
    protein_as_fed_percent: float
    fat_as_fed_percent: float
    phosphorus_as_fed_percent: float
    sodium_as_fed_percent: float
    notes: str | None = None


class FoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand: str | None
    can_size_grams: float
    calories_per_can: float
    calories_per_gram: float
    moisture_percent: float
    dry_matter_percent: float
    protein_as_fed_percent: float
    protein_dry_matter_percent: float
    fat_as_fed_percent: float
    fat_dry_matter_percent: float
    phosphorus_as_fed_percent: float
    phosphorus_dry_matter_percent: float
    sodium_as_fed_percent: float
    sodium_dry_matter_percent: float
    notes: str | None
    created_at: datetime


class FoodEntryCreate(BaseModel):
    entry_time: datetime | None = None
    bowl_id: int
    food_id: int
    starting_total_weight_grams: float
    ending_total_weight_grams: float | None = None
    notes: str | None = None


class FoodEntryFinish(BaseModel):
    ending_total_weight_grams: float
    notes: str | None = None


class FoodEntryUpdate(BaseModel):
    entry_time: datetime
    starting_total_weight_grams: float
    ending_total_weight_grams: float | None = None
    notes: str | None = None


class FoodEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    bowl_id: int
    food_id: int
    starting_total_weight_grams: float
    ending_total_weight_grams: float | None
    starting_food_weight_grams: float
    leftover_food_weight_grams: float | None
    food_eaten_grams: float | None
    calories_eaten: float | None
    protein_consumed_grams: float | None
    fat_consumed_grams: float | None
    phosphorus_consumed_mg: float | None
    sodium_consumed_mg: float | None
    moisture_consumed_grams: float | None
    dry_matter_consumed_grams: float | None
    notes: str | None
    created_at: datetime
    is_open: bool


class BMEntryCreate(BaseModel):
    entry_time: datetime | None = None
    occurred: bool
    notes: str | None = None


class BMEntryUpdate(BaseModel):
    entry_time: datetime
    occurred: bool
    notes: str | None = None


class BMEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    occurred: bool
    notes: str | None
    created_at: datetime


class FluidEntryCreate(BaseModel):
    entry_time: datetime | None = None
    amount_ml: float
    notes: str | None = None


class FluidEntryUpdate(BaseModel):
    entry_time: datetime
    amount_ml: float
    notes: str | None = None


class FluidEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    amount_ml: float
    notes: str | None
    created_at: datetime


class WeightEntryCreate(BaseModel):
    entry_time: datetime | None = None
    weight_lbs: float
    notes: str | None = None


class WeightEntryUpdate(BaseModel):
    entry_time: datetime
    weight_lbs: float
    notes: str | None = None


class WeightEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    weight_lbs: float
    notes: str | None
    created_at: datetime


class DrinkingWaterEntryCreate(BaseModel):
    entry_time: datetime | None = None
    observation_type: str = "drank_water"
    bowl_id: int | None = None
    notes: str | None = None


class DrinkingWaterEntryUpdate(BaseModel):
    entry_time: datetime
    observation_type: str
    bowl_id: int | None = None
    notes: str | None = None


class DrinkingWaterEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    observation_type: str
    bowl_id: int | None
    notes: str | None
    created_at: datetime


class EpisodeEntryCreate(BaseModel):
    entry_time: datetime | None = None
    severity: str | None = None
    notes: str | None = None


class EpisodeEntryUpdate(BaseModel):
    entry_time: datetime
    severity: str | None = None
    notes: str | None = None


class EpisodeEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    severity: str | None
    notes: str | None
    created_at: datetime


VomitSeverity = Literal["mild", "moderate", "severe"]


class VomitEntryCreate(BaseModel):
    entry_time: datetime | None = None
    severity: VomitSeverity
    notes: str | None = None


class VomitEntryUpdate(BaseModel):
    entry_time: datetime
    severity: VomitSeverity
    notes: str | None = None


class VomitEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    severity: VomitSeverity
    notes: str | None
    created_at: datetime


class MoodEntryBase(BaseModel):
    mood_rating: int | None = Field(default=None, ge=1, le=5)
    appetite_rating: int | None = Field(default=None, ge=1, le=5)
    energy_rating: int | None = Field(default=None, ge=1, le=5)
    social_rating: int | None = Field(default=None, ge=1, le=5)
    yowling_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None

    @model_validator(mode="after")
    def require_rating_or_notes(self):
        ratings = [
            self.mood_rating,
            self.appetite_rating,
            self.energy_rating,
            self.social_rating,
            self.yowling_rating,
        ]
        has_rating = any(rating is not None for rating in ratings)
        has_notes = self.notes is not None and self.notes.strip() != ""

        if not has_rating and not has_notes:
            raise ValueError("At least one rating or notes is required")

        return self


class MoodEntryCreate(MoodEntryBase):
    entry_time: datetime | None = None


class MoodEntryUpdate(MoodEntryBase):
    entry_time: datetime


class MoodEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    mood_rating: int | None
    appetite_rating: int | None
    energy_rating: int | None
    social_rating: int | None
    yowling_rating: int | None
    notes: str | None
    created_at: datetime


class MedicationEntryCreate(BaseModel):
    entry_time: datetime | None = None
    medication_id: int
    dose: str | None = None
    notes: str | None = None


class MedicationEntryUpdate(BaseModel):
    entry_time: datetime
    medication_id: int
    dose: str | None = None
    notes: str | None = None


class MedicationEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    medication_id: int | None
    medication_name: str
    dose: str | None
    notes: str | None
    created_at: datetime


class VetVisitEntryCreate(BaseModel):
    entry_time: datetime | None = None
    reason: str | None = None
    summary: str | None = None
    follow_up_needed: bool | None = None
    notes: str | None = None


class VetVisitEntryUpdate(BaseModel):
    entry_time: datetime
    reason: str | None = None
    summary: str | None = None
    follow_up_needed: bool | None = None
    notes: str | None = None


class VetVisitEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    reason: str | None
    summary: str | None
    follow_up_needed: bool | None
    notes: str | None
    created_at: datetime


class DashboardActivityItem(BaseModel):
    type: str
    entry_time: datetime
    title: str
    summary: str
    details: str | None = None


class TodayDashboardResponse(BaseModel):
    date: date
    feedings_count: int
    open_feedings_count: int
    food_eaten_grams: float
    calories_eaten: float
    yesterday_calories_eaten: float | None
    protein_consumed_grams: float
    fat_consumed_grams: float
    phosphorus_consumed_mg: float
    sodium_consumed_mg: float
    moisture_consumed_grams: float
    dry_matter_consumed_grams: float
    last_food_entry: FoodEntryResponse | None
    last_bm_entry: BMEntryResponse | None
    last_fluid_entry: FluidEntryResponse | None
    latest_weight_entry: WeightEntryResponse | None
    last_water_entry: DrinkingWaterEntryResponse | None
    latest_episode_entry: EpisodeEntryResponse | None
    latest_medication_entry: MedicationEntryResponse | None
    latest_vet_visit_entry: VetVisitEntryResponse | None
    today_water_observation_count: int
    today_bm_count: int
    today_fluid_count: int
    today_medication_count: int
    today_episode_count: int
    recent_activity: list[DashboardActivityItem]


class DayDashboardResponse(BaseModel):
    date: date
    calories_eaten: float
    feedings_count: int
    bm_count: int
    water_observation_count: int
    episode_count: int
    medication_count: int
    fluids_given: bool
    latest_weight_entry: WeightEntryResponse | None
    activity: list[DashboardActivityItem]
