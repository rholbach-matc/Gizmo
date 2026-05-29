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
