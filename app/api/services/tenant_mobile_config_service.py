from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.tenant_mobile_config import TenantMobileConfig

_MISSING = object()


class TenantMobileConfigService:
    async def get_by_tenant_id(
        self, session: AsyncSession, tenant_id: UUID
    ) -> TenantMobileConfig | None:
        result = await session.execute(
            select(TenantMobileConfig).where(TenantMobileConfig.tenant_id == tenant_id)
        )

        return result.scalar_one_or_none()

    async def upsert(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        *,
        page_title: str | None | object = _MISSING,
        theme_override: dict[str, Any] | None | object = _MISSING,
        landing_content: dict[str, Any] | None | object = _MISSING,
    ) -> TenantMobileConfig:
        existing = await self.get_by_tenant_id(session, tenant_id)

        next_page: str | None
        next_theme: dict[str, Any] | None
        next_landing: dict[str, Any] | None

        if existing:
            next_page = existing.page_title
            next_theme = existing.theme_override
            next_landing = existing.landing_content

            if page_title is not _MISSING:
                next_page = page_title  # type: ignore[assignment]
            if theme_override is not _MISSING:
                next_theme = theme_override  # type: ignore[assignment]
            if landing_content is not _MISSING:
                next_landing = landing_content  # type: ignore[assignment]

            existing.page_title = next_page
            existing.theme_override = next_theme
            existing.landing_content = next_landing
            await session.flush()

            return existing

        next_page = None if page_title is _MISSING else page_title  # type: ignore[assignment]
        next_theme = None if theme_override is _MISSING else theme_override  # type: ignore[assignment]
        next_landing = None if landing_content is _MISSING else landing_content  # type: ignore[assignment]

        row = TenantMobileConfig(
            tenant_id=tenant_id,
            page_title=next_page,
            theme_override=next_theme,
            landing_content=next_landing,
        )
        session.add(row)
        await session.flush()

        return row

    async def copy_theme_override_from(
        self, session: AsyncSession, target_tenant_id: UUID, source_tenant_id: UUID
    ) -> TenantMobileConfig:
        source = await self.get_by_tenant_id(session, source_tenant_id)
        theme = source.theme_override if source else None

        existing = await self.get_by_tenant_id(session, target_tenant_id)

        if existing:
            existing.theme_override = theme
            await session.flush()

            return existing

        row = TenantMobileConfig(tenant_id=target_tenant_id, theme_override=theme)
        session.add(row)
        await session.flush()

        return row

    async def set_favicon_key(
        self, session: AsyncSession, tenant_id: UUID, object_key: str | None
    ) -> TenantMobileConfig:
        existing = await self.get_by_tenant_id(session, tenant_id)

        if existing:
            existing.favicon_object_key = object_key
            await session.flush()

            return existing

        row = TenantMobileConfig(
            tenant_id=tenant_id,
            page_title=None,
            theme_override=None,
            favicon_object_key=object_key,
        )
        session.add(row)
        await session.flush()

        return row


tenant_mobile_config_service = TenantMobileConfigService()
