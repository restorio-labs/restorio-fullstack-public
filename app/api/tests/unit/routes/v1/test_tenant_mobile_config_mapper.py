from unittest.mock import MagicMock

from routes.v1.mappers.tenant_mobile_config_mappers import tenant_mobile_config_to_response


def test_mapper_none_config_has_null_landing() -> None:
    dto = tenant_mobile_config_to_response(None)

    dumped = dto.model_dump(by_alias=True)
    assert dumped["pageTitle"] is None
    assert dumped["themeOverride"] is None
    assert dumped["landingContent"] is None
    assert dumped["hasFavicon"] is False


def test_mapper_serializes_landing_content() -> None:
    row = MagicMock()
    row.page_title = "Tab title"
    row.theme_override = {"colors": {"background": {"primary": "#fff"}}}
    row.favicon_object_key = None
    row.landing_content = {
        "headline": "Welcome",
        "subtitle": "Sub",
        "tablesCtaLabel": "Tables",
        "menuCtaLabel": "Menu",
        "openStatusLabel": "Free",
        "closedStatusLabel": "Busy",
    }

    dto = tenant_mobile_config_to_response(row)
    dumped = dto.model_dump(by_alias=True, mode="json")

    assert dumped["pageTitle"] == "Tab title"
    assert dumped["hasFavicon"] is False
    landing = dumped["landingContent"]
    assert landing is not None
    assert landing["headline"] == "Welcome"
    assert landing["subtitle"] == "Sub"
    assert landing["tablesCtaLabel"] == "Tables"
    assert landing["menuCtaLabel"] == "Menu"
    assert landing["openStatusLabel"] == "Free"
    assert landing["closedStatusLabel"] == "Busy"


def test_mapper_favicon_flag_true_when_key_set() -> None:
    row = MagicMock()
    row.page_title = None
    row.theme_override = None
    row.favicon_object_key = "tenants/x/favicon.ico"
    row.landing_content = None

    dto = tenant_mobile_config_to_response(row)
    assert dto.model_dump(by_alias=True)["hasFavicon"] is True


def test_mapper_invalid_landing_dict_treated_as_empty() -> None:
    row = MagicMock()
    row.page_title = None
    row.theme_override = None
    row.favicon_object_key = None
    row.landing_content = "not-a-dict"

    dto = tenant_mobile_config_to_response(row)
    assert dto.model_dump(by_alias=True)["landingContent"] is None
