from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.dto.v1.tenant_profiles import CreateTenantProfileDTO, UpdateTenantProfileDTO
from core.exceptions import NotFoundResponse
from core.models import TenantProfile


class TenantProfileService:
    _RESOURCE = "TenantProfile"

    async def get_by_tenant(self, session: AsyncSession, tenant_id: UUID) -> TenantProfile | None:
        query = select(TenantProfile).where(TenantProfile.tenant_id == tenant_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_tenant_or_404(self, session: AsyncSession, tenant_id: UUID) -> TenantProfile:
        profile = await self.get_by_tenant(session, tenant_id)
        if not profile:
            raise NotFoundResponse(self._RESOURCE, str(tenant_id))
        return profile

    async def create(
        self, session: AsyncSession, tenant_id: UUID, data: CreateTenantProfileDTO
    ) -> TenantProfile:
        profile = TenantProfile(
            tenant_id=tenant_id,
            nip=data.nip,
            company_name=data.company_name,
            logo=data.logo,
            contact_email=data.contact_email,
            phone=data.phone,
            address_street_name=data.address_street_name,
            address_street_number=data.address_street_number,
            address_city=data.address_city,
            address_postal_code=data.address_postal_code,
            address_country=data.address_country,
            owner_first_name=data.owner_first_name,
            owner_last_name=data.owner_last_name,
            owner_email=data.owner_email,
            owner_phone=data.owner_phone,
            contact_person_first_name=data.contact_person_first_name,
            contact_person_last_name=data.contact_person_last_name,
            contact_person_email=data.contact_person_email,
            contact_person_phone=data.contact_person_phone,
            social_facebook=data.social_facebook,
            social_instagram=data.social_instagram,
            social_tiktok=data.social_tiktok,
            social_website=data.social_website,
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile

    async def update(
        self, session: AsyncSession, tenant_id: UUID, data: UpdateTenantProfileDTO
    ) -> TenantProfile:
        profile = await self.get_by_tenant_or_404(session, tenant_id)

        update_data = data.model_dump(exclude_unset=True, exclude={"logo_upload_key"})
        for field, value in update_data.items():
            setattr(profile, field, value)

        await session.commit()
        await session.refresh(profile)
        return profile

    async def upsert(
        self, session: AsyncSession, tenant_id: UUID, data: CreateTenantProfileDTO
    ) -> tuple[TenantProfile, bool]:
        existing = await self.get_by_tenant(session, tenant_id)
        if existing:
            update_data = data.model_dump(exclude={"logo_upload_key"})
            for field, value in update_data.items():
                setattr(existing, field, value)
            await session.commit()
            await session.refresh(existing)
            return existing, False

        profile = await self.create(session, tenant_id, data)
        return profile, True


tenant_profile_service = TenantProfileService()
