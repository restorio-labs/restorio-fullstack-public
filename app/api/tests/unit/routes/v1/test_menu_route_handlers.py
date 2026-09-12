from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException
import pytest
from starlette import status as http_status

from core.dto.v1 import (
    MenuCategoryInputDTO,
    MenuItemInputDTO,
    ToggleItemAvailabilityDTO,
    UpsertTenantMenuDTO,
)
from core.dto.v1.tenants.mobile_config import (
    MenuImageFinalizeRequestDTO,
    MenuImagePresignRequestDTO,
)
from core.models.enums import AccountType
from routes.v1.tenants import menu as menu_routes
from services.mongo_menu_service import (
    CATEGORY_META_KEY,
    MENU_COLLECTION,
    normalize_mongo_menu_categories,
)


class _MongoWithCollection:
    def __init__(self, collection: MagicMock) -> None:
        self._collection = collection

    def __getitem__(self, name: str) -> MagicMock:
        assert name == MENU_COLLECTION
        return self._collection


@pytest.mark.asyncio
async def test_validate_payload_raises_on_duplicate_category_order() -> None:
    payload = UpsertTenantMenuDTO(
        categories=[
            MenuCategoryInputDTO(name="A", order=1, items=[]),
            MenuCategoryInputDTO(name="B", order=1, items=[]),
        ]
    )
    with pytest.raises(HTTPException) as e:
        menu_routes._validate_payload(payload)
    assert e.value.status_code == http_status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_validate_payload_raises_on_duplicate_item_name() -> None:
    payload = UpsertTenantMenuDTO(
        categories=[
            MenuCategoryInputDTO(
                name="A",
                order=1,
                items=[
                    MenuItemInputDTO(name="Same", price=1),
                    MenuItemInputDTO(name="SAME", price=2),
                ],
            )
        ]
    )
    with pytest.raises(HTTPException) as e:
        menu_routes._validate_payload(payload)
    assert e.value.status_code == http_status.HTTP_400_BAD_REQUEST
    assert "Duplicate item name" in str(e.value.detail)


@pytest.mark.asyncio
async def test_build_raw_menu() -> None:
    payload = UpsertTenantMenuDTO(
        categories=[
            MenuCategoryInputDTO(
                name="Starters",
                order=0,
                items=[
                    MenuItemInputDTO(
                        name="Soup",
                        price=5,
                        promoted=True,
                        desc="d",
                        tags=["a"],
                        image_url="https://i/x",
                        is_available=True,
                    )
                ],
            )
        ]
    )
    raw = menu_routes._build_raw_menu(payload)
    assert "0" in raw
    assert "Soup" in raw["0"]


def test_normalize_categories_with_non_dict_category_skipped() -> None:
    out = normalize_mongo_menu_categories(
        {
            "1": "not a dict",
            "2": {CATEGORY_META_KEY: {"name": "C", "order": 2}},
        }
    )
    assert any(c.name == "C" for c in out)


def test_normalize_categories_item_types() -> None:
    raw = {
        "1": {
            CATEGORY_META_KEY: {"name": "X", "order": 1},
            "It": {
                "price": "nope",
                "promoted": None,
                "desc": 5,
                "tags": "bad",
                "isAvailable": None,
                "imageUrl": 12,
            },
        }
    }
    cats = normalize_mongo_menu_categories(raw)
    assert len(cats) == 1
    item = cats[0].items[0]
    assert item.price == 0.0
    assert item.desc == ""


@pytest.mark.asyncio
async def test_get_tenant_menu_not_created() -> None:
    coll = MagicMock()
    coll.find_one = AsyncMock(return_value=None)
    db = _MongoWithCollection(coll)

    r = await menu_routes.get_tenant_menu("tpub1", db, uuid4())  # type: ignore[arg-type]
    assert "not yet" in r.message
    assert r.data.categories == []


@pytest.mark.asyncio
async def test_get_tenant_menu_with_doc() -> None:
    coll = MagicMock()
    coll.find_one = AsyncMock(
        return_value={
            "menu": {"0": {CATEGORY_META_KEY: {"name": "M", "order": 0}}},
            "updatedAt": datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC),
        }
    )
    db = _MongoWithCollection(coll)

    r = await menu_routes.get_tenant_menu("tpub1", db, uuid4())  # type: ignore[arg-type]
    assert "retrieved" in r.message


@pytest.mark.asyncio
async def test_upsert_tenant_menu() -> None:
    coll = MagicMock()
    coll.update_one = AsyncMock()
    db = _MongoWithCollection(coll)

    payload = UpsertTenantMenuDTO(
        categories=[
            MenuCategoryInputDTO(name="A", order=0, items=[MenuItemInputDTO(name="B", price=1)])
        ]
    )
    with patch("routes.v1.tenants.menu.datetime") as dt:
        fixed = datetime(2026, 1, 1, tzinfo=UTC)
        dt.now.return_value = fixed
        r = await menu_routes.upsert_tenant_menu(  # type: ignore[call-arg]
            "tpub1",
            payload,
            db,  # type: ignore[arg-type]
            uuid4(),
            AccountType.OWNER,
        )
    assert "saved" in r.message
    assert r.data.menu


@pytest.mark.asyncio
async def test_toggle_item_availability_404_no_menu() -> None:
    coll = MagicMock()
    coll.find_one = AsyncMock(return_value=None)
    db = _MongoWithCollection(coll)

    with pytest.raises(HTTPException) as e:
        await menu_routes.toggle_item_availability(
            "t1",
            0,
            "n",
            ToggleItemAvailabilityDTO(is_available=True),  # type: ignore[call-arg]
            db,  # type: ignore[arg-type]
            uuid4(),
            AccountType.WAITER,
        )
    assert e.value.status_code == http_status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_toggle_item_availability_404_item_missing() -> None:
    coll = MagicMock()
    coll.find_one = AsyncMock(
        return_value={
            "menu": {
                "1": {
                    CATEGORY_META_KEY: {"name": "C", "order": 1},
                }
            }
        }
    )
    db = _MongoWithCollection(coll)

    with pytest.raises(HTTPException) as e:
        await menu_routes.toggle_item_availability(
            "t1",
            1,
            "MissingItem",
            ToggleItemAvailabilityDTO(is_available=True),  # type: ignore[call-arg]
            db,  # type: ignore[arg-type]
            uuid4(),
            AccountType.WAITER,
        )
    assert e.value.status_code == http_status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_toggle_item_availability_success() -> None:
    coll = MagicMock()
    coll.find_one = AsyncMock(
        side_effect=[
            {
                "menu": {
                    "1": {
                        CATEGORY_META_KEY: {"name": "C", "order": 1},
                        "Soup": {"price": 1, "isAvailable": True},
                    }
                }
            },
            {
                "menu": {
                    "1": {
                        CATEGORY_META_KEY: {"name": "C", "order": 1},
                        "Soup": {"price": 1, "isAvailable": False},
                    }
                }
            },
        ]
    )
    coll.update_one = AsyncMock()
    db = _MongoWithCollection(coll)

    with patch("routes.v1.tenants.menu.datetime") as dt:
        fixed = datetime(2026, 1, 2, tzinfo=UTC)
        dt.now.return_value = fixed
        r = await menu_routes.toggle_item_availability(
            "t1",
            1,
            "Soup",
            ToggleItemAvailabilityDTO(is_available=False),  # type: ignore[call-arg]
            db,  # type: ignore[arg-type]
            uuid4(),
            AccountType.WAITER,
        )
    assert "updated" in r.message


@pytest.mark.asyncio
async def test_presign_and_finalize_image_routes() -> None:
    storage = MagicMock()
    storage.create_presigned_upload.return_value = ("u", "k1")
    storage.finalize_upload.return_value = SimpleNamespace(public_url="https://img")

    pr = await menu_routes.presign_menu_item_image(
        AccountType.OWNER,
        uuid4(),
        MenuImagePresignRequestDTO(content_type="image/png"),  # type: ignore[call-arg]
        storage,
    )
    assert pr.data.upload_url == "u"

    fr = await menu_routes.finalize_menu_item_image(
        AccountType.OWNER,
        uuid4(),
        MenuImageFinalizeRequestDTO(object_key="k1"),  # type: ignore[call-arg]
        storage,
    )
    assert fr.data.image_url == "https://img"
