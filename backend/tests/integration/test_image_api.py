def test_target_catalog_has_six_targets(client):
    response = client.get("/api/v1/images/targets")
    assert response.status_code == 200
    targets = response.json()
    assert [target["target_id"] for target in targets] == [
        "colombia-completa",
        "region-caribe",
        "region-andina",
        "region-pacifica",
        "region-orinoquia",
        "region-amazonia",
    ]
    assert [(target["width"], target["height"]) for target in targets] == [
        (1623, 2000),
        (1297, 1200),
        (709, 1200),
        (633, 1200),
        (1361, 1200),
        (1399, 1200),
    ]


def test_invalid_image_is_rejected_by_ingestion(client):
    response = client.post(
        "/api/v1/images/process", files={"file": ("bad.png", b"bad", "image/png")}
    )
    assert response.status_code == 422
