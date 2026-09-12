from core.constants import MENUS_COLLECTION
from core.dto.v1.menus import MenuCategoryDTO, MenuItemDTO

MENU_COLLECTION = MENUS_COLLECTION
CATEGORY_META_KEY = "__category"


def normalize_mongo_menu_categories(
    raw_menu: dict[str, dict],
    *,
    active_items_only: bool = False,
) -> list[MenuCategoryDTO]:
    categories: list[MenuCategoryDTO] = []

    for order_key in sorted(
        raw_menu.keys(), key=lambda value: int(value) if value.isdigit() else value
    ):
        category_data = raw_menu.get(order_key)
        if not isinstance(category_data, dict):
            continue

        meta = category_data.get(CATEGORY_META_KEY, {})
        category_name = f"Category {order_key}"
        category_order = int(order_key) if order_key.isdigit() else 0
        if isinstance(meta, dict):
            meta_name = meta.get("name")
            meta_order = meta.get("order")
            if isinstance(meta_name, str) and meta_name.strip() != "":
                category_name = meta_name
            if isinstance(meta_order, int):
                category_order = meta_order

        items: list[MenuItemDTO] = []
        for item_name, item_payload in category_data.items():
            if item_name == CATEGORY_META_KEY or not isinstance(item_payload, dict):
                continue

            raw_price = item_payload.get("price", 0)
            raw_promoted = item_payload.get("promoted", 0)
            raw_avail = item_payload.get("isAvailable", item_payload.get("active", 1))
            raw_desc = item_payload.get("desc", "")
            raw_tags = item_payload.get("tags", [])
            raw_image = item_payload.get("imageUrl")

            price = float(raw_price) if isinstance(raw_price, int | float) else 0.0
            promoted = bool(raw_promoted) if isinstance(raw_promoted, bool) else raw_promoted == 1
            is_available = raw_avail if isinstance(raw_avail, bool) else raw_avail != 0
            desc = raw_desc if isinstance(raw_desc, str) else ""
            tags = (
                [tag for tag in raw_tags if isinstance(tag, str)]
                if isinstance(raw_tags, list)
                else []
            )
            image_url = raw_image if isinstance(raw_image, str) and raw_image.strip() else None

            if active_items_only and not is_available:
                continue

            items.append(
                MenuItemDTO(
                    name=item_name,
                    price=price,
                    promoted=promoted,
                    is_available=is_available,
                    desc=desc,
                    tags=tags,
                    image_url=image_url,
                )
            )

        if active_items_only and not items:
            continue

        categories.append(
            MenuCategoryDTO(
                name=category_name,
                order=category_order,
                items=items,
            )
        )

    return sorted(categories, key=lambda category: category.order)
