import pytest

from core.foundation import dependencies


class DummyMongoDatabase:
    pass


@pytest.mark.asyncio
async def test_get_mongo_database(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get_mongo_db() -> DummyMongoDatabase:
        return DummyMongoDatabase()

    monkeypatch.setattr(dependencies, "get_mongo_db", fake_get_mongo_db)

    database = await dependencies.get_mongo_database()

    assert isinstance(database, DummyMongoDatabase)


def test_get_security_service_returns_singleton() -> None:
    service = dependencies.get_security_service()
    assert service is dependencies.security_service


def test_get_user_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyUserService:
        def __init__(self, security: object) -> None:
            self.security = security

    monkeypatch.setattr(dependencies, "UserService", DummyUserService)
    service = dependencies.get_user_service()
    assert isinstance(service, DummyUserService)


def test_get_auth_service_uses_passed_security(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyAuthService:
        def __init__(self, security: object) -> None:
            self.security = security

    monkeypatch.setattr(dependencies, "AuthService", DummyAuthService)
    security = object()

    service = dependencies.get_auth_service(security=security)

    assert isinstance(service, DummyAuthService)
    assert service.security is security


def test_get_email_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyEmailService:
        pass

    monkeypatch.setattr(dependencies, "EmailService", DummyEmailService)
    service = dependencies.get_email_service()
    assert isinstance(service, DummyEmailService)


def test_get_tenant_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyTenantService:
        pass

    monkeypatch.setattr(dependencies, "TenantService", DummyTenantService)
    service = dependencies.get_tenant_service()
    assert isinstance(service, DummyTenantService)


def test_get_floor_canvas_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyFloorCanvasService:
        pass

    monkeypatch.setattr(dependencies, "FloorCanvasService", DummyFloorCanvasService)
    service = dependencies.get_floor_canvas_service()
    assert isinstance(service, DummyFloorCanvasService)


def test_get_p24_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyP24Service:
        pass

    monkeypatch.setattr(dependencies, "P24Service", DummyP24Service)
    service = dependencies.get_p24_service()
    assert isinstance(service, DummyP24Service)


def test_get_tenant_profile_service_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyTenantProfileService:
        pass

    monkeypatch.setattr(dependencies, "TenantProfileService", DummyTenantProfileService)
    service = dependencies.get_tenant_profile_service()
    assert isinstance(service, DummyTenantProfileService)


def test_get_tenant_logo_storage_service_returns_singleton(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    singleton = object()
    monkeypatch.setattr(dependencies, "tenant_logo_storage_service", singleton)
    assert dependencies.get_tenant_logo_storage_service() is singleton


def test_get_external_client_returns_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyExternalClient:
        pass

    monkeypatch.setattr(dependencies, "ExternalClient", DummyExternalClient)
    service = dependencies.get_external_client()
    assert isinstance(service, DummyExternalClient)
