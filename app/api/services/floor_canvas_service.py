from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.dto.v1.floor_canvases import CreateFloorCanvasDTO, UpdateFloorCanvasDTO
from core.exceptions import NotFoundResponse, ValidationError
from core.models import FloorCanvas, Tenant
from services.canvas_versioning import (
    archive_canvas_version,
    get_canvas_versions,
)
from services.canvas_versioning import (
    get_canvas_version as get_archived_version,
)


class FloorCanvasService:
    _RESOURCE = "Floor canvas"
    _RESOURCE_VERSION = "Canvas version"

    async def list_canvases(self, session: AsyncSession, tenant_id: UUID) -> list[FloorCanvas]:
        await self._ensure_tenant_exists(session, tenant_id)

        query = (
            select(FloorCanvas)
            .where(FloorCanvas.tenant_id == tenant_id)
            .order_by(FloorCanvas.created_at.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_canvas(
        self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID
    ) -> FloorCanvas:
        query = select(FloorCanvas).where(
            FloorCanvas.id == canvas_id,
            FloorCanvas.tenant_id == tenant_id,
        )
        result = await session.execute(query)
        canvas = result.scalar_one_or_none()

        if not canvas:
            raise NotFoundResponse(self._RESOURCE, str(canvas_id))

        return canvas

    async def create_canvas(
        self, session: AsyncSession, tenant_id: UUID, data: CreateFloorCanvasDTO
    ) -> FloorCanvas:
        await self._ensure_tenant_exists(session, tenant_id)

        elements = [el.model_dump(by_alias=True, exclude_none=True) for el in data.elements]

        canvas = FloorCanvas(
            tenant_id=tenant_id,
            name=data.name,
            width=data.width,
            height=data.height,
            elements=elements,
        )
        session.add(canvas)
        await session.commit()
        await session.refresh(canvas)
        return canvas

    async def update_canvas(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        canvas_id: UUID,
        data: UpdateFloorCanvasDTO,
    ) -> FloorCanvas:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)

        if data.elements is not None:
            await archive_canvas_version(canvas)
            canvas.elements = [
                el.model_dump(by_alias=True, exclude_none=True) for el in data.elements
            ]
            canvas.version += 1

        if data.name is not None:
            canvas.name = data.name
        if data.width is not None:
            canvas.width = data.width
        if data.height is not None:
            canvas.height = data.height

        await session.commit()
        await session.refresh(canvas)
        return canvas

    async def delete_canvas(self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID) -> None:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)
        await session.delete(canvas)
        await session.commit()

    def ensure_valid_table_numeration(self, elements: list[dict[str, Any]] | None) -> None:
        if not elements:
            return

        invalid_integer_msg = "Table numbers must be integers"
        non_positive_msg = "Table numbers must be positive"
        duplicate_msg = "Duplicate table numbers detected"
        non_continuous_msg = "Table numbers must form a continuous sequence starting from 1"

        table_numbers: list[int] = []

        for element in elements:
            if element.get("type") != "table":
                continue

            number = element.get("tableNumber")

            if not isinstance(number, int):
                raise ValidationError(invalid_integer_msg)

            if number <= 0:
                raise ValidationError(non_positive_msg)

            table_numbers.append(number)

        if not table_numbers:
            return

        unique_numbers = set(table_numbers)

        if len(unique_numbers) != len(table_numbers):
            raise ValidationError(duplicate_msg)

        expected = set(range(1, len(table_numbers) + 1))

        if unique_numbers != expected:
            raise ValidationError(non_continuous_msg)

    async def list_versions(
        self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID, limit: int = 50
    ) -> list[dict[str, Any]]:
        await self.get_canvas(session, tenant_id, canvas_id)
        return await get_canvas_versions(canvas_id, limit=limit)

    async def get_version(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        canvas_id: UUID,
        version: int,
    ) -> dict[str, Any]:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)

        if canvas.version == version:
            return {
                "id": str(canvas.id),
                "tenant_id": str(canvas.tenant_id),
                "name": canvas.name,
                "width": canvas.width,
                "height": canvas.height,
                "elements": canvas.elements,
                "version": canvas.version,
                "created_at": canvas.created_at.isoformat(),
                "updated_at": canvas.updated_at.isoformat(),
            }

        version_doc = await get_archived_version(canvas_id, version)
        if not version_doc:
            raise NotFoundResponse(self._RESOURCE_VERSION, f"{canvas_id} v{version}")

        return version_doc

    async def _ensure_tenant_exists(self, session: AsyncSession, tenant_id: UUID) -> None:
        query = select(Tenant.id).where(Tenant.id == tenant_id)
        result = await session.execute(query)
        if not result.scalar_one_or_none():
            resource = "Tenant"
            raise NotFoundResponse(resource, str(tenant_id))


floor_canvas_service = FloorCanvasService()
