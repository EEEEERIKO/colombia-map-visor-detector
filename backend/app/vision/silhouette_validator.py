from app.models.schemas import DetectedRegion


class SilhouetteValidator:
    def validate(self, regions: list[DetectedRegion]) -> bool:
        raise NotImplementedError("Silhouette validation is not implemented yet.")
