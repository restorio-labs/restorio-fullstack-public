from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.foundation.infra.config import Settings

_DEFAULT_LOCAL_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
)
_RESTORIO_HOST_SUFFIX = ".restorio.org"
_LOCAL_ALLOWED_HOSTS = {"localhost", "127.0.0.1", "::1"}
_LOCAL_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1|::1)(:\d+)?$"
_CF_PAGES_PREVIEW_ORIGIN_REGEX = r"^https://[a-zA-Z0-9.-]+\.pages\.dev$"


def _build_allowed_origins(configured_origins: list[str], *, debug: bool = False) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    sources = [*configured_origins]
    if debug:
        sources.extend(_DEFAULT_LOCAL_ORIGINS)

    for origin in sources:
        if origin in seen:
            continue
        seen.add(origin)
        ordered.append(origin)

    return ordered


def is_origin_allowed(
    origin: str | None,
    configured_origins: list[str],
    *,
    debug: bool = False,
    allow_cf_pages_previews: bool = False,
) -> bool:
    if not origin:
        return False

    if origin in _build_allowed_origins(configured_origins, debug=debug):
        return True

    parsed = urlparse(origin)
    if parsed.scheme in {"http", "https"} and parsed.hostname in _LOCAL_ALLOWED_HOSTS:
        return True

    if allow_cf_pages_previews and parsed.scheme == "https" and parsed.hostname is not None:
        host = parsed.hostname
        if host == "pages.dev" or host.endswith(".pages.dev"):
            return True

    if debug:
        host = parsed.hostname
        if host is not None and (host == "restorio.org" or host.endswith(_RESTORIO_HOST_SUFFIX)):
            return parsed.scheme in {"http", "https"}

    return False


def _cors_allow_origin_regex(settings: Settings) -> str:
    parts = [_LOCAL_ORIGIN_REGEX]
    if settings.CORS_ALLOW_CF_PAGES_PREVIEWS:
        parts.append(_CF_PAGES_PREVIEW_ORIGIN_REGEX)
    return "|".join(f"(?:{p})" for p in parts)


def setup_cors(app: FastAPI, settings: Settings) -> None:
    allow_origins = _build_allowed_origins(settings.CORS_ORIGINS, debug=settings.DEBUG)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=_cors_allow_origin_regex(settings),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Authorization",
            "Content-Type",
            "Origin",
            "X-CSRF-Token",
            "X-Requested-With",
            "X-Timezone",
        ],
    )
