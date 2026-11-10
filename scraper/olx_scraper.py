"""Conservative OLX parser starter. Use only if current site rules permit it."""
from __future__ import annotations

import argparse
import csv
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urljoin
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

BASE = "https://www.olx.uz"
UA = "AutoPriceResearchBot/0.1"
PRICE_RE = re.compile(r"([\d\s.,]+)\s*(so['’]?m|сум|у\.е\.|\$)", re.I)
YEAR_RE = re.compile(r"\b(19\d{2}|20[0-3]\d)\b")
KM_RE = re.compile(r"([\d\s]+)\s*(?:km|км)\b", re.I)


def allowed(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        response = requests.get(robots_url, headers={"User-Agent": UA}, timeout=15)
        if response.status_code != 200:
            return False
        parser = RobotFileParser()
        parser.parse(response.text.splitlines())
        return parser.can_fetch(UA, url)
    except requests.RequestException:
        return False


def number(value: str) -> int | None:
    digits = re.sub(r"\D", "", value or "")
    return int(digits) if digits else None


def parse_card(card: BeautifulSoup) -> dict:
    text = card.get_text(" | ", strip=True)
    link = card.select_one("a[href]")
    title_node = card.select_one("h4, h6, h3")
    price_match = PRICE_RE.search(text)
    year_match = YEAR_RE.search(text)
    km_match = KM_RE.search(text)
    currency = None
    price = None
    if price_match:
        price = number(price_match.group(1))
        token = price_match.group(2).lower()
        currency = "USD" if "$" in token or "у.е." in token else "UZS"
    return {
        "title": title_node.get_text(" ", strip=True) if title_node else None,
        "price": price,
        "currency": currency,
        "year": int(year_match.group(1)) if year_match else None,
        "mileage_km": number(km_match.group(1)) if km_match else None,
        "source": "olx.uz",
        "source_url": urljoin(BASE, link["href"]) if link else None,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "price_type": "asking_price",
    }


def scrape(url: str, pages: int = 1, delay: float = 5.0) -> list[dict]:
    if urlparse(url).netloc not in {"olx.uz", "www.olx.uz"}:
        raise ValueError("Faqat olx.uz URL manzili qabul qilinadi.")
    session = requests.Session()
    session.headers.update({"User-Agent": UA, "Accept-Language": "uz,ru;q=0.8,en;q=0.6"})
    output, seen = [], set()
    for page in range(1, max(1, pages) + 1):
        if not allowed(url):
            print("robots.txt ruxsat bermadi yoki tekshirilmadi. Scraping to'xtatildi.")
            break
        try:
            response = session.get(url, params={"page": page}, timeout=20)
            if response.status_code in (403, 429):
                print(f"HTTP {response.status_code}: to'xtatildi; himoyani aylanib o'tmang.")
                break
            response.raise_for_status()
        except requests.RequestException as exc:
            print(f"So'rov xatosi: {exc}")
            break
        soup = BeautifulSoup(response.text, "html.parser")
        cards = soup.select('[data-cy="l-card"]')
        if not cards:
            print("E'lon kartalari topilmadi; sayt HTML tuzilmasi o'zgargan bo'lishi mumkin.")
            break
        for card in cards:
            row = parse_card(card)
            key = row["source_url"]
            if key and key not in seen:
                seen.add(key)
                output.append(row)
        print(f"{page}-sahifa: {len(cards)} karta, jami {len(output)} noyob e'lon")
        time.sleep(max(5.0, delay))
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--pages", type=int, default=1)
    parser.add_argument("--output", default="data/raw/olx_listings.csv")
    args = parser.parse_args()
    rows = scrape(args.url, args.pages)
    if not rows:
        print("E'lonlar topilmadi; CSV yaratilmadi.")
        return
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} qator saqlandi: {path}")


if __name__ == "__main__":
    main()
