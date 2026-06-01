from datetime import datetime

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
    calories_per_gram: float
    notes: str | None = None


class FoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand: str | None
    calories_per_gram: float
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
    notes: str | None
    created_at: datetime
