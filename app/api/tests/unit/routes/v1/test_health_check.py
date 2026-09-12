from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from starlette import status

from routes.v1.health import health_check, liveness


@pytest.mark.asyncio
async def test_liveness_returns_200() -> None:
    r = await liveness()

    assert r.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_health_check_all_backends_ok() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    conn = MagicMock()
    conn.execute = AsyncMock()
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=conn)
    cm.__aexit__ = AsyncMock(return_value=None)
    engine = MagicMock()
    engine.connect = MagicMock(return_value=cm)
    minio = MagicMock()
    minio.bucket_exists.return_value = True

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.engine", engine),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_health_check_mongo_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock(side_effect=RuntimeError("down"))

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.engine"),
        patch("routes.v1.health.Minio"),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.asyncio
async def test_health_check_minio_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    minio = MagicMock()
    minio.bucket_exists.side_effect = RuntimeError("no minio")

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.engine"),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.asyncio
async def test_health_check_postgres_failure_returns_503() -> None:
    mdb = MagicMock()
    mdb.command = AsyncMock()
    minio = MagicMock()
    minio.bucket_exists.return_value = True
    engine = MagicMock()
    engine.connect = MagicMock(side_effect=RuntimeError("pg"))

    with (
        patch("routes.v1.health.get_mongo_db", return_value=mdb),
        patch("routes.v1.health.engine", engine),
        patch("routes.v1.health.Minio", return_value=minio),
    ):
        r = await health_check()

    assert r.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
