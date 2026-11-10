# AutoPrice

AI-assisted used-car price estimation for Uzbekistan.

## MVP scope
- Responsive Uzbek-language car valuation form (Next.js).
- FastAPI endpoint for indicative used-car asking-price estimates.
- CSV import and cleaning for licensed/user-submitted datasets.
- scikit-learn baseline model with holdout evaluation and an empirical uncertainty band.
- GitHub Actions test workflow.

## Stack
- Python 3.11+, Pandas, scikit-learn, FastAPI
- Next.js 16, React, TypeScript
- PostgreSQL planned for persistence in the next backend phase

## Data access policy
AutoPrice does **not** scrape OLX.uz or Avtoelon.uz by default. Their published terms restrict automated extraction and/or require written permission. Use a licensed feed, written data-sharing agreement, partner-provided inventory export, or user-submitted data with consent. Read [the data-source policy](docs/data_policy.md).

Do not bypass CAPTCHAs, authentication, rate limits, or anti-bot protections. Do not collect seller contact details in the valuation dataset.

## Run locally

### Backend
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

### Frontend
Use Node.js 20.9 or newer:
```bash
npm install
cp .env.local.example .env.local
npm run dev
```
Open http://localhost:3000. The frontend expects the backend at `http://localhost:8000` by default.

## Prepare a permitted dataset
Start with `data/template.csv`. Required columns:
`make, model, year, mileage_km, price, currency`.
Optional columns: transmission, fuel_type, region, condition, source, source_url, collected_at.

The baseline pipeline accepts UZS rows only:
```bash
python -m ml.ingest_csv --input data/raw/listings.csv --output data/processed/cars_clean.csv
python -m ml.train_model --input data/processed/cars_clean.csv --model models/price_model.joblib
```
At least 50 real rows are required by the baseline script; a substantially larger and representative dataset is strongly recommended. The model is not trained until a real permitted dataset is supplied.

## API
- `GET /health`
- `POST /api/v1/valuation`

Set `CORS_ORIGINS` to the frontend origin when deploying the API. Set `NEXT_PUBLIC_API_URL` in the frontend deployment to the public API base URL.

## Tests
```bash
pytest -q
```
GitHub Actions runs the Python tests on pushes and pull requests. Frontend build verification is a separate next step.
