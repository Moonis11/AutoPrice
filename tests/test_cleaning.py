from ml.clean_dataset import clean_dataset


def test_clean_dataset_keeps_only_valid_uzs_rows(tmp_path):
    source = tmp_path / "input.csv"
    target = tmp_path / "clean.csv"
    source.write_text(
        "price,year,mileage_km,currency,source_url\n"
        "120000000,2021,50000,UZS,https://example.test/1\n"
        "-10,2020,40000,UZS,https://example.test/2\n"
        "130000000,2022,60000,USD,https://example.test/3\n",
        encoding="utf-8",
    )
    result = clean_dataset(str(source), str(target))
    assert len(result) == 1
    assert result.iloc[0]["price"] == 120000000
