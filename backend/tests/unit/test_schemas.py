import pytest
from app.models.schemas import BoundingBox, DetectedRegion, RegionId
from pydantic import ValidationError


def test_region_ids_are_stable() -> None:
    assert [region.value for region in RegionId] == [
        "caribe",
        "andina",
        "pacifica",
        "orinoquia",
        "amazonia",
    ]


def test_invalid_confidence_is_rejected() -> None:
    with pytest.raises(ValidationError):
        DetectedRegion(
            region_id=RegionId.CARIBE,
            bounding_box=BoundingBox(x=0, y=0, width=1, height=1),
            confidence=2,
        )
