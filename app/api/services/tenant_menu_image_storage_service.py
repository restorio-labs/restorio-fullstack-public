from __future__ import annotations

from contextlib import suppress
from dataclasses import dataclass
from datetime import timedelta
from io import BytesIO
import json
from time import time
from typing import ClassVar
from urllib.parse import quote
from uuid import UUID, uuid4

from minio import Minio
from PIL import Image, UnidentifiedImageError

from core.exceptions import BadRequestError, ServiceUnavailableError, TooManyRequestsError
from core.foundation.infra.config import settings


@dataclass(frozen=True)
class FinalizedMenuItemImage:
    object_key: str
    public_url: str


class TenantMenuImageStorageService:
    _ALLOWED_CONTENT_TYPES: ClassVar[set[str]] = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }
    _ALLOWED_FORMATS: ClassVar[set[str]] = {"JPEG", "PNG", "WEBP"}
    _MIN_SQUARE_RATIO: ClassVar[float] = 0.95
    _MAX_PIXELS: ClassVar[int] = 16_000_000
    _TEMP_PREFIX: ClassVar[str] = "tmp/menu-items"
    _FINAL_PREFIX: ClassVar[str] = "menu-items"
    _PRESIGN_WINDOW_SECONDS: ClassVar[int] = 60
    _PRESIGN_MAX_REQUESTS: ClassVar[int] = 20
    _presign_usage: ClassVar[dict[str, list[float]]] = {}

    def __init__(self) -> None:
        self._internal_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
            region=settings.MINIO_REGION,
        )
        self._public_client = Minio(
            settings.MINIO_PUBLIC_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_PUBLIC_SECURE,
            region=settings.MINIO_REGION,
        )

    def create_presigned_upload(self, tenant_id: UUID, content_type: str) -> tuple[str, str]:
        invalid_type_message = "Menu image must be PNG, JPEG, or WEBP"
        storage_unavailable_message = "Object storage is unavailable"

        if content_type not in self._ALLOWED_CONTENT_TYPES:
            raise BadRequestError(invalid_type_message)

        self._enforce_presign_rate_limit(tenant_id)
        self._ensure_bucket()

        object_key = f"{self._TEMP_PREFIX}/{tenant_id}/{uuid4().hex}"

        try:
            upload_url = self._public_client.presigned_put_object(
                settings.MINIO_BUCKET,
                object_key,
                expires=timedelta(seconds=settings.MINIO_PRESIGN_EXPIRY_SECONDS),
            )
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

        return upload_url, object_key

    def _enforce_presign_rate_limit(self, tenant_id: UUID) -> None:
        too_many_requests_message = "Too many menu image upload requests. Please try again later."
        now = time()
        window_start = now - self._PRESIGN_WINDOW_SECONDS

        key = str(tenant_id)
        timestamps = self._presign_usage.get(key, [])
        filtered = [ts for ts in timestamps if ts >= window_start]

        if len(filtered) >= self._PRESIGN_MAX_REQUESTS:
            raise TooManyRequestsError(too_many_requests_message)

        filtered.append(now)
        self._presign_usage[key] = filtered

    def finalize_upload(self, tenant_id: UUID, object_key: str) -> FinalizedMenuItemImage:
        invalid_object_message = "Menu image upload key is invalid"
        storage_unavailable_message = "Object storage is unavailable"

        expected_prefix = f"{self._TEMP_PREFIX}/{tenant_id}/"
        if not object_key.startswith(expected_prefix):
            raise BadRequestError(invalid_object_message)

        self._ensure_bucket()

        try:
            content = self._read_uploaded_object(object_key)
        except Exception as exc:
            raise BadRequestError(invalid_object_message) from exc

        try:
            output, ext, content_type = self._normalize_image(content)
        finally:
            with suppress(Exception):
                self._internal_client.remove_object(settings.MINIO_BUCKET, object_key)

        final_key = f"{self._FINAL_PREFIX}/{tenant_id}/{uuid4().hex}.{ext}"
        output_bytes = output.getvalue()

        try:
            self._internal_client.put_object(
                settings.MINIO_BUCKET,
                final_key,
                BytesIO(output_bytes),
                len(output_bytes),
                content_type=content_type,
            )
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

        return FinalizedMenuItemImage(
            object_key=final_key,
            public_url=self._build_public_url(final_key),
        )

    def _read_uploaded_object(self, object_key: str) -> bytes:
        file_too_large_message = "Menu image file is too large"
        response = None

        try:
            stat = self._internal_client.stat_object(settings.MINIO_BUCKET, object_key)
            if stat.size > settings.TENANT_MENU_IMAGE_MAX_BYTES:
                raise BadRequestError(file_too_large_message)

            response = self._internal_client.get_object(settings.MINIO_BUCKET, object_key)

            return response.read()
        finally:
            if response is not None:
                response.close()
                response.release_conn()

    def _normalize_image(self, content: bytes) -> tuple[BytesIO, str, str]:
        invalid_type_message = "Menu image must be PNG, JPEG, or WEBP"
        invalid_image_message = "Uploaded file is not a valid image"
        too_large_dimensions_message = "Menu image dimensions are too large"
        aspect_message = (
            "Menu image must be square or nearly square (min side at least 95% of max side)"
        )

        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()

            with Image.open(BytesIO(content)) as image:
                if image.format not in self._ALLOWED_FORMATS:
                    raise BadRequestError(invalid_type_message)

                w, h = image.width, image.height
                if w * h > self._MAX_PIXELS:
                    raise BadRequestError(too_large_dimensions_message)

                ratio = min(w, h) / max(w, h)
                if ratio < self._MIN_SQUARE_RATIO:
                    raise BadRequestError(aspect_message)

                fmt = image.format or "PNG"
                if fmt == "JPEG":
                    ext = "jpg"
                    ct = "image/jpeg"
                    normalized = image.convert("RGB")
                    out = BytesIO()
                    normalized.save(out, format="JPEG", quality=90, optimize=True)
                elif fmt == "WEBP":
                    ext = "webp"
                    ct = "image/webp"
                    normalized = image.convert("RGBA")
                    out = BytesIO()
                    normalized.save(out, format="WEBP", quality=90)
                else:
                    ext = "png"
                    ct = "image/png"
                    normalized = image.convert("RGBA")
                    out = BytesIO()
                    normalized.save(out, format="PNG", optimize=True)

                out.seek(0)

                return out, ext, ct
        except UnidentifiedImageError as exc:
            raise BadRequestError(invalid_image_message) from exc
        except OSError as exc:
            raise BadRequestError(invalid_image_message) from exc

    def _ensure_bucket(self) -> None:
        storage_unavailable_message = "Object storage is unavailable"

        try:
            if not self._internal_client.bucket_exists(settings.MINIO_BUCKET):
                self._internal_client.make_bucket(settings.MINIO_BUCKET)

            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                        "Resource": f"arn:aws:s3:::{settings.MINIO_BUCKET}",
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": "s3:GetObject",
                        "Resource": [
                            f"arn:aws:s3:::{settings.MINIO_BUCKET}/tenant-logos/*",
                            f"arn:aws:s3:::{settings.MINIO_BUCKET}/tenant-mobile-favicons/*",
                            f"arn:aws:s3:::{settings.MINIO_BUCKET}/menu-items/*",
                        ],
                    },
                ],
            }
            self._internal_client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

    def _build_public_url(self, object_key: str) -> str:
        scheme = "https" if settings.MINIO_PUBLIC_SECURE else "http"

        return f"{scheme}://{settings.MINIO_PUBLIC_ENDPOINT}/{settings.MINIO_BUCKET}/{quote(object_key, safe='/')}"


tenant_menu_image_storage_service = TenantMenuImageStorageService()
