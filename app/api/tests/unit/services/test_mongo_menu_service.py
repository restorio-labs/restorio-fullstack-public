from services.mongo_menu_service import CATEGORY_META_KEY, normalize_mongo_menu_categories


def test_normalize_skips_non_dict_category() -> None:
    raw = {"1": "not-a-dict"}
    assert normalize_mongo_menu_categories(raw) == []


def test_normalize_uses_meta_name_and_order() -> None:
    raw = {
        "2": {
            CATEGORY_META_KEY: {"name": "Starters", "order": 1},
            "Soup": {"price": 10, "promoted": False, "isAvailable": True, "desc": "Hot"},
        }
    }
    cats = normalize_mongo_menu_categories(raw)
    assert len(cats) == 1
    assert cats[0].name == "Starters"
    assert cats[0].order == 1
    assert cats[0].items[0].name == "Soup"
    assert cats[0].items[0].price == 10.0  # noqa: PLR2004


def test_normalize_active_items_only_filters() -> None:
    raw = {
        "1": {
            CATEGORY_META_KEY: {"name": "A"},
            "Gone": {"price": 1, "isAvailable": False},
            "Here": {"price": 2, "active": 1},
        }
    }
    cats = normalize_mongo_menu_categories(raw, active_items_only=True)
    assert len(cats[0].items) == 1
    assert cats[0].items[0].name == "Here"


def test_normalize_active_items_only_skips_empty_category() -> None:
    raw = {
        "1": {
            CATEGORY_META_KEY: {"name": "Empty"},
            "X": {"price": 1, "isAvailable": False},
        }
    }
    assert normalize_mongo_menu_categories(raw, active_items_only=True) == []


def test_normalize_non_digit_keys_sort_lexicographically() -> None:
    raw = {
        "b": {CATEGORY_META_KEY: {"name": "B"}, "I": {"price": 1}},
        "a": {CATEGORY_META_KEY: {"name": "A"}, "I": {"price": 2}},
    }
    cats = normalize_mongo_menu_categories(raw)
    assert [c.name for c in cats] == ["A", "B"]
