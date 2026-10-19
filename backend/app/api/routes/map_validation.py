from app.dependencies import get_detection_service
from app.models.schemas import ErrorResponse, MapValidationRequest, MapValidationResult
from app.services.detection_service import DetectionService
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/map", tags=["map-validation"])


@router.post(
    "/validate", response_model=MapValidationResult, responses={501: {"model": ErrorResponse}}
)
def validate_map(
    request: MapValidationRequest, service: DetectionService = Depends(get_detection_service)
) -> MapValidationResult:
    try:
        return service.validate_map(request)
    except NotImplementedError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
