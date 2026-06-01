from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
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
    calories_per_gram = Column(Float, nullable=False)
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
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bowl = relationship("Bowl", back_populates="food_entries")
    food = relationship("Food", back_populates="food_entries")
