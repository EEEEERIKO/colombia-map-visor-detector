from __future__ import annotations

import io
import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

import cv2
import numpy as np
from app.core.config import Settings
from app.models.schemas import (
    CalibrationMetadata,
    CapturedImage,
    CaptureSource,
    ImageMetadata,
    ProcessedImage,
    ProcessingParameters,
    ReferenceTarget,
    RegionId,
    TargetId,
    TargetType,
)
from PIL import Image, ImageOps, UnidentifiedImageError

SUPPORTED_FORMATS = {"JPEG": "JPEG", "PNG": "PNG", "WEBP": "WEBP"}
TARGETS = (
    ReferenceTarget(
        target_id=TargetId.COLOMBIA_COMPLETA,
        target_type=TargetType.MAP,
        image_path="/assets/targets/full-map.png",
        width=1623,
        height=2000,
        version="1",
    ),
    ReferenceTarget(
        target_id=TargetId.REGION_CARIBE,
        target_type=TargetType.REGION,
        region_id=RegionId.CARIBE,
        image_path="/assets/targets/caribean-region.png",
        width=1297,
        height=1200,
        version="1",
    ),
    ReferenceTarget(
        target_id=TargetId.REGION_ANDINA,
        target_type=TargetType.REGION,
        region_id=RegionId.ANDINA,
        image_path="/assets/targets/andes-region.png",
        width=709,
        height=1200,
        version="1",
    ),
    ReferenceTarget(
        target_id=TargetId.REGION_PACIFICA,
        target_type=TargetType.REGION,
        region_id=RegionId.PACIFICA,
        image_path="/assets/targets/pacific-region.png",
        width=633,
        height=1200,
        version="1",
    ),
    ReferenceTarget(
        target_id=TargetId.REGION_ORINOQUIA,
        target_type=TargetType.REGION,
        region_id=RegionId.ORINOQUIA,
        image_path="/assets/targets/orinoquia-region.png",
        width=1361,
        height=1200,
        version="1",
    ),
    ReferenceTarget(
        target_id=TargetId.REGION_AMAZONIA,
        target_type=TargetType.REGION,
        region_id=RegionId.AMAZONIA,
        image_path="/assets/targets/amazonas-region.png",
        width=1399,
        height=1200,
        version="1",
    ),
)


class ImageValidationError(ValueError):
    pass


class ImageService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.storage_dir = Path(settings.capture_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def decode(self, content: bytes) -> tuple[np.ndarray, ImageMetadata]:
        if not content:
            raise ImageValidationError("The uploaded file is empty.")
        if len(content) > self.settings.max_image_upload_size_bytes:
            raise ImageValidationError("The image exceeds the configured upload-size limit.")
        try:
            with Image.open(io.BytesIO(content)) as image:
                image_format = image.format or ""
                if image_format not in SUPPORTED_FORMATS:
                    raise ImageValidationError("Unsupported image format. Use PNG, JPEG, or WebP.")
                image = ImageOps.exif_transpose(image).convert("RGB")
                width, height = image.size
                if width * height > self.settings.max_image_pixels:
                    raise ImageValidationError(
                        "The image exceeds the configured pixel-dimension limit."
                    )
                array = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR)
                return array, ImageMetadata(
                    width=width, height=height, format=image_format, byte_size=len(content)
                )
        except UnidentifiedImageError as exc:
            raise ImageValidationError("The file is not a valid decodable image.") from exc

    def process(
        self, content: bytes, parameters: ProcessingParameters, source_capture_id: str | None = None
    ) -> tuple[bytes, ProcessedImage]:
        image, original = self.decode(content)
        transformations: list[str] = ["orientation_normalized"]
        if parameters.perspective_points is not None:
            image = self._rectify(image, parameters.perspective_points)
            transformations.append("perspective_rectified")
        if parameters.width or parameters.height:
            image = self._resize(
                image, parameters.width, parameters.height, parameters.allow_upscale
            )
            transformations.append("resized")
        if parameters.brightness or parameters.contrast != 1:
            image = self._adjust(image, parameters.brightness, parameters.contrast)
            transformations.append("brightness_contrast_adjusted")
        output_format = parameters.output_format.upper()
        if output_format not in SUPPORTED_FORMATS:
            raise ImageValidationError("Unsupported output format. Use PNG, JPEG, or WebP.")
        success, encoded = cv2.imencode(f".{output_format.lower()}", image)
        if not success:
            raise ImageValidationError("The processed image could not be encoded.")
        height, width = image.shape[:2]
        metadata = ImageMetadata(
            width=width, height=height, format=output_format, byte_size=int(encoded.nbytes)
        )
        processed = ProcessedImage(
            source_capture_id=source_capture_id,
            metadata=metadata,
            transformations=transformations,
            parameters=parameters,
            status="processed",
        )
        return encoded.tobytes(), processed

    def save_capture(
        self,
        content: bytes,
        source: CaptureSource,
        target_id: TargetId | None,
        calibration: CalibrationMetadata | None,
        notes: str | None,
    ) -> CapturedImage:
        _, metadata = self.decode(content)
        capture_id = str(uuid.uuid4())
        image_path = self.storage_dir / f"{capture_id}.original"
        metadata_path = self.storage_dir / f"{capture_id}.json"
        image_path.write_bytes(content)
        capture = CapturedImage(
            capture_id=capture_id,
            associated_target_id=target_id,
            original=metadata,
            source=source,
            captured_at=datetime.now(UTC),
            calibration=calibration,
            notes=notes,
            original_path=str(image_path),
        )
        metadata_path.write_text(capture.model_dump_json(indent=2))
        return capture

    def list_captures(self, target_id: TargetId | None = None) -> list[CapturedImage]:
        captures: list[CapturedImage] = []
        for path in sorted(self.storage_dir.glob("*.json")):
            capture = CapturedImage.model_validate(json.loads(path.read_text()))
            if target_id is None or capture.associated_target_id == target_id:
                captures.append(capture)
        return captures

    @staticmethod
    def _resize(
        image: np.ndarray, width: int | None, height: int | None, allow_upscale: bool
    ) -> np.ndarray:
        original_height, original_width = image.shape[:2]
        if width is None and height is None:
            return image.copy()
        scale = (width / original_width) if width else (height / original_height)
        if not allow_upscale:
            scale = min(scale, 1)
        new_size = (max(1, round(original_width * scale)), max(1, round(original_height * scale)))
        return cv2.resize(
            image, new_size, interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR
        )

    @staticmethod
    def _adjust(image: np.ndarray, brightness: float, contrast: float) -> np.ndarray:
        return cv2.convertScaleAbs(image, alpha=contrast, beta=brightness)

    @staticmethod
    def _rectify(image: np.ndarray, points: list[tuple[float, float]]) -> np.ndarray:
        if len(points) != 4 or not np.isfinite(points).all():
            raise ImageValidationError("Perspective correction requires four finite points.")
        source = np.asarray(points, dtype=np.float32)
        if len(np.unique(source, axis=0)) != 4:
            raise ImageValidationError("Perspective points must be distinct.")
        if cv2.contourArea(source) <= 1:
            raise ImageValidationError(
                "Perspective points must form a non-degenerate quadrilateral."
            )
        ordered = ImageService._order_points(source)
        width = max(
            np.linalg.norm(ordered[1] - ordered[0]), np.linalg.norm(ordered[2] - ordered[3])
        )
        height = max(
            np.linalg.norm(ordered[3] - ordered[0]), np.linalg.norm(ordered[2] - ordered[1])
        )
        if width < 2 or height < 2:
            raise ImageValidationError("Perspective quadrilateral is too small.")
        destination = np.array(
            [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], dtype=np.float32
        )
        return cv2.warpPerspective(
            image, cv2.getPerspectiveTransform(ordered, destination), (round(width), round(height))
        )

    @staticmethod
    def _order_points(points: np.ndarray) -> np.ndarray:
        sums, differences = points.sum(axis=1), np.diff(points, axis=1).ravel()
        return np.array(
            [
                points[np.argmin(sums)],
                points[np.argmin(differences)],
                points[np.argmax(sums)],
                points[np.argmax(differences)],
            ],
            dtype=np.float32,
        )


def get_targets() -> list[ReferenceTarget]:
    return list(TARGETS)
