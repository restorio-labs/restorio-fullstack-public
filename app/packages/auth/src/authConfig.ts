import { getAppBaseUrl, PUBLIC_WEB_LOCALE_PATH_PREFIX } from "@restorio/utils";

export const AUTH_LOGIN_PATH = `${PUBLIC_WEB_LOCALE_PATH_PREFIX}/login`;

export const AUTH_REVALIDATE_INTERVAL_MS = 15 * 60 * 1000;

export const AUTH_LOGIN_REDIRECT_URL = `${getAppBaseUrl("public-web")}${AUTH_LOGIN_PATH}`;
