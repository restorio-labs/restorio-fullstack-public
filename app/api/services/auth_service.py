from datetime import UTC, datetime, timedelta
import hashlib
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    BadRequestError,
    ConflictError,
    ExternalAPIError,
    GoneError,
    NotFoundResponse,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnauthorizedError,
)
from core.foundation.security import SecurityService
from core.models.activation_link import ActivationLink
from core.models.enums import TenantStatus
from core.models.password_reset_token import PasswordResetToken
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User


class AuthService:
    def __init__(self, security: SecurityService) -> None:
        self._resend_cooldown_seconds = 300
        self.security = security

    async def create_user(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> User:
        existing_user = await session.scalar(select(User).where(User.email == email))
        if existing_user:
            msg = "Email already registered"
            raise ConflictError(msg)

        user = User(
            email=email,
            password_hash=self.security.hash_password(password),
            is_active=False,
        )
        session.add(user)
        await session.flush()
        await session.refresh(user)

        return user

    async def create_activation_link(
        self,
        session: AsyncSession,
        email: str,
        user_id: UUID,
        tenant_id: UUID | None = None,
    ) -> ActivationLink:
        activation_link = ActivationLink(
            email=email,
            user_id=user_id,
            tenant_id=tenant_id,
            expires_at=datetime.now(tz=UTC) + timedelta(hours=24),
        )
        session.add(activation_link)
        await session.flush()
        await session.refresh(activation_link)
        return activation_link

    async def activate_account(
        self,
        session: AsyncSession,
        activation_id: UUID,
    ) -> tuple[Tenant | None, bool]:
        """Returns (tenant_or_none, already_activated)."""
        activation_link = await session.get(ActivationLink, activation_id)
        if activation_link is None:
            msg = "Activation link not found"
            raise NotFoundResponse(msg, str(activation_id))

        now = datetime.now(tz=UTC)
        if activation_link.expires_at < now:
            msg = "Activation link has expired"
            raise GoneError(msg)

        tenant: Tenant | None = None
        if activation_link.tenant_id is not None:
            tenant = await session.get(Tenant, activation_link.tenant_id)
            if tenant is None:
                msg = "Account"
                raise NotFoundResponse(msg, "activation link")

        if activation_link.used_at is not None:
            return tenant, True

        user = await session.get(User, activation_link.user_id)
        if user is None:
            msg = "Account"
            raise NotFoundResponse(msg, "activation link")
        user.is_active = True
        if tenant is not None:
            tenant.status = TenantStatus.ACTIVE
        activation_link.used_at = now
        return tenant, False

    async def resend_activation_link(
        self,
        session: AsyncSession,
        activation_id: UUID,
    ) -> tuple[ActivationLink, Tenant | None]:
        """Resend only when link is expired. Cooldown is per activation link (last_resend_at)."""
        activation_link = await session.get(ActivationLink, activation_id)
        if activation_link is None:
            msg = "Activation link"
            raise NotFoundResponse(msg, str(activation_id))

        now = datetime.now(tz=UTC)
        if activation_link.used_at is not None:
            msg = "Account already activated"
            raise BadRequestError(msg)
        if activation_link.expires_at >= now:
            msg = "Activation link has not expired yet"
            raise BadRequestError(msg)

        if activation_link.last_resend_at is not None:
            elapsed = (now - activation_link.last_resend_at).total_seconds()
            if elapsed < self._resend_cooldown_seconds:
                msg = "Please wait before requesting another activation email."
                raise TooManyRequestsError(msg)

        activation_link.last_resend_at = now

        tenant: Tenant | None = None
        if activation_link.tenant_id is not None:
            tenant = await session.get(Tenant, activation_link.tenant_id)
            if tenant is None:
                msg = "Account"
                raise NotFoundResponse(msg, "activation link")

        new_link = ActivationLink(
            email=activation_link.email,
            user_id=activation_link.user_id,
            tenant_id=activation_link.tenant_id,
            expires_at=now + timedelta(hours=24),
        )
        session.add(new_link)
        await session.flush()
        await session.refresh(new_link)
        return new_link, tenant

    async def login(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> str:
        user = await session.scalar(select(User).where(User.email == email))
        if user is None or not self.security.verify_password(password, user.password_hash):
            msg = "Invalid credentials"
            raise UnauthorizedError(msg)

        if not user.is_active:
            msg = "Account is not active"
            raise UnauthorizedError(msg)

        tenant_ids_result = await session.scalars(
            select(TenantRole.tenant_id).where(TenantRole.account_id == user.id)
        )
        tenant_role_ids = list(tenant_ids_result.all())

        if not tenant_role_ids and user.tenant_id is not None:
            tenant_role_ids = [user.tenant_id]

        tenant_public_ids: list[str] = []
        if tenant_role_ids:
            rows = await session.execute(
                select(Tenant.public_id).where(Tenant.id.in_(tenant_role_ids))
            )
            tenant_public_ids = [row[0] for row in rows.all()]

        role: TenantRole | None = None

        if role is None:
            role = await session.scalar(
                select(TenantRole).where(TenantRole.account_id == user.id).limit(1)
            )

        token_data: dict[str, str | list[str] | None] = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_ids": tenant_public_ids,
        }
        if role is not None:
            token_data["account_type"] = role.account_type.value

        return self.security.create_access_token(data=token_data)

    async def request_password_reset(
        self, session: AsyncSession, email: str
    ) -> PasswordResetToken | None:
        normalized = email.strip()
        user = await session.scalar(select(User).where(User.email == normalized))
        if user is None or not user.is_active:
            return None
        await session.execute(
            delete(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
        )
        token = PasswordResetToken(
            email=user.email,
            user_id=user.id,
            expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
        )
        session.add(token)
        await session.flush()
        await session.refresh(token)
        return token

    async def complete_password_reset(
        self,
        session: AsyncSession,
        reset_token_id: UUID,
        password: str,
    ) -> UUID:
        token = await session.get(PasswordResetToken, reset_token_id)
        if token is None:
            msg = "Password reset link not found"
            raise NotFoundResponse(msg, str(reset_token_id))

        now = datetime.now(tz=UTC)
        if token.expires_at < now:
            msg = "Password reset link has expired"
            raise GoneError(msg)
        if token.used_at is not None:
            msg = "Password reset link has already been used"
            raise BadRequestError(msg)

        user = await session.get(User, token.user_id)
        if user is None:
            msg = "Account"
            raise NotFoundResponse(msg, "password reset")

        user.password_hash = self.security.hash_password(password)
        user.force_password_change = False
        token.used_at = now
        return user.id

    async def check_password_pwned(self, password: str) -> None:
        """Check password against HaveIBeenPwned Pwned Passwords (k-anonymity range lookup).

        Only the first 5 characters of the SHA-1 hash are transmitted.
        Raises BadRequestError if the password appears in known data breaches.
        Silently passes on connectivity issues to avoid blocking registration.
        """

        sha1 = hashlib.sha1(password.encode("utf-8"), usedforsecurity=False).hexdigest().upper()
        prefix, suffix = sha1[:5], sha1[5:]

        try:
            raw = await self.external_client.external_get(
                f"{self._hibp_url}{prefix}",
                headers={"Add-Padding": "true"},
                service_name="HaveIBeenPwned",
            )
        except (ExternalAPIError, ServiceUnavailableError):
            return

        for line in raw.splitlines():
            if ":" not in line:
                continue
            line_suffix, _, count_str = line.partition(":")
            if line_suffix.upper() == suffix:
                count = int(count_str.strip())
                msg = (
                    f"This password has appeared in {count:,} known data breach(es). "
                    "Please choose a different password."
                )
                raise BadRequestError(msg)
