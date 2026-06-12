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
    water_entries = relationship("DrinkingWaterEntry", back_populates="bowl")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    medication_entries = relationship("MedicationEntry", back_populates="medication")


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
    finished_at = Column(DateTime, nullable=True)
    bowl_id = Column(Integer, ForeignKey("bowls.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    starting_total_weight_grams = Column(Float, nullable=False)
    ending_total_weight_grams = Column(Float, nullable=True)
    starting_food_weight_grams = Column(Float, nullable=False)
    leftover_food_weight_grams = Column(Float, nullable=True)
    food_eaten_grams = Column(Float, nullable=True)
    calories_eaten = Column(Float, nullable=True)
    protein_consumed_grams = Column(Float, nullable=True)
    fat_consumed_grams = Column(Float, nullable=True)
    phosphorus_consumed_mg = Column(Float, nullable=True)
    sodium_consumed_mg = Column(Float, nullable=True)
    moisture_consumed_grams = Column(Float, nullable=True)
    dry_matter_consumed_grams = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bowl = relationship("Bowl", back_populates="food_entries")
    food = relationship("Food", back_populates="food_entries")

    @property
    def is_open(self):
        return self.ending_total_weight_grams is None

    @property
    def food_name(self):
        if self.food is None:
            return "Unknown Food"

        return (
            f"{self.food.name} - {self.food.brand}"
            if self.food.brand
            else self.food.name
        )


class BMEntry(Base):
    __tablename__ = "bm_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    occurred = Column(Boolean, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FluidEntry(Base):
    __tablename__ = "fluid_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    amount_ml = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WeightEntry(Base):
    __tablename__ = "weight_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    weight_lbs = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DrinkingWaterEntry(Base):
    __tablename__ = "water_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    observation_type = Column(String, nullable=False, default="drank_water")
    bowl_id = Column(Integer, ForeignKey("bowls.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bowl = relationship("Bowl", back_populates="water_entries")


class EpisodeEntry(Base):
    __tablename__ = "episode_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    severity = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class VomitEntry(Base):
    __tablename__ = "vomit_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    severity = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    mood_rating = Column(Integer, nullable=True)
    appetite_rating = Column(Integer, nullable=True)
    energy_rating = Column(Integer, nullable=True)
    social_rating = Column(Integer, nullable=True)
    yowling_rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MedicationEntry(Base):
    __tablename__ = "medication_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)
    medication_name = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    medication = relationship("Medication", back_populates="medication_entries")


class VetVisitEntry(Base):
    __tablename__ = "vet_visit_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_time = Column(DateTime, nullable=False)
    reason = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    follow_up_needed = Column(Boolean, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
