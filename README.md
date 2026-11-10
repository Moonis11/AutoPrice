# AutoPrice

AI-assisted used-car price estimation for Uzbekistan.

## Goal
Help buyers and sellers estimate a used car's market asking-price range using comparable listings and vehicle attributes.

## Current MVP architecture
- Python + Pandas for data ingestion and cleaning
- scikit-learn baseline model
- FastAPI backend
- PostgreSQL planned for persistent listings and valuation history
- Next.js frontend planned as the next product phase

## Data access: important
AutoPrice does **not** scrape OLX.uz or Avtoelon.uz by default. Their published terms restrict automated extraction and/or require written permission. Use a licensed feed, a written data-sharing agreement, a partner-provided inventory export, or user-submitted data with consent. See [data source policy](docs/data_policy.md).

Do not bypass CAPTCHAs, authentication, rate limits, or anti-bot protections. Do not collect seller contact details for the valuation dataset.

## Quick start
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Open http://127.0.0.1:8000/docs.

## Prepare a permitted dataset
Use the header template in `data/template.csv`. Required columns:
`make, model, year, mileage_km, price, currency`.
Optional columns include transmission, fuel_type, region, condition, source, source_url and collected_at.

The current baseline pipeline accepts UZS rows only:
```bash
python -m ml.ingest_csv --input data/raw/listings.csv --output data/processed/cars_clean.csv
python -m ml.train_model --input data/processed/cars_clean.csv --model models/price_model.joblib
```
At least 50 real rows are required by the baseline script; a substantially larger, representative dataset is recommended. Asking prices are not confirmed sale prices. Do not mix currencies without a dated, documented exchange rate.

## Run API
```bash
uvicorn backend.main:app --reload
```
- `GET /health`
- `POST /api/v1/valuation`

The API returns a clear unavailable response until a trained model exists. Do not treat this MVP as a production valuation service.

## Tests
```bash
pytest -q
```
GitHub Actions runs tests on pushes and pull requests.
