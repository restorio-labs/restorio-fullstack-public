from core.models.tenant import _generate_public_id


def test_generate_public_id_returns_token() -> None:
    token = _generate_public_id()
    assert isinstance(token, str)
    assert token
