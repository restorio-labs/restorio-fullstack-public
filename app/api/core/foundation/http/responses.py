from typing import TypeVar

from fastapi import status
from pydantic import BaseModel

from core.exceptions.http import BaseHTTPException

T = TypeVar("T")


class SuccessResponse[T](BaseModel):
    message: str | None = None
    data: T


class CreatedResponse[T](BaseModel):
    message: str = "Resource created successfully"
    data: T


class UpdatedResponse[T](BaseModel):
    message: str = "Resource updated successfully"
    data: T


class DeletedResponse(BaseModel):
    message: str = "Resource deleted successfully"


class ExceptionHandlerResponse(BaseModel):
    message: str
    details: dict | None = None
    request_id: str | None = None


class ErrorResponse(BaseModel):
    details: dict | None = None
    request_id: str | None = None


class ValidationErrorResponse(BaseModel):
    fields: list[str]
    request_id: str | None = None


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class UnauthenticatedResponse(BaseHTTPException):
    def __init__(self, message: str = "Unauthenticated") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
        )


class UnauthorizedResponse(BaseHTTPException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
        )


class NotFoundResponse(BaseModel):
    message: str = "Not found"


class ConflictResponse(BaseModel):
    message: str = "Conflict"


class BadRequestResponse(BaseModel):
    message: str = "Bad request"


class GoneResponse(BaseModel):
    message: str = "Gone"


class TooManyRequestsResponse(BaseModel):
    message: str = "Too many requests"


class ServiceUnavailableResponse(BaseModel):
    message: str = "Service unavailable"
