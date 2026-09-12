import re
import unicodedata

_SLUG_REPLACEMENTS = {
    "ß": "ss",
    "Æ": "AE",
    "æ": "ae",
    "Ø": "O",
    "ø": "o",
    "Œ": "OE",
    "œ": "oe",
    "Ð": "D",
    "ð": "d",
    "Þ": "TH",
    "þ": "th",
    "Ł": "L",
    "ł": "l",
    "ż": "z",
    "ź": "z",
    "ć": "c",
    "ń": "n",
    "ó": "o",
    "ę": "e",
    "ś": "s",
    "ą": "a",
}


def normalize_slug_letters(value: str) -> str:
    replaced = "".join(_SLUG_REPLACEMENTS.get(char, char) for char in value)
    normalized = unicodedata.normalize("NFKD", replaced)
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def to_kebab_slug(value: str) -> str:
    normalized = normalize_slug_letters(value).lower()
    sanitized = re.sub(r"[^a-z0-9\s-]", " ", normalized)
    compact_spaces = re.sub(r"\s+", "-", sanitized)
    compact_dashes = re.sub(r"-+", "-", compact_spaces)
    return compact_dashes.strip("-")


def to_compact_slug(value: str) -> str:
    normalized = normalize_slug_letters(value).lower()
    return re.sub(r"[^a-z0-9]+", "", normalized)
