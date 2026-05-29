from fastapi import FastAPI

# Import models so SQLAlchemy knows which tables to create.
from app import models
from app.database import Base, engine

app = FastAPI(title="Gizmo API")


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}
