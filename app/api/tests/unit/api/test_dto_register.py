from pydantic import ValidationError as PydanticValidationError
import pytest

from core.dto.v1.auth import RegisterDTO
from core.exceptions import ValidationError as CoreValidationError

BASE_VALID = {
    "email": "chef@restorio.org",
    "password": "ValidPass1!",
    "restaurant_name": "My Restaurant",
}


class TestRegisterDTO:
    def make_dto(self, **overrides) -> RegisterDTO:
        return RegisterDTO(**{**BASE_VALID, **overrides})

    def test_password_length_check_in_validator_directly(self):
        with pytest.raises(CoreValidationError) as exc_info:
            RegisterDTO.password_complexity("Abc1!xy")
        assert "8 characters" in exc_info.value.detail

    def expect_password_error(self, password: str) -> str:
        with pytest.raises((PydanticValidationError, CoreValidationError)) as exc_info:
            self.make_dto(password=password)
        exc = exc_info.value
        return exc.detail if isinstance(exc, CoreValidationError) else str(exc)

    def test_password_too_short_raises(self):
        self.expect_password_error("Sh0rt!")

    def test_password_missing_lowercase_raises(self):
        msg = self.expect_password_error("NOLOWER1!")
        assert "lowercase" in msg.lower()

    def test_password_missing_uppercase_raises(self):
        msg = self.expect_password_error("noupper1!")
        assert "uppercase" in msg.lower()

    def test_password_missing_digit_raises(self):
        msg = self.expect_password_error("NoDigits!")
        assert "number" in msg.lower() or "digit" in msg.lower()

    def test_password_missing_special_character_raises(self):
        msg = self.expect_password_error("NoSpecial1")
        assert "special" in msg.lower()

    def test_password_with_various_special_characters_accepted(self):
        specials = "!@#$%^&*"
        for char in specials:
            dto = self.make_dto(password=f"ValidPass1{char}")
            assert dto.password.endswith(char)
