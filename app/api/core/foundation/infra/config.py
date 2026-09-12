import json
import os
from urllib.parse import quote_plus, urlparse, urlunparse

from dotenv import load_dotenv
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

_INSECURE_SECRET_KEYS = frozenset({"change-me-in-production", "secret", ""})


class Settings(BaseSettings):
    PROJECT_NAME: str = "Restorio API"
    PROJECT_DESCRIPTION: str = "Multi-tenant Restaurant Management Platform API"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    API_V1_PREFIX: str = "/api/v1"
    LOCAL_ORIGINS: list[str] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
    ]
    # Production subdomains (explicit for security)
    PRODUCTION_ORIGINS: list[str] = [
        "https://restorio.org",
        "https://www.restorio.org",
        "https://api.restorio.org",
        "https://admin.restorio.org",
        "https://kitchen.restorio.org",
        "https://waiter.restorio.org",
        "https://order.restorio.org",
        "https://mobile.restorio.org",
    ]

    CORS_ALLOW_CF_PAGES_PREVIEWS: bool = False

    TRUST_PROXY_HEADERS: bool = False
    _env = os.getenv("ENV", "development")
    if _env in ("local", "development"):
        CORS_ORIGINS: list[str] = LOCAL_ORIGINS
    elif _env == "production":
        CORS_ORIGINS: list[str] = PRODUCTION_ORIGINS
    else:
        CORS_ORIGINS: list[str] = LOCAL_ORIGINS

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",")]
        return v

    DATABASE_URL: str = "mongodb://localhost:27017/restorio"
    DATABASE_NAME: str = "restorio"
    MONGODB_USERNAME: str = ""
    MONGODB_PASSWORD: str = ""

    POSTGRES_DSN: str = "postgresql://restorio:restorio@localhost:5432/restorio"

    REDIS_URL: str = "redis://localhost:6379/0"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    API_BASE_URL: str = ""
    WAITER_PANEL_URL: str = "http://localhost:3004"
    MOBILE_APP_URL: str = "http://localhost:3003"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_PUBLIC_ENDPOINT: str = "localhost:9000"
    MINIO_PUBLIC_SECURE: bool = False
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "restorio-media"
    MINIO_REGION: str = "eu-central-1"
    MINIO_SECURE: bool = False
    MINIO_PRESIGN_EXPIRY_SECONDS: int = 900
    TENANT_LOGO_MAX_BYTES: int = 5 * 1024 * 1024
    TENANT_MENU_IMAGE_MAX_BYTES: int = 5 * 1024 * 1024

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    ACCESS_TOKEN_COOKIE_NAME: str = "rat"
    REFRESH_TOKEN_COOKIE_NAME: str = "rrt"
    SESSION_HINT_COOKIE: str = "rshc"

    # Przelewy24 (values from .env)
    PRZELEWY24_MERCHANT_ID: int = 0
    PRZELEWY24_POS_ID: int = 0

    @field_validator("PRZELEWY24_MERCHANT_ID", "PRZELEWY24_POS_ID", mode="before")
    @classmethod
    def parse_przelewy24_int(cls, v: str | int) -> int:
        if isinstance(v, int):
            return v
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0

    PRZELEWY24_CRC: str = ""
    PRZELEWY24_API_KEY: str = ""
    PRZELEWY24_API_URL: str = "https://sandbox.przelewy24.pl/api/v1"

    @model_validator(mode="after")
    def _inject_mongodb_credentials(self) -> "Settings":
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            parsed = urlparse(self.DATABASE_URL)
            safe_user = quote_plus(self.MONGODB_USERNAME)
            safe_pass = quote_plus(self.MONGODB_PASSWORD)
            netloc = f"{safe_user}:{safe_pass}@{parsed.hostname or ''}:{parsed.port or 27017}"
            self.DATABASE_URL = urlunparse(
                (
                    parsed.scheme,
                    netloc,
                    parsed.path or "/restorio",
                    parsed.params,
                    parsed.query,
                    parsed.fragment,
                )
            )
        return self

    @model_validator(mode="after")
    def _reject_insecure_production_secrets(self) -> "Settings":
        env_mode = os.getenv("ENV") or os.getenv("NODE_ENV") or "development"
        if env_mode == "production" and self.SECRET_KEY in _INSECURE_SECRET_KEYS:
            msg = (
                "FATAL: SECRET_KEY is set to an insecure default. "
                "Set a strong, unique SECRET_KEY environment variable before running in production."
            )
            raise ValueError(msg)
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
