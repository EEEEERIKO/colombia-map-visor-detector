from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import detection, health, images, map_validation
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Scaffold for Colombia map vision detection.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(detection.router, prefix=settings.api_prefix)
app.include_router(map_validation.router, prefix=settings.api_prefix)
app.include_router(images.router, prefix=settings.api_prefix)
