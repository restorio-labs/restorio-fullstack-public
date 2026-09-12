import string
from uuid import uuid4

import pytest

from core.exceptions import ConflictError
from core.foundation.security import SecurityService
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User
from services.user_service import UserService

user_service = UserService(security=SecurityService())
PASSWORD_HASH_MIN_LENGTH = 50


def test_generate_temporary_password_meets_length_and_charset() -> None:
    expected_len = 24
    pw = user_service.generate_temporary_password(expected_len)
    assert len(pw) == expected_len
    assert any(c in string.ascii_lowercase for c in pw)
    assert any(c in string.ascii_uppercase for c in pw)
    assert any(c.isdigit() for c in pw)
    assert any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in pw)


class FakeAsyncSession:
    def __init__(self) -> None:
        self.users: list[User] = []
        self.tenants: list[Tenant] = []
        self.tenant_roles: list[TenantRole] = []
        self.added_objects: list[object] = []

    async def scalar(self, query: object) -> User | Tenant | TenantRole | None:
        query_str = str(query)
        query_params: dict[str, object] = {}
        if hasattr(query, "compile"):
            compiled = query.compile()
            query_params = dict(compiled.params) if compiled.params else {}

        if "tenant_roles" in query_str and "account_id" in query_str:
            account_id = query_params.get("account_id_1")
            tenant_id = query_params.get("tenant_id_1")
            if account_id is not None and tenant_id is not None:
                return next(
                    (
                        r
                        for r in self.tenant_roles
                        if r.account_id == account_id and r.tenant_id == tenant_id
                    ),
                    None,
                )

        if "users.email" in query_str:
            email = next(iter(query_params.values()), None)
            return next((u for u in self.users if u.email == email), None)
        if "tenants.slug" in query_str:
            slug = next(iter(query_params.values()), None)
            return next((t for t in self.tenants if t.slug == slug), None)
        return None

    def add_all(self, objects: list[object]) -> None:
        self.added_objects.extend(objects)

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def flush(self) -> None:
        for obj in self.added_objects:
            if isinstance(obj, User):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.users.append(obj)
            elif isinstance(obj, Tenant):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.tenants.append(obj)
            elif isinstance(obj, TenantRole):
                self.tenant_roles.append(obj)
        self.added_objects.clear()

    async def refresh(self, obj: object) -> None:
        pass


@pytest.mark.asyncio
async def test_create_user_with_tenant_success() -> None:
    session = FakeAsyncSession()

    user, tenant, tenant_role = await user_service.create_user_with_tenant(
        session=session,
        email="owner@example.com",
        password="secure_password",
        restaurant_name="My Restaurant",
    )

    assert user is not None
    assert user.email == "owner@example.com"
    assert user.is_active is False
    assert user.password_hash != "secure_password"
    assert len(user.password_hash) > 0

    assert tenant is not None
    assert tenant.name == "My Restaurant"
    assert tenant.slug == "myrestaurant"
    assert tenant.status == TenantStatus.INACTIVE
    assert tenant.owner_id == user.id
    assert user.tenant_id == tenant.id

    assert tenant_role.account_id == user.id
    assert tenant_role.tenant_id == tenant.id
    assert tenant_role.account_type == AccountType.OWNER


@pytest.mark.asyncio
async def test_create_user_with_tenant_slug_generation() -> None:
    test_cases = [
        ("My Restaurant", "myrestaurant"),
        ("The Best Pizza", "thebestpizza"),
        ("Café Délice", "cafedelice"),
        ("Zażółć Gęślą Jaźń", "zazolcgeslajazn"),
        ("Restaurant   With   Spaces", "restaurantwithspaces"),
        ("A", "a"),
    ]

    for restaurant_name, expected_slug in test_cases:
        session = FakeAsyncSession()
        _, tenant, _ = await user_service.create_user_with_tenant(
            session=session,
            email=f"owner{expected_slug}@example.com",
            password="password",
            restaurant_name=restaurant_name,
        )
        assert tenant.slug == expected_slug


@pytest.mark.asyncio
async def test_create_user_with_tenant_duplicate_email() -> None:
    session = FakeAsyncSession()

    existing_user = User(
        id=uuid4(),
        email="existing@example.com",
        password_hash="hashed",
        is_active=True,
    )
    session.users.append(existing_user)

    with pytest.raises(ConflictError) as exc_info:
        await user_service.create_user_with_tenant(
            session=session,
            email="existing@example.com",
            password="password",
            restaurant_name="New Restaurant",
        )

    assert "Email already registered" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_user_with_tenant_duplicate_slug() -> None:
    session = FakeAsyncSession()

    existing_tenant = Tenant(
        id=uuid4(),
        name="Existing Restaurant",
        slug="myrestaurant",
        status=TenantStatus.ACTIVE,
    )
    session.tenants.append(existing_tenant)

    with pytest.raises(ConflictError) as exc_info:
        await user_service.create_user_with_tenant(
            session=session,
            email="newowner@example.com",
            password="password",
            restaurant_name="My Restaurant",
        )

    assert "Restaurant slug already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_user_with_tenant_password_is_hashed() -> None:
    session = FakeAsyncSession()

    plain_password = "my_secure_password_123"

    user, _, _ = await user_service.create_user_with_tenant(
        session=session,
        email="test@example.com",
        password=plain_password,
        restaurant_name="Test Restaurant",
    )

    assert user.password_hash != plain_password
    assert user.password_hash.startswith("$2b$")
    assert len(user.password_hash) > PASSWORD_HASH_MIN_LENGTH


@pytest.mark.asyncio
async def test_create_user_with_tenant_role_relationship() -> None:
    session = FakeAsyncSession()

    user, tenant, _ = await user_service.create_user_with_tenant(
        session=session,
        email="owner@example.com",
        password="password",
        restaurant_name="Test Restaurant",
    )

    assert len(session.tenant_roles) == 1
    tenant_role = session.tenant_roles[0]
    assert tenant_role.account_id == user.id
    assert tenant_role.tenant_id == tenant.id
    assert tenant_role.account_type == AccountType.OWNER
    assert tenant.owner_id == user.id
    assert user.tenant_id == tenant.id


@pytest.mark.asyncio
async def test_create_user_for_tenant_success() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()

    user, tenant_role, send_activation_email = await user_service.create_user_for_tenant(
        session=session,
        email="kitchen@example.com",
        password="StrongPass1!",
        tenant_id=tenant_id,
        account_type=AccountType.KITCHEN,
    )

    assert send_activation_email is True
    assert user.email == "kitchen@example.com"
    assert user.is_active is False
    assert user.force_password_change is False
    assert user.tenant_id == tenant_id
    assert user.password_hash != "StrongPass1!"
    assert tenant_role.account_id == user.id
    assert tenant_role.tenant_id == tenant_id
    assert tenant_role.account_type == AccountType.KITCHEN


@pytest.mark.asyncio
async def test_create_user_for_tenant_can_force_password_change() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()

    user, _, send_activation_email = await user_service.create_user_for_tenant(
        session=session,
        email="waiter@example.com",
        password="StrongPass1!",
        tenant_id=tenant_id,
        account_type=AccountType.WAITER,
        force_password_change=True,
    )

    assert send_activation_email is True
    assert user.force_password_change is True


@pytest.mark.asyncio
async def test_create_waiter_for_tenant_stores_name_and_surname() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()

    user, _, _ = await user_service.create_user_for_tenant(
        session=session,
        email="waiter@example.com",
        password="StrongPass1!",
        tenant_id=tenant_id,
        account_type=AccountType.WAITER,
        name="Jan",
        surname="Kowalski",
    )

    assert user.name == "Jan"
    assert user.surname == "Kowalski"


@pytest.mark.asyncio
async def test_create_user_for_tenant_existing_user_new_tenant() -> None:
    session = FakeAsyncSession()
    tenant_a = uuid4()
    tenant_b = uuid4()
    existing = User(
        id=uuid4(),
        email="existing@example.com",
        password_hash="hashed",
        is_active=True,
        tenant_id=tenant_a,
    )
    session.users.append(existing)
    session.tenant_roles.append(
        TenantRole(
            account_id=existing.id,
            tenant_id=tenant_a,
            account_type=AccountType.WAITER,
        )
    )

    user, tenant_role, send_activation_email = await user_service.create_user_for_tenant(
        session=session,
        email="existing@example.com",
        password="StrongPass1!",
        tenant_id=tenant_b,
        account_type=AccountType.KITCHEN,
    )

    assert send_activation_email is False
    assert user.id == existing.id
    assert tenant_role.tenant_id == tenant_b
    assert tenant_role.account_type == AccountType.KITCHEN


@pytest.mark.asyncio
async def test_create_user_for_tenant_user_already_in_tenant() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()
    existing = User(
        id=uuid4(),
        email="existing@example.com",
        password_hash="hashed",
        is_active=True,
    )
    session.users.append(existing)
    session.tenant_roles.append(
        TenantRole(
            account_id=existing.id,
            tenant_id=tenant_id,
            account_type=AccountType.WAITER,
        )
    )

    with pytest.raises(ConflictError) as exc_info:
        await user_service.create_user_for_tenant(
            session=session,
            email="existing@example.com",
            password="StrongPass1!",
            tenant_id=tenant_id,
            account_type=AccountType.KITCHEN,
        )

    assert "User already belongs to this tenant" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_user_for_tenant_relinked_waiter_updates_existing_profile() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()
    existing = User(
        id=uuid4(),
        email="waiter@example.com",
        password_hash="hashed",
        is_active=False,
        name=None,
        surname=None,
    )
    session.users.append(existing)

    user, tenant_role, send_activation_email = await user_service.create_user_for_tenant(
        session=session,
        email="waiter@example.com",
        password="StrongPass1!",
        tenant_id=tenant_id,
        account_type=AccountType.WAITER,
        name="Ada",
        surname="Lovelace",
        force_password_change=True,
    )

    assert user.id == existing.id
    assert user.name == "Ada"
    assert user.surname == "Lovelace"
    assert tenant_role.account_type == AccountType.WAITER
    assert send_activation_email is False
