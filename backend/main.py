"""AutoPrice API starter. A trained and validated model is required for estimates."""
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AutoPrice API", version="0.1.0")
MODEL_PATH = Path("models/price_model.joblib")


class CarInput(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    year: int = Field(ge=1980, le=2035)
    mileage_km: int = Field(ge=0, le=1_000_000)
    transmission: str | None = None
    fuel_type: str | None = None
    region: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "model_available": MODEL_PATH.exists()}


@app.post("/api/v1/valuation")
def valuation(car: CarInput):
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Model hali tayyor emas. Avval ruxsatli bozor datasetini yig'ish va modelni validatsiya qilish kerak.",
        )
    try:
        bundle = joblib.load(MODEL_PATH)
        estimate = float(bundle["pipeline"].predict(pd.DataFrame([car.model_dump()]))[0])
        return {
            "estimated_price": round(estimate),
            "currency": "UZS",
            "price_type": "estimated_asking_price",
            "metrics": bundle.get("metrics", {}),
            "disclaimer": "Bu statistik taxmin, yakuniy bitim narxi emas.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Baholash xatosi: {exc}") from exc
