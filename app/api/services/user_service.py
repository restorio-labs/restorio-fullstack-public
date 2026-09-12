import secrets
import string
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictError
from core.foundation.security import SecurityService
from core.foundation.slug import to_compact_slug
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User


class UserService:
    def __init__(self, security: SecurityService) -> None:
        self.security = security

    def generate_temporary_password(self, length: int = 24) -> str:
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        pool = lowercase + uppercase + digits + special

        required = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits),
            secrets.choice(special),
        ]
        remaining = [secrets.choice(pool) for _ in range(max(0, length - len(required)))]
        candidate = required + remaining
        secrets.SystemRandom().shuffle(candidate)
        return "".join(candidate)

    async def create_user_with_tenant(
        self,
        session: AsyncSession,
        email: str,
        password: str,
        restaurant_name: str,
    ) -> tuple[User, Tenant, TenantRole]:
        slug = to_compact_slug(restaurant_name)

        existing_user = await session.scalar(select(User).where(User.email == email))
        if existing_user:
            msg = "Email already registered"
            raise ConflictError(msg)

        existing_tenant = await session.scalar(select(Tenant).where(Tenant.slug == slug))
        if existing_tenant:
            msg = "Restaurant slug already exists"
            raise ConflictError(msg)

        user = User(
            email=email,
            password_hash=self.security.hash_password(password),
            is_active=False,
        )
        tenant = Tenant(
            name=restaurant_name,
            slug=slug,
            status=TenantStatus.INACTIVE,
        )

        session.add_all([user, tenant])
        await session.flush()
        user.tenant_id = tenant.id
        tenant.owner_id = user.id
        await session.flush()
        await session.refresh(user)
        await session.refresh(tenant)

        tenant_role = TenantRole(
            account_id=user.id,
            tenant_id=tenant.id,
            account_type=AccountType.OWNER,
        )
        session.add(tenant_role)
        await session.flush()

        return user, tenant, tenant_role

    async def create_user_for_tenant(
        self,
        session: AsyncSession,
        email: str,
        password: str,
        tenant_id: UUID,
        account_type: AccountType,
        name: str | None = None,
        surname: str | None = None,
        force_password_change: bool = False,
    ) -> tuple[User, TenantRole, bool]:
        existing_user = await session.scalar(select(User).where(User.email == email))
        if existing_user:
            existing_role = await session.scalar(
                select(TenantRole).where(
                    TenantRole.account_id == existing_user.id,
                    TenantRole.tenant_id == tenant_id,
                )
            )
            if existing_role is not None:
                msg = "User already belongs to this tenant"
                raise ConflictError(msg)
            if account_type == AccountType.WAITER and name is not None and surname is not None:
                existing_user.name = name
                existing_user.surname = surname
            tenant_role = TenantRole(
                account_id=existing_user.id,
                tenant_id=tenant_id,
                account_type=account_type,
            )
            session.add(tenant_role)
            await session.flush()
            return existing_user, tenant_role, False

        user = User(
            email=email,
            name=name if account_type == AccountType.WAITER else None,
            surname=surname if account_type == AccountType.WAITER else None,
            password_hash=self.security.hash_password(password),
            is_active=False,
            tenant_id=tenant_id,
            force_password_change=force_password_change,
        )
        session.add(user)
        await session.flush()
        await session.refresh(user)

        tenant_role = TenantRole(
            account_id=user.id,
            tenant_id=tenant_id,
            account_type=account_type,
        )
        session.add(tenant_role)
        await session.flush()

        return user, tenant_role, True
