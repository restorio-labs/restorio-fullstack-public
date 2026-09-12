from datetime import UTC, datetime, timedelta

from bcrypt import checkpw, gensalt, hashpw
from fastapi import Request
import jwt

from core.exceptions.http import UnauthorizedError
from core.foundation.auth_cookies import get_access_token_from_request
from core.foundation.infra.config import settings
from core.foundation.logging.logger import logger


async def get_current_user(self, request: Request) -> dict | None:
    auth_header = request.headers.get("Authorization")
    token: str | None = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        token = get_access_token_from_request(request)

    if token is None:
        raise UnauthorizedError(message="Unauthorized")

    return self.decode_access_token(token=token)


class SecurityService:
    def __init__(self) -> None:
        self._algorithm = settings.ALGORITHM
        self._secret_key = settings.SECRET_KEY
        self._access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    @staticmethod
    def hash_password(password: str) -> str:
        password_bytes = password.encode("utf-8")
        salt = gensalt()
        return hashpw(password_bytes, salt).decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(UTC) + expires_delta
        else:
            expire = datetime.now(UTC) + timedelta(minutes=self._access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def decode_access_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
        except jwt.ExpiredSignatureError as err:
            logger.debug(f"Expired token: {err!s}")
            raise UnauthorizedError(message="Unauthorized") from None
        except jwt.InvalidTokenError as err:
            logger.debug(f"Invalid token: {err!s}")
            raise UnauthorizedError(message="Unauthorized") from None
        except Exception as err:
            logger.error(f"Error decoding token: {err!s}", exc_info=True)
            raise UnauthorizedError(message="Unauthorized") from None


security_service = SecurityService()
