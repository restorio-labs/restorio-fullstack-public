import pytest

from core.foundation.database import database


class FakeSession:
    def __init__(self) -> None:
        self.committed = False
        self.rolled_back = False
        self.closed = False

    async def commit(self) -> None:
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True

    async def close(self) -> None:
        self.closed = True


class FakeSessionContext:
    def __init__(self, session: FakeSession) -> None:
        self._session = session

    async def __aenter__(self) -> FakeSession:
        return self._session

    async def __aexit__(self, exc_type, exc, tb) -> None:  # type: ignore[no-untyped-def]
        return None


@pytest.mark.asyncio
async def test_get_db_session_commit(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_session = FakeSession()

    def fake_sessionmaker(*_: object, **__: object) -> FakeSessionContext:
        return FakeSessionContext(fake_session)

    monkeypatch.setattr(database, "AsyncSessionLocal", fake_sessionmaker)

    gen = database.get_db_session()
    session = await gen.__anext__()

    assert session is fake_session

    with pytest.raises(StopAsyncIteration):
        await gen.__anext__()

    assert fake_session.committed is True
    assert fake_session.rolled_back is False
    assert fake_session.closed is True


@pytest.mark.asyncio
async def test_get_db_session_rollback_on_error(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_session = FakeSession()

    def fake_sessionmaker(*_: object, **__: object) -> FakeSessionContext:
        return FakeSessionContext(fake_session)

    monkeypatch.setattr(database, "AsyncSessionLocal", fake_sessionmaker)

    gen = database.get_db_session()
    session = await gen.__anext__()

    assert session is fake_session

    with pytest.raises(RuntimeError):
        await gen.athrow(RuntimeError("failure"))

    assert fake_session.committed is False
    assert fake_session.rolled_back is True
    assert fake_session.closed is True
