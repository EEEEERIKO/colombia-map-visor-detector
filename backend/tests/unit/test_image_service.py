import io

import cv2
import numpy as np
import pytest
from app.core.config import Settings
from app.models.schemas import ProcessingParameters
from app.services.image_service import ImageService, ImageValidationError
from PIL import Image


def png_bytes(width: int = 20, height: int = 10) -> bytes:
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[:, : width // 2] = (10, 80, 200)
    success, encoded = cv2.imencode(".png", image)
    assert success
    return encoded.tobytes()


@pytest.fixture
def service(tmp_path):
    return ImageService(
        Settings(
            capture_storage_dir=str(tmp_path),
            max_image_upload_size_bytes=100_000,
            max_image_pixels=10_000,
        )
    )


def test_decode_metadata_and_supported_formats(service):
    image, metadata = service.decode(png_bytes())
    assert image.shape == (10, 20, 3)
    assert metadata.format == "PNG"


def test_corrupt_and_limits_are_rejected(service):
    with pytest.raises(ImageValidationError):
        service.decode(b"not an image")
    with pytest.raises(ImageValidationError):
        service.decode(b"x" * 100_001)
    large = Image.new("RGB", (101, 101))
    output = io.BytesIO()
    large.save(output, format="PNG")
    with pytest.raises(ImageValidationError, match="pixel"):
        service.decode(output.getvalue())


def test_resize_adjustment_and_original_preservation(service):
    original = png_bytes()
    processed_bytes, result = service.process(
        original, ProcessingParameters(width=10, brightness=20, contrast=1.5)
    )
    assert processed_bytes != original
    assert (result.metadata.width, result.metadata.height) == (10, 5)
    assert "resized" in result.transformations


def test_valid_and_invalid_perspective(service):
    _, result = service.process(
        png_bytes(100, 100),
        ProcessingParameters(perspective_points=[(5, 5), (90, 5), (90, 90), (5, 90)]),
    )
    assert result.metadata.width > 80
    with pytest.raises(ImageValidationError):
        service.process(
            png_bytes(), ProcessingParameters(perspective_points=[(0, 0), (1, 1), (2, 2), (3, 3)])
        )


def test_capture_persistence_and_filter(service):
    capture = service.save_capture(png_bytes(), "upload", "region-caribe", None, "frontal")
    assert service.list_captures("region-caribe")[0].capture_id == capture.capture_id
    assert service.list_captures("region-andina") == []
