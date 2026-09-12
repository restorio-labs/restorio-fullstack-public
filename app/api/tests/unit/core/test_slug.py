from core.foundation.slug import to_kebab_slug


class TestToKebabSlug:
    def test_normalizes_diacritics_and_special_letters(self) -> None:
        result = to_kebab_slug("Zażółć gęślą jaźń Æther Øresund")

        assert result == "zazolc-gesla-jazn-aether-oresund"

    def test_replaces_non_alphanumeric_sequences_with_single_dash(self) -> None:
        result = to_kebab_slug("Menu___Creator!!!  v2")

        assert result == "menu-creator-v2"

    def test_strips_leading_and_trailing_dashes(self) -> None:
        result = to_kebab_slug(" -- Hello world -- ")

        assert result == "hello-world"
