from unittest.mock import MagicMock

import pytest

from routes.v1 import kitchen_config as kitchen_config_routes


@pytest.mark.asyncio
async def test_get_kitchen_config_returns_success_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get_config(_db: object, restaurant_id: str) -> dict[str, object]:
        return {"restaurantId": restaurant_id, "rejectionLabels": ["L1"]}

    monkeypatch.setattr(kitchen_config_routes._service, "get_config", fake_get_config)

    response = await kitchen_config_routes.get_kitchen_config(
        "rid-a",
        MagicMock(),
        MagicMock(),
        MagicMock(),
    )

    assert response.message == "Kitchen config retrieved successfully"
    assert response.data.restaurant_id == "rid-a"
    assert response.data.rejection_labels == ["L1"]


@pytest.mark.asyncio
async def test_update_rejection_labels_returns_updated_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_update(_db: object, restaurant_id: str, labels: list[str]) -> dict[str, object]:
        return {"restaurantId": restaurant_id, "rejectionLabels": labels}

    monkeypatch.setattr(kitchen_config_routes._service, "update_rejection_labels", fake_update)
    payload = kitchen_config_routes.UpdateRejectionLabelsDTO(rejectionLabels=["A", "B"])

    response = await kitchen_config_routes.update_rejection_labels(
        "rid-b",
        payload,
        MagicMock(),
        MagicMock(),
        MagicMock(),
    )

    assert response.message == "Rejection labels updated successfully"
    assert response.data.restaurant_id == "rid-b"
    assert response.data.rejection_labels == ["A", "B"]
