from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import ConflictError
from core.foundation.security import SecurityService
from core.models.user import User
from services.auth_service import AuthService


@pytest.mark.asyncio
async def test_create_user_raises_when_email_exists() -> None:
    existing = User(
        id=uuid4(),
        email="taken@e.com",
        password_hash="h",
        is_active=True,
    )
    session = MagicMock()
    session.scalar = AsyncMock(return_value=existing)
    with pytest.raises(ConflictError, match="registered"):
        await AuthService(security=SecurityService()).create_user(
            session,
            "taken@e.com",
            "Str0ng!Pass-99",
        )


@pytest.mark.asyncio
async def test_create_user_persists_when_email_free() -> None:
    session = MagicMock()
    session.scalar = AsyncMock(return_value=None)
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    out = await AuthService(security=SecurityService()).create_user(
        session, "new@e.com", "Str0ng!Pass-99"
    )
    assert out.email == "new@e.com"
    session.add.assert_called_once()
    session.flush.assert_awaited_once()
    session.refresh.assert_awaited_once()
