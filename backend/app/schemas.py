from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


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
    bowl_id: int
    food_id: int
    starting_total_weight_grams: float
    ending_total_weight_grams: float
    notes: str | None = None


class FoodEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    bowl_id: int
    food_id: int
    starting_total_weight_grams: float
    ending_total_weight_grams: float
    starting_food_weight_grams: float
    leftover_food_weight_grams: float
    food_eaten_grams: float
    calories_eaten: float
    protein_consumed_grams: float
    fat_consumed_grams: float
    phosphorus_consumed_mg: float
    sodium_consumed_mg: float
    moisture_consumed_grams: float
    dry_matter_consumed_grams: float
    notes: str | None
    created_at: datetime


class BMEntryCreate(BaseModel):
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
    notes: str | None = None


class DrinkingWaterEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_time: datetime
    notes: str | None
    created_at: datetime


class TodayDashboardResponse(BaseModel):
    date: date
    feedings_count: int
    food_eaten_grams: float
    calories_eaten: float
    protein_consumed_grams: float
    fat_consumed_grams: float
    phosphorus_consumed_mg: float
    sodium_consumed_mg: float
    moisture_consumed_grams: float
    dry_matter_consumed_grams: float
