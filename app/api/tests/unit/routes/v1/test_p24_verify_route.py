from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1.payments import VerifyP24TransactionDTO
from core.exceptions import NotFoundResponse
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from routes.v1.payments import p24_verify


@pytest.mark.asyncio
async def test_verify_p24_transaction_success() -> None:
    sid = uuid4()
    tid = uuid4()
    tx = SimpleNamespace(session_id=sid, tenant_id=tid)
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=tx)
    session = MagicMock()
    session.execute = AsyncMock(return_value=r1)
    session.commit = AsyncMock()

    tenant = Tenant(
        id=tid,
        public_id="pub",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    tenant_svc = MagicMock()
    tenant_svc.get_tenant = AsyncMock(return_value=tenant)
    p24 = MagicMock()
    p24.verify_transaction_at_przelewy24 = AsyncMock(return_value={"ok": True})
    ext = MagicMock()

    out = await p24_verify.verify_p24_transaction(
        AccountType.OWNER,
        VerifyP24TransactionDTO(session_id=sid),
        tid,
        session,  # type: ignore[arg-type]
        tenant_svc,
        p24,
        ext,
    )
    assert out.data == {"ok": True}
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_verify_p24_transaction_missing() -> None:
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=None)
    session = MagicMock()
    session.execute = AsyncMock(return_value=r1)
    missing_sid = uuid4()

    with pytest.raises(NotFoundResponse):
        await p24_verify.verify_p24_transaction(
            AccountType.OWNER,
            VerifyP24TransactionDTO(session_id=missing_sid),
            uuid4(),
            session,  # type: ignore[arg-type]
            MagicMock(),
            MagicMock(),
            MagicMock(),
        )
