from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions.http import ForbiddenError, UnauthorizedError
from core.foundation.tenant_guard import _extract_tenant_public_ids, resolve_and_authorize_tenant


class TestExtractTenantPublicIds:
    def test_returns_tenant_ids_list(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_ids": ["abc123", "def456"]}

        result = _extract_tenant_public_ids(request)

        assert result == ["abc123", "def456"]

    def test_filters_non_string_entries(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_ids": ["abc123", 42, None, "", "def456"]}

        result = _extract_tenant_public_ids(request)

        assert result == ["abc123", "def456"]

    def test_returns_empty_list_when_no_tenant_ids(self) -> None:
        request = MagicMock()
        request.state.user = {"sub": "user-1"}

        result = _extract_tenant_public_ids(request)

        assert result == []

    def test_falls_back_to_single_tenant_id_claim(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_id": "pub-single"}

        result = _extract_tenant_public_ids(request)

        assert result == ["pub-single"]

    def test_raises_unauthorized_when_no_user(self) -> None:
        request = MagicMock()
        request.state.user = None

        with pytest.raises(UnauthorizedError):
            _extract_tenant_public_ids(request)

    def test_raises_unauthorized_when_user_not_dict(self) -> None:
        request = MagicMock()
        request.state.user = "not-a-dict"

        with pytest.raises(UnauthorizedError):
            _extract_tenant_public_ids(request)


class TestResolveAndAuthorizeTenant:
    @pytest.mark.asyncio
    async def test_returns_internal_id_for_authorized_tenant(self) -> None:
        internal_id = uuid4()
        request = MagicMock()
        request.state.user = {"tenant_ids": ["pub-abc"]}

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = internal_id
        session = AsyncMock()
        session.execute.return_value = mock_result

        result = await resolve_and_authorize_tenant("pub-abc", request, session)

        assert result == internal_id

    @pytest.mark.asyncio
    async def test_raises_forbidden_when_public_id_not_in_token(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_ids": ["pub-abc"], "sub": str(uuid4())}

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session = AsyncMock()
        session.execute.return_value = mock_result

        with pytest.raises(ForbiddenError):
            await resolve_and_authorize_tenant("pub-other", request, session)

    @pytest.mark.asyncio
    async def test_allows_access_when_not_in_token_but_user_has_role_in_db(self) -> None:
        user_id = uuid4()
        internal_id = uuid4()
        request = MagicMock()
        request.state.user = {"tenant_ids": ["pub-abc"], "sub": str(user_id)}

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = internal_id
        session = AsyncMock()
        session.execute.return_value = mock_result

        result = await resolve_and_authorize_tenant("pub-other", request, session)

        assert result == internal_id

    @pytest.mark.asyncio
    async def test_raises_forbidden_when_no_tenant_access(self) -> None:
        request = MagicMock()
        request.state.user = {"sub": "user-1"}

        session = AsyncMock()

        with pytest.raises(ForbiddenError):
            await resolve_and_authorize_tenant("pub-abc", request, session)

    @pytest.mark.asyncio
    async def test_raises_forbidden_when_tenant_not_found_in_db(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_ids": ["pub-abc"]}

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session = AsyncMock()
        session.execute.return_value = mock_result

        with pytest.raises(ForbiddenError):
            await resolve_and_authorize_tenant("pub-abc", request, session)

    @pytest.mark.asyncio
    async def test_raises_access_denied_when_subject_invalid_and_tenant_ids_exist(self) -> None:
        request = MagicMock()
        request.state.user = {"tenant_ids": ["pub-abc"], "sub": "not-a-uuid"}

        session = AsyncMock()

        with pytest.raises(ForbiddenError) as exc_info:
            await resolve_and_authorize_tenant("pub-other", request, session)

        assert exc_info.value.detail == "Access denied to this tenant"

    @pytest.mark.asyncio
    async def test_raises_no_tenant_access_when_subject_valid_but_db_has_no_role(self) -> None:
        user_id = uuid4()
        request = MagicMock()
        request.state.user = {"sub": str(user_id)}

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session = AsyncMock()
        session.execute.return_value = mock_result

        with pytest.raises(ForbiddenError) as exc_info:
            await resolve_and_authorize_tenant("pub-abc", request, session)

        assert exc_info.value.detail == "No tenant access"
