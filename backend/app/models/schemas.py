from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class RegionId(StrEnum):
    CARIBE = "caribe"
    ANDINA = "andina"
    PACIFICA = "pacifica"
    ORINOQUIA = "orinoquia"
    AMAZONIA = "amazonia"


class TargetType(StrEnum):
    MAP = "map"
    REGION = "region"


class TargetId(StrEnum):
    COLOMBIA_COMPLETA = "colombia-completa"
    REGION_CARIBE = "region-caribe"
    REGION_ANDINA = "region-andina"
    REGION_PACIFICA = "region-pacifica"
    REGION_ORINOQUIA = "region-orinoquia"
    REGION_AMAZONIA = "region-amazonia"


class CaptureSource(StrEnum):
    CAMERA = "camera"
    UPLOAD = "upload"


class ImageMetadata(BaseModel):
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    format: str
    byte_size: int = Field(ge=0)


class ReferenceTarget(BaseModel):
    target_id: TargetId
    target_type: TargetType
    region_id: RegionId | None = None
    image_path: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    version: str | None = None


class CalibrationMetadata(BaseModel):
    map_width_cm: float = Field(default=230, gt=0)
    map_height_cm: float = Field(default=250, gt=0)
    camera_distance_cm: float | None = Field(default=None, gt=0)
    camera_orientation: str | None = None
    lighting_conditions: str | None = None
    visibility: str | None = None
    quality_notes: str | None = None
    perspective_points: list[tuple[float, float]] | None = None


class ProcessingParameters(BaseModel):
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)
    allow_upscale: bool = False
    brightness: float = Field(default=0, ge=-100, le=100)
    contrast: float = Field(default=1, ge=0, le=3)
    perspective_points: list[tuple[float, float]] | None = None
    output_format: str = "PNG"


class ProcessedImage(BaseModel):
    source_capture_id: str | None = None
    metadata: ImageMetadata
    transformations: list[str] = Field(default_factory=list)
    parameters: ProcessingParameters
    status: str
    error: str | None = None


class CapturedImage(BaseModel):
    capture_id: str
    associated_target_id: TargetId | None = None
    original: ImageMetadata
    source: CaptureSource
    captured_at: datetime | None = None
    calibration: CalibrationMetadata | None = None
    processing_history: list[ProcessedImage] = Field(default_factory=list)
    notes: str | None = None
    original_path: str | None = None


class BoundingBox(BaseModel):
    x: float = Field(ge=0)
    y: float = Field(ge=0)
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class DetectedRegion(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    region_id: RegionId
    bounding_box: BoundingBox
    orientation_degrees: float | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)


class DetectionResult(BaseModel):
    status: str
    message: str
    regions: list[DetectedRegion] = Field(default_factory=list)
    missing_regions: list[RegionId] = Field(default_factory=list)
    duplicated_regions: list[RegionId] = Field(default_factory=list)


class MapValidationRequest(BaseModel):
    regions: list[DetectedRegion] = Field(default_factory=list)


class MapValidationResult(BaseModel):
    status: str
    complete: bool | None = None
    message: str
    feedback: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
    detection_engine: str


class ErrorResponse(BaseModel):
    detail: str
