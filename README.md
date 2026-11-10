# AutoPrice

AI-assisted used-car price estimation for Uzbekistan.

## Goal
Help buyers and sellers estimate a used car's market asking-price range using comparable listings and vehicle attributes.

## Planned stack
- Python, Pandas, scikit-learn
- FastAPI backend
- PostgreSQL for listings and valuation history
- Next.js frontend (planned)

## Important data principles
- Listing prices are asking prices, not confirmed sale prices.
- Keep currency codes and dated exchange rates; never mix currencies silently.
- Use only lawfully accessible data and respect each marketplace's Terms of Service, robots.txt, rate limits, and technical restrictions.
- Never bypass CAPTCHAs, authentication, or anti-bot protections.
- Do not use synthetic records as real market data.

## Current status
This repository is the project foundation. A model is not production-ready until it has been trained on a sufficiently large, permitted local dataset and evaluated on held-out data.
