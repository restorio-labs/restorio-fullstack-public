from __future__ import annotations

from io import BytesIO
from types import SimpleNamespace
from unittest.mock import MagicMock, Mock, patch
from uuid import uuid4

from PIL import Image
import pytest

from core.exceptions import (
    BadRequestError,
    NotFoundResponse,
    ServiceUnavailableError,
    TooManyRequestsError,
)
from core.foundation.infra.config import settings
from services.tenant_logo_storage_service import TenantLogoStorageService
from services.tenant_menu_image_storage_service import TenantMenuImageStorageService
from services.tenant_mobile_favicon_storage_service import TenantMobileFaviconStorageService


def _make_png(w: int = 10, h: int = 10) -> bytes:
    img = Image.new("RGB", (w, h), (200, 100, 50))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_square_jpeg() -> bytes:
    img = Image.new("RGB", (100, 100), (0, 255, 0))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_square_webp() -> bytes:
    img = Image.new("RGB", (50, 50), (0, 0, 255))
    buf = BytesIO()
    img.save(buf, format="WEBP")
    return buf.getvalue()


class _ObjectStream:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data

    def close(self) -> None:
        return

    def release_conn(self) -> None:
        return


def _new_logo_service(internal: MagicMock, public: MagicMock) -> TenantLogoStorageService:
    with patch("services.tenant_logo_storage_service.Minio", side_effect=[internal, public]):
        return TenantLogoStorageService()


def _new_menu_image_service(
    internal: MagicMock, public: MagicMock
) -> TenantMenuImageStorageService:
    with patch("services.tenant_menu_image_storage_service.Minio", side_effect=[internal, public]):
        return TenantMenuImageStorageService()


def _new_favicon_service(
    internal: MagicMock, public: MagicMock
) -> TenantMobileFaviconStorageService:
    with patch(
        "services.tenant_mobile_favicon_storage_service.Minio", side_effect=[internal, public]
    ):
        return TenantMobileFaviconStorageService()


@pytest.fixture(autouse=True)
def _clear_class_rate_limits() -> None:
    TenantLogoStorageService._presign_usage.clear()
    TenantMenuImageStorageService._presign_usage.clear()
    TenantMobileFaviconStorageService._presign_usage.clear()
    yield
    TenantLogoStorageService._presign_usage.clear()
    TenantMenuImageStorageService._presign_usage.clear()
    TenantMobileFaviconStorageService._presign_usage.clear()


def test_logo_create_presigned_rejects_type() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError, match="Logo must be"):
        svc.create_presigned_upload(uuid4(), "image/gif")


def test_logo_create_presigned_success() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.return_value = "https://u"
    svc = _new_logo_service(i, p)
    url, key = svc.create_presigned_upload(uuid4(), "image/png")
    assert url == "https://u"
    assert "tmp/tenant-logos" in key


def test_logo_create_presigned_rate_limited() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.return_value = "u"
    tid = uuid4()
    svc = _new_logo_service(i, p)
    for _ in range(10):
        svc.create_presigned_upload(tid, "image/png")
    with pytest.raises(TooManyRequestsError):
        svc.create_presigned_upload(tid, "image/png")


def test_logo_create_presigned_storage_unavailable() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.side_effect = OSError("x")
    svc = _new_logo_service(i, p)
    with pytest.raises(ServiceUnavailableError, match="unavailable"):
        svc.create_presigned_upload(uuid4(), "image/png")


def test_logo_finalize_rejects_key() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(uuid4(), "wrong/prefix/x")


def test_logo_finalize_happy_path() -> None:
    tid = uuid4()
    data = _make_png()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    i.list_objects.return_value = iter(())
    i.presigned_get_object = MagicMock()
    p.presigned_get_object.return_value = "g"

    key = f"tmp/tenant-logos/{tid}/abc"
    svc = _new_logo_service(i, p)
    out = svc.finalize_upload(tid, key)
    assert isinstance(out.url, str)
    exp = 10
    assert out.width == exp
    assert out.height == exp
    i.put_object.assert_called()
    i.remove_object.assert_called()


def test_logo_finalize_read_failure_wrapped() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.side_effect = OSError("no")
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(tid, key)


def test_logo_finalize_not_valid_image() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    b = b"not an image"
    i.stat_object.return_value = SimpleNamespace(size=len(b))
    i.get_object.return_value = _ObjectStream(b)
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError):
        svc.finalize_upload(tid, key)


def test_logo_read_rejects_too_large() -> None:
    i, p = MagicMock(), MagicMock()
    i.stat_object.return_value = SimpleNamespace(size=99_000_000)
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError, match="too large"):
        svc._read_uploaded_object("k")


def test_logo_finalize_put_failed() -> None:
    tid = uuid4()
    data = _make_png()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    i.put_object.side_effect = OSError("no")
    i.list_objects.return_value = iter(())
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.finalize_upload(tid, key)


def test_logo_create_view_not_found() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.side_effect = OSError("missing")
    svc = _new_logo_service(i, p)
    with pytest.raises(NotFoundResponse):
        svc.create_presigned_view(uuid4())


def test_logo_create_view_success() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=1)
    p.presigned_get_object.return_value = "https://v"
    svc = _new_logo_service(i, p)
    assert svc.create_presigned_view(uuid4()) == "https://v"


def test_logo_create_view_presign_fails() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=1)
    p.presigned_get_object.side_effect = OSError("e")
    svc = _new_logo_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.create_presigned_view(uuid4())


def test_logo_ensure_bucket_creates() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = False
    svc = _new_logo_service(i, p)
    svc._ensure_bucket()
    i.make_bucket.assert_called()


def test_logo_finalize_removes_previous_final_objects() -> None:
    tid = uuid4()
    data = _make_png()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    old = SimpleNamespace(object_name=f"tenant-logos/{tid}/old.png")
    i.list_objects.return_value = iter((old,))
    key = f"tmp/tenant-logos/{tid}/abc"
    svc = _new_logo_service(i, p)
    svc.finalize_upload(tid, key)
    min_removals = 2
    assert i.remove_object.call_count >= min_removals


def test_logo_normalize_rejects_gif_format() -> None:
    tid = uuid4()
    img = Image.new("RGB", (100, 100), (255, 0, 0))
    buf = BytesIO()
    img.save(buf, format="GIF")
    raw = buf.getvalue()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(raw))
    i.get_object.return_value = _ObjectStream(raw)
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    with pytest.raises(BadRequestError, match="Logo must be"):
        svc.finalize_upload(tid, key)


def _ctx_verify_only() -> Mock:
    inner = Mock()
    inner.verify = Mock()
    cm = Mock()
    cm.__enter__ = Mock(return_value=inner)
    cm.__exit__ = Mock(return_value=False)
    return cm


def _ctx_huge_png() -> Mock:
    inner = Mock()
    inner.format = "PNG"
    inner.width = 5000
    inner.height = 5000
    inner.convert = Mock(return_value=inner)
    cm = Mock()
    cm.__enter__ = Mock(return_value=inner)
    cm.__exit__ = Mock(return_value=False)
    return cm


def test_logo_normalize_rejects_too_many_pixels() -> None:
    tid = uuid4()
    data = _make_png(10, 10)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    i.list_objects.return_value = iter(())
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    m_open = Mock(side_effect=[_ctx_verify_only(), _ctx_huge_png()])
    with (
        patch("services.tenant_logo_storage_service.Image.open", m_open),
        pytest.raises(BadRequestError, match="too large"),
    ):
        svc.finalize_upload(tid, key)


def test_logo_normalize_oserror() -> None:
    tid = uuid4()
    data = _make_png(10, 10)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    i.list_objects.return_value = iter(())
    key = f"tmp/tenant-logos/{tid}/k"
    svc = _new_logo_service(i, p)
    m_open = Mock(side_effect=[_ctx_verify_only(), OSError("e")])
    with (
        patch("services.tenant_logo_storage_service.Image.open", m_open),
        pytest.raises(BadRequestError, match="valid image"),
    ):
        svc.finalize_upload(tid, key)


def test_logo_ensure_bucket_policy_error() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.set_bucket_policy.side_effect = RuntimeError("p")
    svc = _new_logo_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc._ensure_bucket()


def test_menu_image_presigned_and_jpeg_final() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.return_value = "u"
    jpg = _make_square_jpeg()
    i.stat_object.return_value = SimpleNamespace(size=len(jpg))
    i.get_object.return_value = _ObjectStream(jpg)
    key = f"tmp/menu-items/{tid}/x"
    svc = _new_menu_image_service(i, p)
    out = svc.finalize_upload(tid, key)
    assert "menu-items" in out.object_key
    assert i.put_object.call_args is not None
    assert i.put_object.call_args.kwargs.get("content_type") == "image/jpeg"


def test_menu_image_rejects_nonsquare() -> None:
    tid = uuid4()
    wide = _make_png(200, 10)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(wide))
    i.get_object.return_value = _ObjectStream(wide)
    key = f"tmp/menu-items/{tid}/x"
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="square"):
        svc.finalize_upload(tid, key)


def test_menu_image_webp_branch() -> None:
    tid = uuid4()
    w = _make_square_webp()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(w))
    i.get_object.return_value = _ObjectStream(w)
    key = f"tmp/menu-items/{tid}/x"
    svc = _new_menu_image_service(i, p)
    svc.finalize_upload(tid, key)
    assert i.put_object.called


def test_menu_image_create_presigned_bad_type() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="Menu image"):
        svc.create_presigned_upload(uuid4(), "text/plain")


def test_menu_image_presign_rate_limited() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.return_value = "u"
    tid = uuid4()
    svc = _new_menu_image_service(i, p)
    for _ in range(20):
        svc.create_presigned_upload(tid, "image/png")
    with pytest.raises(TooManyRequestsError):
        svc.create_presigned_upload(tid, "image/png")


def test_menu_image_presign_minio_fails() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.side_effect = OSError("n")
    svc = _new_menu_image_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.create_presigned_upload(uuid4(), "image/png")


def test_menu_image_finalize_rejects_key() -> None:
    svc = _new_menu_image_service(MagicMock(), MagicMock())
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(uuid4(), "other/x")


def test_menu_image_read_failure_wrapped() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.side_effect = OSError("no")
    key = f"tmp/menu-items/{tid}/k"
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(tid, key)


def test_menu_image_too_many_pixels() -> None:
    tid = uuid4()
    data = _make_png(10, 10)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    key = f"tmp/menu-items/{tid}/k"
    svc = _new_menu_image_service(i, p)
    inner2 = Mock()
    inner2.format = "PNG"
    inner2.width = 5000
    inner2.height = 5000
    cm2 = Mock()
    cm2.__enter__ = Mock(return_value=inner2)
    cm2.__exit__ = Mock(return_value=False)
    m_open = Mock(side_effect=[_ctx_verify_only(), cm2])
    with (
        patch("services.tenant_menu_image_storage_service.Image.open", m_open),
        pytest.raises(BadRequestError, match="too large"),
    ):
        svc.finalize_upload(tid, key)


def test_menu_image_unidentified() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    b = b"x" * 20
    i.stat_object.return_value = SimpleNamespace(size=len(b))
    i.get_object.return_value = _ObjectStream(b)
    key = f"tmp/menu-items/{tid}/k"
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="valid image"):
        svc.finalize_upload(tid, key)


def test_menu_image_oserror_normalize() -> None:
    tid = uuid4()
    data = _make_png(10, 10)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(data))
    i.get_object.return_value = _ObjectStream(data)
    key = f"tmp/menu-items/{tid}/k"
    svc = _new_menu_image_service(i, p)
    m_open = Mock(side_effect=[_ctx_verify_only(), OSError("e")])
    with (
        patch("services.tenant_menu_image_storage_service.Image.open", m_open),
        pytest.raises(BadRequestError, match="valid image"),
    ):
        svc.finalize_upload(tid, key)


def test_menu_image_read_too_large() -> None:
    i, p = MagicMock(), MagicMock()
    i.stat_object.return_value = SimpleNamespace(size=settings.TENANT_MENU_IMAGE_MAX_BYTES + 1)
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="too large"):
        svc._read_uploaded_object("k")


def test_menu_image_square_png_path() -> None:
    tid = uuid4()
    square = _make_png(80, 80)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(square))
    i.get_object.return_value = _ObjectStream(square)
    key = f"tmp/menu-items/{tid}/x"
    svc = _new_menu_image_service(i, p)
    svc.finalize_upload(tid, key)
    assert i.put_object.call_args.kwargs.get("content_type") == "image/png"


def test_menu_image_put_fails() -> None:
    tid = uuid4()
    square = _make_png(40, 40)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(square))
    i.get_object.return_value = _ObjectStream(square)
    i.put_object.side_effect = RuntimeError("e")
    key = f"tmp/menu-items/{tid}/x"
    svc = _new_menu_image_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.finalize_upload(tid, key)


def test_menu_image_ensure_bucket_policy_fails() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.set_bucket_policy.side_effect = RuntimeError("e")
    svc = _new_menu_image_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc._ensure_bucket()


def test_menu_image_rejects_gif_format() -> None:
    tid = uuid4()
    img = Image.new("RGB", (100, 100), (0, 255, 0))
    buf = BytesIO()
    img.save(buf, format="GIF")
    raw = buf.getvalue()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(raw))
    i.get_object.return_value = _ObjectStream(raw)
    key = f"tmp/menu-items/{tid}/k"
    svc = _new_menu_image_service(i, p)
    with pytest.raises(BadRequestError, match="Menu image must be"):
        svc.finalize_upload(tid, key)


def test_menu_image_ensure_bucket_creates() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = False
    svc = _new_menu_image_service(i, p)
    svc._ensure_bucket()
    i.make_bucket.assert_called_once()


def _minimal_ico_bytes() -> bytes:
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    b = BytesIO()
    im.save(b, format="ICO", sizes=[(32, 32)])
    return b.getvalue()


def test_favicon_happy() -> None:
    tid = uuid4()
    ico = _minimal_ico_bytes()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(ico))
    i.get_object.return_value = _ObjectStream(ico)
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    fk = svc.finalize_upload(tid, key)
    assert "favicon" in fk


def test_favicon_get_stream_and_stat() -> None:
    i, p = MagicMock(), MagicMock()
    i.get_object.return_value = _ObjectStream(b"x")
    stat_size = 2
    i.stat_object.return_value = SimpleNamespace(size=stat_size)
    svc = _new_favicon_service(i, p)
    assert svc.stat_object("k") == stat_size
    o = svc.get_object_stream("k")
    assert o.read() == b"x"


def test_favicon_ensure_creates_bucket() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = False
    svc = _new_favicon_service(i, p)
    svc._ensure_bucket()
    i.make_bucket.assert_called()


def test_favicon_presign_rejects_content_type() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="ICO"):
        svc.create_presigned_upload(uuid4(), "image/png")


def test_favicon_presign_rate_limit() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.return_value = "https://u"
    svc = _new_favicon_service(i, p)
    tid = uuid4()
    for _ in range(10):
        svc.create_presigned_upload(tid, "image/x-icon")
    with pytest.raises(TooManyRequestsError):
        svc.create_presigned_upload(tid, "image/x-icon")


def test_favicon_presign_public_minio_error() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    p.presigned_put_object.side_effect = OSError("down")
    svc = _new_favicon_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.create_presigned_upload(uuid4(), "image/x-icon")


def test_favicon_finalize_invalid_key_prefix() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(uuid4(), "tmp/other/ico.ico")


def _ico_disallowed_size_bytes() -> bytes:
    im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    buf = BytesIO()
    im.save(buf, format="ICO", sizes=[(24, 24)])
    return buf.getvalue()


def test_favicon_finalize_rejects_disallowed_dimensions() -> None:
    tid = uuid4()
    raw = _ico_disallowed_size_bytes()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(raw))
    i.get_object.return_value = _ObjectStream(raw)
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="16x16"):
        svc.finalize_upload(tid, key)


def test_favicon_finalize_not_ico_format() -> None:
    tid = uuid4()
    raw = _make_png(32, 32)
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(raw))
    i.get_object.return_value = _ObjectStream(raw)
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="valid ICO"):
        svc.finalize_upload(tid, key)


def test_favicon_finalize_image_open_oserror() -> None:
    tid = uuid4()
    ico = _minimal_ico_bytes()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(ico))
    i.get_object.return_value = _ObjectStream(ico)
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with (
        patch(
            "services.tenant_mobile_favicon_storage_service.Image.open", side_effect=OSError("bad")
        ),
        pytest.raises(BadRequestError, match="valid ICO"),
    ):
        svc.finalize_upload(tid, key)


def test_favicon_finalize_unidentified_image() -> None:
    tid = uuid4()
    raw = b"not an image at all"
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(raw))
    i.get_object.return_value = _ObjectStream(raw)
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="valid ICO"):
        svc.finalize_upload(tid, key)


def test_favicon_finalize_put_object_unavailable() -> None:
    tid = uuid4()
    ico = _minimal_ico_bytes()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=len(ico))
    i.get_object.return_value = _ObjectStream(ico)
    i.put_object.side_effect = RuntimeError("no")
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.finalize_upload(tid, key)


def test_favicon_get_object_stream_error() -> None:
    i, p = MagicMock(), MagicMock()
    i.get_object.side_effect = RuntimeError("x")
    svc = _new_favicon_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.get_object_stream("k")


def test_favicon_stat_object_error() -> None:
    i, p = MagicMock(), MagicMock()
    i.stat_object.side_effect = RuntimeError("x")
    svc = _new_favicon_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc.stat_object("k")


def test_favicon_read_upload_rejects_oversized_file() -> None:
    i, p = MagicMock(), MagicMock()
    i.stat_object.return_value = SimpleNamespace(
        size=TenantMobileFaviconStorageService._MAX_BYTES + 1
    )
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="too large"):
        svc._read_uploaded_object("k")


def test_favicon_ensure_bucket_set_policy_fails() -> None:
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.set_bucket_policy.side_effect = RuntimeError("policy")
    svc = _new_favicon_service(i, p)
    with pytest.raises(ServiceUnavailableError):
        svc._ensure_bucket()


def test_favicon_build_public_url_quotes_key() -> None:
    i, p = MagicMock(), MagicMock()
    svc = _new_favicon_service(i, p)
    u = svc.build_public_url("tenant-mobile-favicons/a b/favicon.ico")
    assert "a%20b" in u
    assert u.startswith("http")


def test_menu_service_uses_public_secure_for_public_client() -> None:
    i, p = MagicMock(), MagicMock()
    with (
        patch.object(settings, "MINIO_PUBLIC_SECURE", True),
        patch("services.tenant_menu_image_storage_service.Minio", side_effect=[i, p]) as minio_cls,
    ):
        TenantMenuImageStorageService()

    assert minio_cls.call_args_list[0].kwargs["secure"] is settings.MINIO_SECURE
    assert minio_cls.call_args_list[1].kwargs["secure"] is True


def test_favicon_build_public_url_uses_public_secure_scheme() -> None:
    i, p = MagicMock(), MagicMock()
    with patch.object(settings, "MINIO_PUBLIC_SECURE", True):
        svc = _new_favicon_service(i, p)
        u = svc.build_public_url("tenant-mobile-favicons/a b/favicon.ico")

    assert "a%20b" in u
    assert u.startswith("https://")


def test_favicon_finalize_read_fails_before_open() -> None:
    tid = uuid4()
    i, p = MagicMock(), MagicMock()
    i.bucket_exists.return_value = True
    i.stat_object.return_value = SimpleNamespace(size=10)
    i.get_object.side_effect = RuntimeError("read")
    key = f"tmp/tenant-mobile-favicons/{tid}/x.ico"
    svc = _new_favicon_service(i, p)
    with pytest.raises(BadRequestError, match="invalid"):
        svc.finalize_upload(tid, key)
