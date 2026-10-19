import json

from app.dependencies import get_image_service
from app.models.schemas import (
    CalibrationMetadata,
    CapturedImage,
    CaptureSource,
    ProcessedImage,
    ProcessingParameters,
    ReferenceTarget,
    TargetId,
)
from app.services.image_service import ImageService, ImageValidationError, get_targets
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

router = APIRouter(prefix="/images", tags=["image-acquisition"])


def _bad_request(exc: Exception) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.get("/targets", response_model=list[ReferenceTarget])
def targets() -> list[ReferenceTarget]:
    return get_targets()


@router.post("/process", response_model=ProcessedImage)
async def process_image(
    file: UploadFile = File(...),
    parameters: str = Form("{}"),
    service: ImageService = Depends(get_image_service),
) -> ProcessedImage:
    try:
        parsed = ProcessingParameters.model_validate(json.loads(parameters))
        _, result = service.process(await file.read(), parsed)
        return result
    except (json.JSONDecodeError, ValueError, ImageValidationError) as exc:
        raise _bad_request(exc) from exc


@router.post("/process/content")
async def process_image_content(
    file: UploadFile = File(...),
    parameters: str = Form("{}"),
    service: ImageService = Depends(get_image_service),
) -> Response:
    try:
        parsed = ProcessingParameters.model_validate(json.loads(parameters))
        content, result = service.process(await file.read(), parsed)
        media_type = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}[
            result.metadata.format
        ]
        return Response(
            content=content,
            media_type=media_type,
            headers={"X-Processed-Metadata": result.model_dump_json()},
        )
    except (json.JSONDecodeError, ValueError, ImageValidationError) as exc:
        raise _bad_request(exc) from exc


@router.post("/captures", response_model=CapturedImage, status_code=status.HTTP_201_CREATED)
async def save_capture(
    file: UploadFile = File(...),
    source: CaptureSource = Form(CaptureSource.UPLOAD),
    target_id: TargetId | None = Form(None),
    calibration: str | None = Form(None),
    notes: str | None = Form(None),
    service: ImageService = Depends(get_image_service),
) -> CapturedImage:
    try:
        calibration_data = (
            CalibrationMetadata.model_validate_json(calibration) if calibration else None
        )
        return service.save_capture(await file.read(), source, target_id, calibration_data, notes)
    except (ValueError, ImageValidationError) as exc:
        raise _bad_request(exc) from exc


@router.get("/captures", response_model=list[CapturedImage])
def captures(
    target_id: TargetId | None = Query(None), service: ImageService = Depends(get_image_service)
) -> list[CapturedImage]:
    return service.list_captures(target_id)
