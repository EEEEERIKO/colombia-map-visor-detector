from app.models.schemas import DetectedRegion


class RegionDetector:
    def detect(self, image: object) -> list[DetectedRegion]:
        raise NotImplementedError("Region detection is not implemented yet.")
