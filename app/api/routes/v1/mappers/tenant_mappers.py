from core.dto.v1.floor_canvases import FloorCanvasResponseDTO
from core.dto.v1.tenants import TenantResponseDTO, TenantSummaryResponseDTO
from core.models import FloorCanvas, Tenant


def tenant_to_response(tenant: Tenant) -> TenantResponseDTO:
    return TenantResponseDTO(
        id=tenant.public_id,
        name=tenant.name,
        slug=tenant.slug,
        status=tenant.status,
        activeLayoutVersionId=tenant.active_layout_version_id,
        floorCanvases=[floor_canvas_to_response(fc) for fc in tenant.floor_canvases],
        created_at=tenant.created_at,
    )


def tenant_to_summary(tenant: Tenant) -> TenantSummaryResponseDTO:
    return TenantSummaryResponseDTO(
        id=tenant.public_id,
        name=tenant.name,
        slug=tenant.slug,
        status=tenant.status,
        activeLayoutVersionId=tenant.active_layout_version_id,
        floorCanvasCount=len(tenant.floor_canvases),
        created_at=tenant.created_at,
    )


def floor_canvas_to_response(canvas: FloorCanvas) -> FloorCanvasResponseDTO:
    return FloorCanvasResponseDTO(
        id=canvas.id,
        tenantId=canvas.tenant_id,
        name=canvas.name,
        width=canvas.width,
        height=canvas.height,
        elements=canvas.elements,
        version=canvas.version,
        createdAt=canvas.created_at,
        updatedAt=canvas.updated_at,
    )
