from fastapi.testclient import TestClient
from starlette import status

from main import app


def test_root_returns_json() -> None:
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["message"] == "Welcome to Restorio API"
    assert "version" in body
