from unittest.mock import AsyncMock, MagicMock

import pytest

from services.kitchen_config_service import DEFAULT_REJECTION_LABELS, KitchenConfigService


@pytest.mark.asyncio
async def test_get_config_returns_defaults_when_document_missing() -> None:
    service = KitchenConfigService()
    collection = AsyncMock()
    collection.find_one = AsyncMock(return_value=None)
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=collection)

    result = await service.get_config(db, "rest-1")

    assert result == {
        "restaurantId": "rest-1",
        "rejectionLabels": DEFAULT_REJECTION_LABELS,
    }
    collection.find_one.assert_awaited_once_with({"restaurantId": "rest-1"})


@pytest.mark.asyncio
async def test_get_config_returns_stored_labels_when_present() -> None:
    service = KitchenConfigService()
    labels = ["Custom A", "Custom B"]
    collection = AsyncMock()
    collection.find_one = AsyncMock(
        return_value={"restaurantId": "rest-2", "rejectionLabels": labels}
    )
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=collection)

    result = await service.get_config(db, "rest-2")

    assert result["restaurantId"] == "rest-2"
    assert result["rejectionLabels"] == labels


@pytest.mark.asyncio
async def test_get_config_falls_back_to_defaults_when_labels_missing_in_doc() -> None:
    service = KitchenConfigService()
    collection = AsyncMock()
    collection.find_one = AsyncMock(return_value={"restaurantId": "rest-3"})
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=collection)

    result = await service.get_config(db, "rest-3")

    assert result["rejectionLabels"] == DEFAULT_REJECTION_LABELS


@pytest.mark.asyncio
async def test_update_rejection_labels_upserts_and_returns_payload() -> None:
    service = KitchenConfigService()
    collection = AsyncMock()
    collection.update_one = AsyncMock()
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=collection)
    labels = ["One", "Two"]

    result = await service.update_rejection_labels(db, "rest-4", labels)

    assert result == {"restaurantId": "rest-4", "rejectionLabels": labels}
    collection.update_one.assert_awaited_once_with(
        {"restaurantId": "rest-4"},
        {"$set": {"restaurantId": "rest-4", "rejectionLabels": labels}},
        upsert=True,
    )
