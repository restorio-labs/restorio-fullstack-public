import importlib
import os

import pytest

import core.foundation.infra.config as config_module


@pytest.fixture(autouse=True)
def _restore_config_env() -> object:
    old_env = os.environ.get("ENV")
    old_sk = os.environ.get("SECRET_KEY")
    yield
    if old_env is None:
        os.environ.pop("ENV", None)
    else:
        os.environ["ENV"] = old_env
    if old_sk is None:
        os.environ.pop("SECRET_KEY", None)
    else:
        os.environ["SECRET_KEY"] = old_sk
    importlib.reload(config_module)


def test_settings_cors_uses_local_origins_for_local_env() -> None:
    os.environ["ENV"] = "local"
    if "SECRET_KEY" in os.environ:
        del os.environ["SECRET_KEY"]
    importlib.reload(config_module)
    s = config_module.Settings()
    assert s.CORS_ORIGINS == s.LOCAL_ORIGINS


def test_settings_cors_uses_production_origins_for_production_env() -> None:
    os.environ["ENV"] = "production"
    os.environ["SECRET_KEY"] = "a" * 64
    importlib.reload(config_module)
    s = config_module.Settings()
    assert s.CORS_ORIGINS == s.PRODUCTION_ORIGINS
