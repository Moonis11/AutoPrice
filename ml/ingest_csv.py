"""Validate and clean a licensed/user-provided CSV dataset."""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

REQUIRED_COLUMNS = {"make", "model", "year", "mileage_km", "price", "currency"}
OPTIONAL_COLUMNS = {
    "transmission", "fuel_type", "region", "condition",
    "source", "source_url", "collected_at", "price_type",
}


def validate_input(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV ustunlari yetishmaydi: {', '.join(sorted(missing))}")
    if df.empty:
        raise ValueError("CSV faylida ma'lumot qatori yo'q.")

    # Do not accept contact details in the valuation dataset.
    forbidden = {"phone", "phone_number", "email", "seller_name", "contact"}
    present = forbidden.intersection({c.lower() for c in df.columns})
    if present:
        raise ValueError(
            "Shaxsiy aloqa ma'lumotlari olib tashlansin: "
            + ", ".join(sorted(present))
        )

    for column in ("year", "mileage_km", "price"):
        df[column] = pd.to_numeric(df[column], errors="coerce")

    for column in ("make", "model", "currency"):
        df[column] = df[column].astype("string").str.strip()

    df["currency"] = df["currency"].str.upper()
    df = df.dropna(subset=["make", "model", "year", "mileage_km", "price", "currency"])
    df = df[
        df["make"].ne("")
        & df["model"].ne("")
        & df["year"].between(1980, 2035)
        & df["mileage_km"].between(0, 1_000_000)
        & df["price"].gt(0)
    ]

    # MVP model is UZS-only; never silently combine USD and UZS.
    df = df[df["currency"].eq("UZS")].copy()
    if df.empty:
        raise ValueError("UZS valyutasida yaroqli qator topilmadi.")

    if "source_url" in df.columns:
        df = df.drop_duplicates(subset=["source_url"], keep="last")
    else:
        df = df.drop_duplicates()

    df["price_type"] = "asking_price"
    return df.reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Ruxsatli CSV fayl yo'li")
    parser.add_argument("--output", default="data/processed/cars_clean.csv")
    args = parser.parse_args()

    cleaned = validate_input(args.input)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(args.output, index=False)
    print(f"Tozalandi: {len(cleaned)} qator -> {args.output}")


if __name__ == "__main__":
    main()
