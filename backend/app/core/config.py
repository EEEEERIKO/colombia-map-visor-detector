from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Colombia Map Vision Detector"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    allowed_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "INFO"
    max_image_upload_size_bytes: int = 10 * 1024 * 1024
    max_image_pixels: int = 25_000_000
    capture_storage_dir: str = "data/captures"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        return (
            [item.strip() for item in value.split(",") if item.strip()]
            if isinstance(value, str)
            else value
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
