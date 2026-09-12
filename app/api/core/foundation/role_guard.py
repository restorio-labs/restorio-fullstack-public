"""Role-based authorization dependencies.

Usage in routes::

    from core.foundation.role_guard import RequireOwner, RequireManager

    @router.post("/...", dependencies=[Depends(RequireOwner)])
    async def owner_only_endpoint(...): ...

Or as a typed dependency for the resolved role::

    async def endpoint(role: RequireOwnerOrManager): ...
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from core.exceptions.http import ForbiddenError, UnauthorizedError
from core.models.enums import AccountType


def _extract_account_type(request: Request) -> AccountType:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthorizedError(message="Unauthorized")

    raw = user.get("account_type")
    if not isinstance(raw, str) or not raw:
        raise ForbiddenError(message="No role assigned")

    try:
        return AccountType(raw)
    except ValueError:
        raise ForbiddenError(message="Unknown role") from None


def require_roles(*allowed: AccountType):
    """Factory that returns a dependency enforcing one or more allowed roles."""

    async def _guard(request: Request) -> AccountType:
        role = _extract_account_type(request)
        if role not in allowed:
            raise ForbiddenError(message="Insufficient permissions")
        return role

    return _guard


_require_owner = require_roles(AccountType.OWNER)
_require_owner_or_manager = require_roles(AccountType.OWNER, AccountType.MANAGER)
_require_any_staff = require_roles(
    AccountType.OWNER, AccountType.MANAGER, AccountType.WAITER, AccountType.KITCHEN
)


async def _require_owner_or_no_role(request: Request) -> AccountType | None:
    """Allows OWNER or users with no role yet (first tenant creation)."""
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthorizedError(message="Unauthorized")

    raw = user.get("account_type")
    if not isinstance(raw, str) or not raw:
        return None

    try:
        role = AccountType(raw)
    except ValueError:
        raise ForbiddenError(message="Unknown role") from None

    if role != AccountType.OWNER:
        raise ForbiddenError(message="Insufficient permissions")
    return role


RequireOwner = Annotated[AccountType, Depends(_require_owner)]
RequireOwnerOrManager = Annotated[AccountType, Depends(_require_owner_or_manager)]
RequireAnyStaff = Annotated[AccountType, Depends(_require_any_staff)]
RequireOwnerOrNoRole = Annotated[AccountType | None, Depends(_require_owner_or_no_role)]
