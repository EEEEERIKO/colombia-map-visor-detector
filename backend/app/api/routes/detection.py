from app.dependencies import get_detection_service
from app.models.schemas import DetectionResult, ErrorResponse, RegionId
from app.services.detection_service import DetectionService
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

router = APIRouter(prefix="/detection", tags=["detection"])


@router.post("/image", response_model=DetectionResult, responses={501: {"model": ErrorResponse}})
async def detect_image(
    file: UploadFile = File(...), service: DetectionService = Depends(get_detection_service)
) -> DetectionResult:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="An image upload is required."
        )
    try:
        return service.detect_image(await file.read())
    except NotImplementedError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc


@router.get("/regions", response_model=list[str])
def regions() -> list[str]:
    return [region.value for region in RegionId]
