"""AutoPrice API. A trained model is required before returning an estimate."""
import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="AutoPrice API",
    description="Used-car asking-price estimates for Uzbekistan; outputs are indicative only.",
    version="0.2.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MODEL_PATH = Path(os.getenv("MODEL_PATH", "models/price_model.joblib"))


class CarInput(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    year: int = Field(ge=1980, le=2035)
    mileage_km: int = Field(ge=0, le=1_000_000)
    transmission: str | None = None
    fuel_type: str | None = None
    region: str | None = None
    condition: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "model_available": MODEL_PATH.exists()}


@app.post("/api/v1/valuation")
def valuation(car: CarInput):
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Model hali tayyor emas. Ruxsatli va tozalangan bozor datasetini yig'ish kerak.",
        )
    try:
        bundle = joblib.load(MODEL_PATH)
        pipeline = bundle["pipeline"]
        features = bundle["metrics"]["features"]
        input_data = car.model_dump()
        row = pd.DataFrame([{name: input_data.get(name) for name in features}])
        estimate = max(0.0, float(pipeline.predict(row)[0]))
        interval_error = float(bundle.get("interval_error_uzs", 0.0))
        return {
            "estimated_price": round(estimate),
            "estimated_range": {
                "lower": round(max(0.0, estimate - interval_error)),
                "upper": round(estimate + interval_error),
            },
            "currency": "UZS",
            "price_type": "estimated_asking_price",
            "model_metrics": bundle.get("metrics", {}),
            "uncertainty_note": "Oraliq test to'plamidagi 90-persentil mutlaq xatoga asoslangan; bu kafolatlangan ishonch oralig'i emas.",
            "disclaimer": "Bu statistik taxmin, yakuniy bitim narxi emas. Avtomobilni ko'zdan kechirish zarur.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Baholash xatosi: {exc}") from exc
