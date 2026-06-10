from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy knows which tables to create.
from app import models
from app.database import Base, engine
from app.routes import (
    bm_entries,
    bowls,
    dashboard,
    fluid_entries,
    food_entries,
    foods,
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
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(bowls.router)
app.include_router(bm_entries.router)
app.include_router(dashboard.router)
app.include_router(fluid_entries.router)
app.include_router(food_entries.router)
app.include_router(foods.router)
app.include_router(weight_entries.router)
