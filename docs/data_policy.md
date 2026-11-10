# Data source policy

AutoPrice must only process data that the project has permission to use.

## Not permitted by default
- Automated scraping, crawling, browser automation or extraction from OLX.uz.
- Automated extraction, copying or reuse of Avtoelon.uz listings.
- CAPTCHA, login, rate-limit or anti-bot circumvention.
- Collection of seller phone numbers, emails or other personal contact details.

The published marketplace terms require permission for automated extraction; check the current terms directly before any integration:
- OLX.uz: https://help.olx.uz/olxuzhelp/s/article/olxuz-tos-november-2026-update-uz
- Avtoelon.uz: https://avtoelon.uz/uz/content/articles/agreement/

## Acceptable MVP sources
1. A written data-sharing agreement or licensed feed from a marketplace.
2. Dealer/partner inventory supplied under a signed agreement.
3. Vehicle owners who explicitly submit their own listing/vehicle details with clear consent.
4. A dataset whose licence expressly permits this commercial use and ML training.

## Minimum metadata
Keep source, collection date, currency, price type (asking vs transaction), and permission/licence reference. Do not store personal contact details in the modelling table.

## Quality controls
- Separate asking prices from completed transaction prices.
- Keep UZS and USD separate unless converted using a dated, documented FX rate.
- Deduplicate listings.
- Record missing values and data provenance.
- Never present synthetic test data as real market data.
