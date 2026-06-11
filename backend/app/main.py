from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy knows which tables to create.
from app import models
from app.database import (
    Base,
    engine,
    migrate_food_entries_for_open_feedings,
    migrate_remaining_tracker_references,
)
from app.routes import (
    bm_entries,
    bowls,
    dashboard,
    episode_entries,
    fluid_entries,
    food_entries,
    foods,
    medication_entries,
    vet_visit_entries,
    water_entries,
    weight_entries,
)

app = FastAPI(title="Gizmo API")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    migrate_food_entries_for_open_feedings()
    migrate_remaining_tracker_references()


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(bowls.router)
app.include_router(bm_entries.router)
app.include_router(dashboard.router)
app.include_router(episode_entries.router)
app.include_router(fluid_entries.router)
app.include_router(food_entries.router)
app.include_router(foods.router)
app.include_router(medication_entries.router)
app.include_router(vet_visit_entries.router)
app.include_router(water_entries.router)
app.include_router(weight_entries.router)
