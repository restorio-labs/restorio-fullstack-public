from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.constants import KITCHEN_CONFIG_COLLECTION

DEFAULT_REJECTION_LABELS: list[str] = [
    "Brak składników",
    "Kuchnia zamknięta",
    "Zbyt duże obciążenie",
    "Pozycja niedostępna",
    "Inne",
]


class KitchenConfigService:
    async def get_config(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_CONFIG_COLLECTION].find_one({"restaurantId": restaurant_id})
        if not doc:
            return {
                "restaurantId": restaurant_id,
                "rejectionLabels": DEFAULT_REJECTION_LABELS,
            }

        return {
            "restaurantId": restaurant_id,
            "rejectionLabels": doc.get("rejectionLabels", DEFAULT_REJECTION_LABELS),
        }

    async def update_rejection_labels(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        labels: list[str],
    ) -> dict[str, Any]:
        await db[KITCHEN_CONFIG_COLLECTION].update_one(
            {"restaurantId": restaurant_id},
            {"$set": {"restaurantId": restaurant_id, "rejectionLabels": labels}},
            upsert=True,
        )
        return {
            "restaurantId": restaurant_id,
            "rejectionLabels": labels,
        }
