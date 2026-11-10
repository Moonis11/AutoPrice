"""Train a baseline random-forest regressor from a real cleaned dataset."""
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


def train(input_path: str, model_path: str) -> dict:
    df = pd.read_csv(input_path)
    numeric = [c for c in ["year", "mileage_km"] if c in df.columns]
    categorical = [c for c in ["make", "model", "transmission", "fuel_type", "region"] if c in df.columns]
    features = numeric + categorical
    if "price" not in df or len(features) < 2:
        raise ValueError("price va kamida ikkita feature kerak.")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["price"])
    if len(df) < 50:
        raise ValueError("Kamida 50 ta haqiqiy tozalangan e'lon kerak; yaxshisi bundan ancha ko'p.")
    X, y = df[features], df["price"]
    transformers = []
    if numeric:
        transformers.append(("num", SimpleImputer(strategy="median"), numeric))
    if categorical:
        cat = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ])
        transformers.append(("cat", cat, categorical))
    pipeline = Pipeline([
        ("preprocess", ColumnTransformer(transformers)),
        ("model", RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1)),
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_test)
    metrics = {
        "rows": int(len(df)),
        "mae": float(mean_absolute_error(y_test, pred)),
        "rmse": float(mean_squared_error(y_test, pred) ** 0.5),
        "r2": float(r2_score(y_test, pred)),
        "features": features,
    }
    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "metrics": metrics}, path)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/processed/cars_clean.csv")
    parser.add_argument("--model", default="models/price_model.joblib")
    args = parser.parse_args()
    print(train(args.input, args.model))
