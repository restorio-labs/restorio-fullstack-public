from datetime import UTC, datetime, timedelta

import jwt
import pytest

from core.exceptions.http import UnauthorizedError
from core.foundation.security import security_service


def test_decode_expired_token():
    # Create an expired token manually
    to_encode = {"sub": "test", "exp": datetime.now(UTC) - timedelta(minutes=10)}
    token = jwt.encode(
        to_encode, security_service._secret_key, algorithm=security_service._algorithm
    )

    with pytest.raises(UnauthorizedError):
        security_service.decode_access_token(token)
