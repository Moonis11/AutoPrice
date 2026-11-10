"""Train and validate a baseline model using a held-out test split.

The saved prediction interval is an empirical 90th percentile absolute-error
band from the holdout set. It is a practical MVP uncertainty indicator, not a
formal guarantee of coverage.
"""
import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def build_pipeline(numeric: list[str], categorical: list[str]) -> Pipeline:
    transformers = []
    if numeric:
        transformers.append(("num", SimpleImputer(strategy="median"), numeric))
    if categorical:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ])
        transformers.append(("cat", categorical_pipeline, categorical))
    return Pipeline([
        ("preprocess", ColumnTransformer(transformers)),
        ("model", RandomForestRegressor(
            n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1
        )),
    ])


def train(input_path: str, model_path: str) -> dict:
    df = pd.read_csv(input_path)
    numeric = [c for c in ["year", "mileage_km"] if c in df.columns]
    categorical = [
        c for c in ["make", "model", "transmission", "fuel_type", "region", "condition"]
        if c in df.columns
    ]
    features = numeric + categorical
    if "price" not in df or not {"year", "mileage_km", "make", "model"}.issubset(df.columns):
        raise ValueError("make, model, year, mileage_km va price ustunlari majburiy.")

    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["price", "year", "mileage_km", "make", "model"])
    df = df[df["price"] > 0].drop_duplicates()
    if len(df) < 50:
        raise ValueError("Kamida 50 ta haqiqiy e'lon kerak; barqaror model uchun ko'proq ma'lumot yig'ing.")

    X, y = df[features], df["price"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    validation_pipeline = build_pipeline(numeric, categorical)
    validation_pipeline.fit(X_train, y_train)
    predictions = validation_pipeline.predict(X_test)
    absolute_errors = (y_test.to_numpy() - predictions)
    absolute_errors = abs(absolute_errors)

    interval_error = float(pd.Series(absolute_errors).quantile(0.90))
    metrics = {
        "rows": int(len(df)),
        "test_rows": int(len(y_test)),
        "mae_uzs": float(mean_absolute_error(y_test, predictions)),
        "rmse_uzs": float(mean_squared_error(y_test, predictions) ** 0.5),
        "r2": float(r2_score(y_test, predictions)),
        "interval_method": "holdout_90th_percentile_absolute_error",
        "interval_error_uzs": interval_error,
        "features": features,
    }

    # Refit the final model on all available permitted records after evaluation.
    final_pipeline = build_pipeline(numeric, categorical)
    final_pipeline.fit(X, y)

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "pipeline": final_pipeline,
        "metrics": metrics,
        "interval_error_uzs": interval_error,
        "currency": "UZS",
    }, path)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/processed/cars_clean.csv")
    parser.add_argument("--model", default="models/price_model.joblib")
    args = parser.parse_args()
    print(train(args.input, args.model))
