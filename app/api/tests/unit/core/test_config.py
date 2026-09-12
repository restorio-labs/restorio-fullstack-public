import pytest

from core.foundation.infra.config import Settings

PASSTHROUGH_INT_VALUE = 12
NUMERIC_STRING_VALUE = "34"
NUMERIC_STRING_PARSED_VALUE = 34


class TestSettingsCorsOrigins:
    def test_parse_cors_origins_json_string(self) -> None:
        value = '["http://a.test", "http://b.test"]'
        result = Settings.parse_cors_origins(value)

        assert result == ["http://a.test", "http://b.test"]

    def test_parse_cors_origins_comma_separated_string(self) -> None:
        value = "http://a.test, http://b.test"
        result = Settings.parse_cors_origins(value)

        assert result == ["http://a.test", "http://b.test"]


class TestSettingsPrzelewy24Int:
    def test_parse_przelewy24_int_passthrough_for_int(self) -> None:
        assert Settings.parse_przelewy24_int(PASSTHROUGH_INT_VALUE) == PASSTHROUGH_INT_VALUE

    def test_parse_przelewy24_int_from_numeric_string(self) -> None:
        assert Settings.parse_przelewy24_int(NUMERIC_STRING_VALUE) == NUMERIC_STRING_PARSED_VALUE

    def test_parse_przelewy24_int_returns_zero_for_invalid_values(self) -> None:
        assert Settings.parse_przelewy24_int("abc") == 0
        assert Settings.parse_przelewy24_int(None) == 0  # type: ignore[arg-type]


class TestSettingsProductionSecrets:
    def test_insecure_secret_rejected_in_production(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("ENV", "production")
        with pytest.raises(ValueError, match="FATAL: SECRET_KEY is set to an insecure default"):
            Settings(SECRET_KEY="change-me-in-production")
