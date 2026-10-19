from functools import lru_cache

from app.core.config import get_settings
from app.services.detection_service import DetectionService
from app.services.image_service import ImageService


@lru_cache
def get_detection_service() -> DetectionService:
    return DetectionService()


@lru_cache
def get_image_service() -> ImageService:
    return ImageService(get_settings())
