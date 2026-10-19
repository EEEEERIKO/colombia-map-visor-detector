from app.models.schemas import DetectionResult, MapValidationRequest, MapValidationResult
from app.vision.region_detector import RegionDetector
from app.vision.silhouette_validator import SilhouetteValidator


class DetectionService:
    def __init__(
        self,
        region_detector: RegionDetector | None = None,
        silhouette_validator: SilhouetteValidator | None = None,
    ) -> None:
        self.region_detector = region_detector or RegionDetector()
        self.silhouette_validator = silhouette_validator or SilhouetteValidator()

    def detect_image(self, image: bytes) -> DetectionResult:
        del image
        raise NotImplementedError("Detection engine is not implemented yet.")

    def validate_map(self, request: MapValidationRequest) -> MapValidationResult:
        del request
        raise NotImplementedError("Map validation is not implemented yet.")
