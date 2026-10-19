def test_health(client) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["detection_engine"] == "not_implemented"


def test_invalid_image_upload(client) -> None:
    response = client.post(
        "/api/v1/detection/image", files={"file": ("notes.txt", b"text", "text/plain")}
    )
    assert response.status_code == 400


def test_image_endpoint_explicitly_reports_placeholder(client) -> None:
    response = client.post(
        "/api/v1/detection/image", files={"file": ("image.jpg", b"not-an-image", "image/jpeg")}
    )
    assert response.status_code == 501
