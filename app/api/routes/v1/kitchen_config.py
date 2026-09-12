from fastapi import APIRouter, status
from pydantic import Field

from core.dto.v1.common import BaseDTO
from core.foundation.dependencies import AuthorizedTenantId, MongoDB
from core.foundation.http.responses import SuccessResponse, UpdatedResponse
from core.foundation.role_guard import RequireAnyStaff, RequireOwnerOrManager
from services.kitchen_config_service import KitchenConfigService

router = APIRouter()

_service = KitchenConfigService()


class KitchenConfigResponseDTO(BaseDTO):
    restaurant_id: str = Field(..., alias="restaurantId")
    rejection_labels: list[str] = Field(..., alias="rejectionLabels")


class UpdateRejectionLabelsDTO(BaseDTO):
    rejection_labels: list[str] = Field(
        ..., min_length=1, alias="rejectionLabels", description="List of rejection label strings"
    )


@router.get(
    "/{restaurant_id}/kitchen-config",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[KitchenConfigResponseDTO],
)
async def get_kitchen_config(
    restaurant_id: str,
    db: MongoDB,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[KitchenConfigResponseDTO]:
    config = await _service.get_config(db, restaurant_id)
    return SuccessResponse(
        message="Kitchen config retrieved successfully",
        data=KitchenConfigResponseDTO(**config),
    )


@router.put(
    "/{restaurant_id}/kitchen-config/rejection-labels",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[KitchenConfigResponseDTO],
)
async def update_rejection_labels(
    restaurant_id: str,
    payload: UpdateRejectionLabelsDTO,
    db: MongoDB,
    _tenant_id: AuthorizedTenantId,
    _role: RequireOwnerOrManager,
) -> UpdatedResponse[KitchenConfigResponseDTO]:
    config = await _service.update_rejection_labels(db, restaurant_id, payload.rejection_labels)
    return UpdatedResponse(
        message="Rejection labels updated successfully",
        data=KitchenConfigResponseDTO(**config),
    )
