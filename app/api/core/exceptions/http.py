from fastapi import HTTPException, status


class BaseHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "An error occurred",
        details: dict | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.details = details


class NotFoundResponse(BaseHTTPException):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
        )


class ValidationError(BaseHTTPException):
    def __init__(
        self, message: str = "Validation failed", errors: list[dict[str, str]] | None = None
    ) -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            message=message,
            details={"errors": errors} if errors else None,
        )


class UnauthorizedError(BaseHTTPException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
        )


class ForbiddenError(BaseHTTPException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
        )


class ConflictError(BaseHTTPException):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
        )


class BadRequestError(BaseHTTPException):
    def __init__(self, message: str = "Bad request", *, details: dict | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            details=details,
        )


class GoneError(BaseHTTPException):
    def __init__(self, message: str = "Resource no longer available") -> None:
        super().__init__(
            status_code=status.HTTP_410_GONE,
            message=message,
        )


class TooManyRequestsError(BaseHTTPException):
    def __init__(self, message: str = "Too many requests") -> None:
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message,
        )


class ServiceUnavailableError(BaseHTTPException):
    def __init__(self, message: str = "Service unavailable") -> None:
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=message,
        )


class ExternalAPIError(BaseHTTPException):
    def __init__(self, message: str) -> None:
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
        )
