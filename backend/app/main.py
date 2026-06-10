from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy knows which tables to create.
from app import models
from app.database import Base, engine
from app.routes import bowls, dashboard, food_entries, foods

app = FastAPI(title="Gizmo API")

allowed_origins = [
    "http://localhost:5173",
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
app.include_router(dashboard.router)
app.include_router(food_entries.router)
app.include_router(foods.router)
