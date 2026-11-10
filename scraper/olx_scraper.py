"""Marketplace scraping is intentionally disabled until written permission exists.

OLX.uz and Avtoelon.uz terms restrict automated extraction. Do not enable a
crawler, browser automation, proxy rotation, or CAPTCHA bypass. Once a source
owner grants written permission, implement a source-specific connector only
within the scope and rate limits of that permission.

For now, use the licensed CSV import workflow:
    python -m ml.clean_dataset --input data/raw/listings.csv
"""
raise SystemExit(
    "Scraping disabled: obtain written permission or a licensed data feed, "
    "then use the CSV ingestion workflow."
)
