from core.foundation.http.responses import (
    BadRequestResponse,
    ConflictResponse,
    GoneResponse,
    NotFoundResponse,
    ServiceUnavailableResponse,
    TooManyRequestsResponse,
    UnauthenticatedResponse,
    UnauthorizedResponse,
)

HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403


class TestUnauthenticatedResponse:
    def test_default_message(self) -> None:
        r = UnauthenticatedResponse()
        assert r.detail == "Unauthenticated"

    def test_custom_message(self) -> None:
        r = UnauthenticatedResponse(message="Not logged in")
        assert r.detail == "Not logged in"


class TestUnauthorizedResponse:
    def test_default_message(self) -> None:
        r = UnauthorizedResponse()
        assert r.detail == "Unauthorized"


class TestNotFoundResponse:
    def test_default_message(self) -> None:
        r = NotFoundResponse()
        assert r.model_dump() == {"message": "Not found"}


class TestConflictResponse:
    def test_default_message(self) -> None:
        r = ConflictResponse()
        assert r.model_dump() == {"message": "Conflict"}


class TestBadRequestResponse:
    def test_default_message(self) -> None:
        r = BadRequestResponse()
        assert r.model_dump() == {"message": "Bad request"}


class TestGoneResponse:
    def test_default_message(self) -> None:
        r = GoneResponse()
        assert r.model_dump() == {"message": "Gone"}


class TestTooManyRequestsResponse:
    def test_default_message(self) -> None:
        r = TooManyRequestsResponse()
        assert r.model_dump() == {"message": "Too many requests"}


class TestServiceUnavailableResponse:
    def test_default_message(self) -> None:
        r = ServiceUnavailableResponse()
        assert r.model_dump() == {"message": "Service unavailable"}
