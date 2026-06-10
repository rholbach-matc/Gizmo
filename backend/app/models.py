from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Bowl(Base):
    __tablename__ = "bowls"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    empty_weight_grams = Column(Float, nullable=False)
    color = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    food_entries = relationship("FoodEntry", back_populates="bowl")


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    can_size_grams = Column(Float, nullable=False)
    calories_per_can = Column(Float, nullable=False)
    calories_per_gram = Column(Float, nullable=False)
    moisture_percent = Column(Float, nullable=False)
    dry_matter_percent = Column(Float, nullable=False)
    protein_as_fed_percent = Column(Float, nullable=False)
    protein_dry_matter_percent = Column(Float, nullable=False)
    fat_as_fed_percent = Column(Float, nullable=False)
    fat_dry_matter_percent = Column(Float, nullable=False)
    phosphorus_as_fed_percent = Column(Float, nullable=False)
    phosphorus_dry_matter_percent = Column(Float, nullable=False)
    sodium_as_fed_percent = Column(Float, nullable=False)
    sodium_dry_matter_percent = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    food_entries = relationship("FoodEntry", back_populates="food")


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    bowl_id = Column(Integer, ForeignKey("bowls.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    starting_total_weight_grams = Column(Float, nullable=False)
    ending_total_weight_grams = Column(Float, nullable=False)
    starting_food_weight_grams = Column(Float, nullable=False)
    leftover_food_weight_grams = Column(Float, nullable=False)
    food_eaten_grams = Column(Float, nullable=False)
    calories_eaten = Column(Float, nullable=False)
    protein_consumed_grams = Column(Float, nullable=False)
    fat_consumed_grams = Column(Float, nullable=False)
    phosphorus_consumed_mg = Column(Float, nullable=False)
    sodium_consumed_mg = Column(Float, nullable=False)
    moisture_consumed_grams = Column(Float, nullable=False)
    dry_matter_consumed_grams = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bowl = relationship("Bowl", back_populates="food_entries")
    food = relationship("Food", back_populates="food_entries")


class BMEntry(Base):
    __tablename__ = "bm_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    occurred = Column(Boolean, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
