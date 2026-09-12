from __future__ import annotations

from contextlib import suppress
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


class TenantMobileFaviconStorageService:
    _ALLOWED_CONTENT_TYPES: ClassVar[set[str]] = {
        "image/x-icon",
        "image/vnd.microsoft.icon",
    }
    _ALLOWED_SIZES: ClassVar[set[tuple[int, int]]] = {
        (16, 16),
        (32, 32),
        (64, 64),
        (128, 128),
    }
    _MAX_BYTES: ClassVar[int] = 512 * 1024
    _TEMP_PREFIX: ClassVar[str] = "tmp/tenant-mobile-favicons"
    _FINAL_PREFIX: ClassVar[str] = "tenant-mobile-favicons"
    _PRESIGN_WINDOW_SECONDS: ClassVar[int] = 60
    _PRESIGN_MAX_REQUESTS: ClassVar[int] = 10
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
        invalid_type_message = "Favicon must be an ICO image"
        storage_unavailable_message = "Object storage is unavailable"

        if content_type not in self._ALLOWED_CONTENT_TYPES:
            raise BadRequestError(invalid_type_message)

        self._enforce_presign_rate_limit(tenant_id)
        self._ensure_bucket()

        object_key = f"{self._TEMP_PREFIX}/{tenant_id}/{uuid4().hex}.ico"

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
        too_many_requests_message = "Too many favicon upload requests. Please try again later."
        now = time()
        window_start = now - self._PRESIGN_WINDOW_SECONDS

        key = str(tenant_id)
        timestamps = self._presign_usage.get(key, [])
        filtered = [ts for ts in timestamps if ts >= window_start]

        if len(filtered) >= self._PRESIGN_MAX_REQUESTS:
            raise TooManyRequestsError(too_many_requests_message)

        filtered.append(now)
        self._presign_usage[key] = filtered

    def finalize_upload(self, tenant_id: UUID, object_key: str) -> str:
        invalid_object_message = "Favicon upload key is invalid"
        invalid_image_message = "Uploaded file is not a valid ICO image"
        invalid_size_message = "Favicon must be 16x16, 32x32, 64x64, or 128x128 pixels"
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
            with Image.open(BytesIO(content)) as image:
                if image.format != "ICO":
                    raise BadRequestError(invalid_image_message)
                n_frames = getattr(image, "n_frames", 1)
                has_allowed = False
                for frame in range(n_frames):
                    image.seek(frame)
                    if image.size in self._ALLOWED_SIZES:
                        has_allowed = True
                        break
                if not has_allowed:
                    raise BadRequestError(invalid_size_message)
                output_bytes = content
        except UnidentifiedImageError as exc:
            raise BadRequestError(invalid_image_message) from exc
        except OSError as exc:
            raise BadRequestError(invalid_image_message) from exc
        finally:
            with suppress(Exception):
                self._internal_client.remove_object(settings.MINIO_BUCKET, object_key)

        final_key = f"{self._FINAL_PREFIX}/{tenant_id}/favicon.ico"

        try:
            self._internal_client.put_object(
                settings.MINIO_BUCKET,
                final_key,
                BytesIO(output_bytes),
                len(output_bytes),
                content_type="image/x-icon",
            )
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

        return final_key

    def get_object_stream(self, object_key: str):
        storage_unavailable_message = "Object storage is unavailable"

        try:
            return self._internal_client.get_object(settings.MINIO_BUCKET, object_key)
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

    def stat_object(self, object_key: str) -> int:
        storage_unavailable_message = "Object storage is unavailable"

        try:
            stat = self._internal_client.stat_object(settings.MINIO_BUCKET, object_key)

            return int(stat.size)
        except Exception as exc:
            raise ServiceUnavailableError(storage_unavailable_message) from exc

    def _read_uploaded_object(self, object_key: str) -> bytes:
        file_too_large_message = "Favicon file is too large"
        response = None

        try:
            stat = self._internal_client.stat_object(settings.MINIO_BUCKET, object_key)
            if stat.size > self._MAX_BYTES:
                raise BadRequestError(file_too_large_message)

            response = self._internal_client.get_object(settings.MINIO_BUCKET, object_key)

            return response.read()
        finally:
            if response is not None:
                response.close()
                response.release_conn()

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

    def build_public_url(self, object_key: str) -> str:
        scheme = "https" if settings.MINIO_PUBLIC_SECURE else "http"

        return f"{scheme}://{settings.MINIO_PUBLIC_ENDPOINT}/{settings.MINIO_BUCKET}/{quote(object_key, safe='/')}"


tenant_mobile_favicon_storage_service = TenantMobileFaviconStorageService()
