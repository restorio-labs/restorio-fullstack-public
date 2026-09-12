from unittest.mock import MagicMock, patch

from fastapi import Request, Response
from starlette.datastructures import URL

from core.foundation.auth_cookies import (
    _cookie_domain,
    _is_local_host,
    _should_use_secure_cookie,
    clear_auth_cookies,
    get_access_token_from_request,
    get_refresh_token_from_request,
    set_auth_cookies,
)


def make_request(url: str, cookies: dict | None = None) -> Request:
    """Build a minimal mock Request with a real-ish URL object."""

    request = MagicMock(spec=Request)
    request.url = URL(url)
    request.cookies = cookies or {}
    return request


def make_response() -> MagicMock:
    """Build a minimal mock Response."""
    return MagicMock(spec=Response)


class TestIsLocalHost:
    def test_localhost(self):
        assert _is_local_host("localhost") is True

    def test_127_0_0_1(self):
        assert _is_local_host("127.0.0.1") is True

    def test_none(self):
        assert _is_local_host(None) is False

    def test_remote_host(self):
        assert _is_local_host("restorio.org") is False

    def test_subdomain(self):
        assert _is_local_host("api.restorio.org") is False


class TestCookieDomain:
    def test_localhost_returns_none(self):
        assert _cookie_domain("localhost") is None

    def test_127_returns_none(self):
        assert _cookie_domain("127.0.0.1") is None

    def test_apex_domain(self):
        assert _cookie_domain("restorio.org") == ".restorio.org"

    def test_subdomain(self):
        assert _cookie_domain("api.restorio.org") == ".restorio.org"

    def test_deep_subdomain(self):
        assert _cookie_domain("staging.api.restorio.org") == ".restorio.org"

    def test_apex_domain_com(self):
        assert _cookie_domain("restorio.org") == ".restorio.org"

    def test_subdomain_com(self):
        assert _cookie_domain("api.restorio.org") == ".restorio.org"

    def test_unknown_host_returns_none(self):
        assert _cookie_domain("evil.com") is None

    def test_none_hostname(self):
        assert _cookie_domain(None) is None


class TestShouldUseSecureCookie:
    def test_localhost_http_is_not_secure(self):
        request = make_request("http://localhost/path")
        assert _should_use_secure_cookie(request) is False

    def test_localhost_https_is_still_not_secure(self):
        # Local hosts should never get secure=True regardless of scheme
        request = make_request("https://localhost/path")
        assert _should_use_secure_cookie(request) is False

    def test_remote_https_is_secure(self):
        request = make_request("https://restorio.org/path")
        assert _should_use_secure_cookie(request) is True

    def test_remote_http_is_not_secure(self):
        request = make_request("http://restorio.org/path")
        assert _should_use_secure_cookie(request) is False

    def test_subdomain_https_is_secure(self):
        request = make_request("https://api.restorio.org/path")
        assert _should_use_secure_cookie(request) is True


class TestSetAuthCookies:
    @patch("core.foundation.auth_cookies.settings")
    def test_localhost_sets_cookies_without_domain_and_not_secure(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 15
        mock_settings.REFRESH_TOKEN_EXPIRE_DAYS = 7

        request = make_request("http://localhost/")
        response = make_response()

        set_auth_cookies(response, request, "acc123", "ref456")

        response.set_cookie.assert_any_call(
            key="access_token",
            value="acc123",
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=15 * 60,
            path="/",
            domain=None,
        )
        response.set_cookie.assert_any_call(
            key="refresh_token",
            value="ref456",
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
            domain=None,
        )
        response.set_cookie.assert_any_call(
            key="rshc",
            value="1",
            httponly=False,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
            domain=None,
        )

    @patch("core.foundation.auth_cookies.settings")
    def test_production_sets_cookies_with_domain_and_secure(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 15
        mock_settings.REFRESH_TOKEN_EXPIRE_DAYS = 7

        request = make_request("https://restorio.org/")
        response = make_response()

        set_auth_cookies(response, request, "acc123", "ref456")

        response.set_cookie.assert_any_call(
            key="access_token",
            value="acc123",
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=15 * 60,
            path="/",
            domain=".restorio.org",
        )
        response.set_cookie.assert_any_call(
            key="refresh_token",
            value="ref456",
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
            domain=".restorio.org",
        )
        response.set_cookie.assert_any_call(
            key="rshc",
            value="1",
            httponly=False,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
            domain=".restorio.org",
        )

    @patch("core.foundation.auth_cookies.settings")
    def test_set_cookies_called_exactly_three_times(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 15
        mock_settings.REFRESH_TOKEN_EXPIRE_DAYS = 7

        request = make_request("https://restorio.org/")
        response = make_response()

        set_auth_cookies(response, request, "a", "r")

        assert response.set_cookie.call_count == 3  # noqa: PLR2004


class TestClearAuthCookies:
    @patch("core.foundation.auth_cookies.settings")
    def test_localhost_deletes_cookies_without_domain_and_not_secure(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"

        request = make_request("http://localhost/")
        response = make_response()

        clear_auth_cookies(response, request)

        response.delete_cookie.assert_any_call(
            key="access_token",
            path="/",
            domain=None,
            secure=False,
            httponly=True,
            samesite="lax",
        )
        response.delete_cookie.assert_any_call(
            key="refresh_token",
            path="/",
            domain=None,
            secure=False,
            httponly=True,
            samesite="lax",
        )
        response.delete_cookie.assert_any_call(
            key="rshc",
            path="/",
            domain=None,
            secure=False,
            httponly=False,
            samesite="lax",
        )

    @patch("core.foundation.auth_cookies.settings")
    def test_production_deletes_cookies_with_domain_and_secure(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"

        request = make_request("https://api.restorio.org/")
        response = make_response()

        clear_auth_cookies(response, request)

        response.delete_cookie.assert_any_call(
            key="access_token",
            path="/",
            domain=".restorio.org",
            secure=True,
            httponly=True,
            samesite="lax",
        )
        response.delete_cookie.assert_any_call(
            key="refresh_token",
            path="/",
            domain=".restorio.org",
            secure=True,
            httponly=True,
            samesite="lax",
        )
        response.delete_cookie.assert_any_call(
            key="rshc",
            path="/",
            domain=".restorio.org",
            secure=True,
            httponly=False,
            samesite="lax",
        )

    @patch("core.foundation.auth_cookies.settings")
    def test_delete_cookie_called_exactly_three_times(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        mock_settings.SESSION_HINT_COOKIE = "rshc"

        request = make_request("http://localhost/")
        response = make_response()

        clear_auth_cookies(response, request)

        assert response.delete_cookie.call_count == 3  # noqa: PLR2004


class TestGetTokensFromRequest:
    @patch("core.foundation.auth_cookies.settings")
    def test_get_access_token_present(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        request = make_request("http://localhost/", cookies={"access_token": "mytoken"})

        assert get_access_token_from_request(request) == "mytoken"

    @patch("core.foundation.auth_cookies.settings")
    def test_get_access_token_missing(self, mock_settings):
        mock_settings.ACCESS_TOKEN_COOKIE_NAME = "access_token"
        request = make_request("http://localhost/", cookies={})

        assert get_access_token_from_request(request) is None

    @patch("core.foundation.auth_cookies.settings")
    def test_get_refresh_token_present(self, mock_settings):
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        request = make_request("http://localhost/", cookies={"refresh_token": "reftoken"})

        assert get_refresh_token_from_request(request) == "reftoken"

    @patch("core.foundation.auth_cookies.settings")
    def test_get_refresh_token_missing(self, mock_settings):
        mock_settings.REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        request = make_request("http://localhost/", cookies={})

        assert get_refresh_token_from_request(request) is None
