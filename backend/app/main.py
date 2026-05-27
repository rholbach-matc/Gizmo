from fastapi import FastAPI

app = FastAPI(title="Gizmo API")


@app.get("/health")
def health_check():
    return {"status": "ok"}
