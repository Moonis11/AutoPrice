import pandas as pd
import pytest

from ml.ingest_csv import validate_input


def test_validates_and_filters_to_uzs(tmp_path):
    path = tmp_path / "cars.csv"
    pd.DataFrame([
        {"make":"Chevrolet","model":"Cobalt","year":2021,"mileage_km":50000,"price":120000000,"currency":"UZS","source_url":"https://example.test/1"},
        {"make":"Chevrolet","model":"Onix","year":2022,"mileage_km":20000,"price":15000,"currency":"USD","source_url":"https://example.test/2"},
    ]).to_csv(path, index=False)

    result = validate_input(str(path))
    assert len(result) == 1
    assert result.iloc[0]["currency"] == "UZS"
    assert result.iloc[0]["price_type"] == "asking_price"


def test_rejects_personal_contact_columns(tmp_path):
    path = tmp_path / "cars.csv"
    pd.DataFrame([{
        "make":"Chevrolet","model":"Cobalt","year":2021,"mileage_km":50000,
        "price":120000000,"currency":"UZS","phone":"998901234567"
    }]).to_csv(path, index=False)

    with pytest.raises(ValueError, match="Shaxsiy aloqa"):
        validate_input(str(path))


def test_rejects_missing_required_columns(tmp_path):
    path = tmp_path / "cars.csv"
    path.write_text("make,model\nChevrolet,Cobalt\n", encoding="utf-8")
    with pytest.raises(ValueError, match="yetishmaydi"):
        validate_input(str(path))
