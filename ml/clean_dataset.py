"""Clean a permitted CSV export; retain only UZS rows for baseline training."""
import argparse
from pathlib import Path

import pandas as pd


def clean_dataset(input_path: str, output_path: str) -> pd.DataFrame:
    df = pd.read_csv(input_path)
    required = {"price", "year", "mileage_km"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Ustunlar yetishmaydi: {sorted(missing)}")
    for column in ("price", "year", "mileage_km"):
        df[column] = pd.to_numeric(df[column], errors="coerce")
    for column in ("make", "model", "region", "currency"):
        if column in df.columns:
            df[column] = df[column].astype("string").str.strip()
    df = df.dropna(subset=["price", "year", "mileage_km"])
    df = df[(df.price > 0) & df.year.between(1980, 2035) & df.mileage_km.between(0, 1_000_000)]
    if "currency" in df.columns:
        df = df[df.currency.str.upper() == "UZS"]
    if "source_url" in df.columns:
        df = df.drop_duplicates(subset=["source_url"], keep="last")
    else:
        df = df.drop_duplicates()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", default="data/processed/cars_clean.csv")
    args = parser.parse_args()
    cleaned = clean_dataset(args.input, args.output)
    print(f"Tozalangan qatorlar: {len(cleaned)}")
