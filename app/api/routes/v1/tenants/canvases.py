from uuid import UUID

from fastapi import APIRouter, status

from core.dto.v1 import (
    CreateFloorCanvasDTO,
    FloorCanvasResponseDTO,
    UpdateFloorCanvasDTO,
)
from core.foundation.dependencies import (
    AuthorizedTenantId,
    FloorCanvasServiceDep,
    PostgresSession,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from routes.v1.mappers.tenant_mappers import (
    floor_canvas_to_response,
)

router = APIRouter()


@router.get(
    "/{tenant_public_id}/canvases",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[FloorCanvasResponseDTO]],
    summary="List floor canvases",
    description="List floor canvases",
    response_description="Floor canvases retrieved successfully",
)
async def list_floor_canvases(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[list[FloorCanvasResponseDTO]]:
    canvases = await service.list_canvases(session, tenant_id)
    return SuccessResponse(
        message="Floor canvases retrieved successfully",
        data=[floor_canvas_to_response(c) for c in canvases],
    )


@router.get(
    "/{tenant_public_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[FloorCanvasResponseDTO],
    summary="Get a floor canvas by ID",
    description="Get a floor canvas by ID",
    response_description="Floor canvas retrieved successfully",
)
async def get_floor_canvas(
    tenant_id: AuthorizedTenantId,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[FloorCanvasResponseDTO]:
    canvas = await service.get_canvas(session, tenant_id, canvas_id)
    return SuccessResponse(
        message="Floor canvas retrieved successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.post(
    "/{tenant_public_id}/canvases",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[FloorCanvasResponseDTO],
    summary="Create a floor canvas",
    description="Create a floor canvas",
    response_description="Floor canvas created successfully",
)
async def create_floor_canvas(
    tenant_id: AuthorizedTenantId,
    request: CreateFloorCanvasDTO,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> CreatedResponse[FloorCanvasResponseDTO]:
    data = CreateFloorCanvasDTO(
        name=request.name,
        width=request.width,
        height=request.height,
        elements=[el.model_dump(by_alias=True, exclude_none=True) for el in request.elements],
    )
    canvas = await service.create_canvas(session, tenant_id, data)
    return CreatedResponse(
        message="Floor canvas created successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.put(
    "/{tenant_public_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[FloorCanvasResponseDTO],
    response_model_exclude_none=True,
    summary="Update a floor canvas",
    description="Update a floor canvas",
    response_description="Floor canvas updated successfully",
)
async def update_floor_canvas(
    tenant_id: AuthorizedTenantId,
    canvas_id: UUID,
    request: UpdateFloorCanvasDTO,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> UpdatedResponse[FloorCanvasResponseDTO]:
    elements = None
    if request.elements is not None:
        elements = [el.model_dump(by_alias=True, exclude_none=True) for el in request.elements]

    service.ensure_valid_table_numeration(elements)

    data = UpdateFloorCanvasDTO(
        name=request.name,
        width=request.width,
        height=request.height,
        elements=elements,
    )
    canvas = await service.update_canvas(session, tenant_id, canvas_id, data)
    return UpdatedResponse(
        message="Floor canvas updated successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.delete(
    "/{tenant_public_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
    summary="Delete a floor canvas",
    description="Delete a floor canvas",
    response_description="Floor canvas deleted successfully",
)
async def delete_floor_canvas(
    tenant_id: AuthorizedTenantId,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> DeletedResponse:
    await service.delete_canvas(session, tenant_id, canvas_id)
    return DeletedResponse(message=f"Floor canvas {canvas_id} deleted successfully")


@router.get(
    "/{tenant_public_id}/canvases/{canvas_id}/versions",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[dict]],
    summary="List canvas versions",
    description="List canvas versions",
    response_description="Canvas versions retrieved successfully",
)
async def list_canvas_versions(
    tenant_id: AuthorizedTenantId,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
    limit: int = 50,
) -> SuccessResponse[list[dict]]:
    versions = await service.list_versions(session, tenant_id, canvas_id, limit)
    return SuccessResponse(
        message="Canvas versions retrieved successfully",
        data=versions,
    )


@router.get(
    "/{tenant_public_id}/canvases/{canvas_id}/versions/{version}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
    summary="Get a canvas version by ID",
    description="Get a canvas version by ID",
    response_description="Canvas version retrieved successfully",
)
async def get_canvas_version(
    tenant_id: AuthorizedTenantId,
    canvas_id: UUID,
    version: int,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[dict]:
    version_data = await service.get_version(session, tenant_id, canvas_id, version)
    return SuccessResponse(
        message="Canvas version retrieved successfully",
        data=version_data,
    )
