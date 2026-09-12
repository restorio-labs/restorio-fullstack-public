from fastapi import status

from core.exceptions import (
    BadRequestError,
    BaseHTTPException,
    ConflictError,
    ExternalAPIError,
    ForbiddenError,
    GoneError,
    NotFoundResponse,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnauthorizedError,
    ValidationError,
)


class TestBaseHTTPException:
    def test_base_exception_default_values(self) -> None:
        exception = BaseHTTPException()

        assert exception.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exception.detail == "An error occurred"
        assert exception.details is None

    def test_base_exception_custom_values(self) -> None:
        details = {"key": "value"}
        exception = BaseHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Custom error",
            details=details,
        )

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Custom error"
        assert exception.details == details


class TestNotFoundResponse:
    def test_not_found_error_without_identifier(self) -> None:
        exception = NotFoundResponse("User")

        assert exception.status_code == status.HTTP_404_NOT_FOUND
        assert exception.detail == "User not found"

    def test_not_found_error_with_identifier(self) -> None:
        exception = NotFoundResponse("User", identifier="123")

        assert exception.status_code == status.HTTP_404_NOT_FOUND
        assert exception.detail == "User with id '123' not found"


class TestValidationError:
    def test_validation_error_default_message(self) -> None:
        exception = ValidationError()

        assert exception.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert exception.detail == "Validation failed"

    def test_validation_error_with_errors(self) -> None:
        errors = [{"field": "email", "message": "Invalid format"}]
        exception = ValidationError(message="Custom validation error", errors=errors)

        assert exception.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert exception.detail == "Custom validation error"
        assert exception.details is not None
        assert "errors" in exception.details


class TestUnauthorizedError:
    def test_unauthorized_error_default_message(self) -> None:
        exception = UnauthorizedError()

        assert exception.status_code == status.HTTP_401_UNAUTHORIZED
        assert exception.detail == "Unauthorized"

    def test_unauthorized_error_custom_message(self) -> None:
        exception = UnauthorizedError("Invalid credentials")

        assert exception.status_code == status.HTTP_401_UNAUTHORIZED
        assert exception.detail == "Invalid credentials"


class TestForbiddenError:
    def test_forbidden_error_default_message(self) -> None:
        exception = ForbiddenError()

        assert exception.status_code == status.HTTP_403_FORBIDDEN
        assert exception.detail == "Forbidden"

    def test_forbidden_error_custom_message(self) -> None:
        exception = ForbiddenError("Access denied")

        assert exception.status_code == status.HTTP_403_FORBIDDEN
        assert exception.detail == "Access denied"


class TestConflictError:
    def test_conflict_error_default_message(self) -> None:
        exception = ConflictError()

        assert exception.status_code == status.HTTP_409_CONFLICT
        assert exception.detail == "Resource conflict"

    def test_conflict_error_custom_message(self) -> None:
        exception = ConflictError("Email already exists")

        assert exception.status_code == status.HTTP_409_CONFLICT
        assert exception.detail == "Email already exists"


class TestBadRequestError:
    def test_bad_request_error_default_message(self) -> None:
        exception = BadRequestError()

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Bad request"

    def test_bad_request_error_custom_message(self) -> None:
        exception = BadRequestError("Invalid input")

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Invalid input"

    def test_bad_request_error_with_details(self) -> None:
        exception = BadRequestError("Invalid input", details={"code": "X"})

        assert exception.status_code == status.HTTP_400_BAD_REQUEST
        assert exception.detail == "Invalid input"
        assert exception.details == {"code": "X"}


class TestGoneError:
    def test_gone_error_default_message(self) -> None:
        exception = GoneError()

        assert exception.status_code == status.HTTP_410_GONE
        assert exception.detail == "Resource no longer available"

    def test_gone_error_custom_message(self) -> None:
        exception = GoneError("Activation link has expired")

        assert exception.status_code == status.HTTP_410_GONE
        assert exception.detail == "Activation link has expired"


class TestTooManyRequestsError:
    def test_too_many_requests_error_default_message(self) -> None:
        exception = TooManyRequestsError()

        assert exception.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert exception.detail == "Too many requests"

    def test_too_many_requests_error_custom_message(self) -> None:
        exception = TooManyRequestsError("Please wait before requesting another email.")

        assert exception.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert exception.detail == "Please wait before requesting another email."


class TestServiceUnavailableError:
    def test_service_unavailable_error_default_message(self) -> None:
        exception = ServiceUnavailableError()

        assert exception.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert exception.detail == "Service unavailable"


class TestExternalAPIError:
    def test_external_api_error_with_message(self) -> None:
        exception = ExternalAPIError("Upstream service failed")

        assert exception.status_code == status.HTTP_502_BAD_GATEWAY
        assert exception.detail == "Upstream service failed"
