from uuid import UUID, uuid4

from core.foundation.security import SecurityService
from core.models.activation_link import ActivationLink
from core.models.tenant import Tenant
from core.models.user import User
from services.auth_service import AuthService

auth_service = AuthService(security=SecurityService())


class FakeAsyncSession:
    def __init__(self) -> None:
        self.users: list[User] = []
        self.tenants: list[Tenant] = []
        self.activation_links: list[ActivationLink] = []
        self.added_objects: list[object] = []

    async def scalar(self, query: object) -> object | None:
        query_str = str(query)
        query_params: dict[str, object] = {}
        if hasattr(query, "compile"):
            query_params = query.compile().params

        if "users.email" in query_str:
            email = next(iter(query_params.values()), None)
            return next((u for u in self.users if u.email == email), None)
        if "tenant_roles" in query_str:
            for param in query_params.values():
                if not isinstance(param, UUID):
                    continue
                for tr in getattr(self, "tenant_roles", []):
                    if tr.account_id == param:
                        return tr
        return None

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def get(self, entity_cls: type, pk: object) -> object | None:
        if entity_cls is ActivationLink:
            return next((a for a in self.activation_links if a.id == pk), None)
        if entity_cls is User:
            return next((u for u in self.users if u.id == pk), None)
        if entity_cls is Tenant:
            return next((t for t in self.tenants if t.id == pk), None)
        return None

    async def flush(self) -> None:
        for obj in self.added_objects:
            if isinstance(obj, ActivationLink):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.activation_links.append(obj)
        self.added_objects.clear()

    async def refresh(self, obj: object) -> None:
        pass

    async def scalars(self, query: object) -> "FakeScalarResult":
        query_str = str(query)
        if "tenant_roles.tenant_id" in query_str:
            query_params: dict[str, object] = {}
            if hasattr(query, "compile"):
                query_params = query.compile().params
            param_values = set(query_params.values())
            matching = [
                tr.tenant_id
                for tr in getattr(self, "tenant_roles", [])
                if tr.account_id in param_values
            ]
            return FakeScalarResult(matching)
        return FakeScalarResult([])

    async def execute(self, query: object) -> "FakeExecuteResult":
        query_str = str(query)
        if "tenants.public_id" in query_str:
            query_params: dict[str, object] = {}
            if hasattr(query, "compile"):
                query_params = query.compile().params
            flat_values: list[object] = []
            for v in query_params.values():
                if isinstance(v, list):
                    flat_values.extend(v)
                else:
                    flat_values.append(v)
            rows = [(t.public_id,) for t in self.tenants if t.id in flat_values]
            return FakeExecuteResult(rows)
        if "tenant_roles" in query_str:
            query_params2: dict[str, object] = {}
            if hasattr(query, "compile"):
                query_params2 = query.compile().params
            param_values2 = {v for v in query_params2.values() if not isinstance(v, list)}
            matching = [
                tr for tr in getattr(self, "tenant_roles", []) if tr.account_id in param_values2
            ]
            return FakeExecuteResult(matching[:1] if matching else [])
        return FakeExecuteResult([])


class FakeScalarResult:
    def __init__(self, items: list) -> None:
        self._items = items

    def __iter__(self) -> object:
        return iter(self._items)

    def all(self) -> list:
        return self._items


class FakeExecuteResult:
    def __init__(self, items: list) -> None:
        self._items = items

    def all(self) -> list:
        return self._items

    def scalar_one_or_none(self) -> object | None:
        return self._items[0] if self._items else None
