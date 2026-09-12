/* eslint-disable @typescript-eslint/unbound-method */
import axios, {
  type AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ApiClient } from "../../src/client";
import { setupAxiosMock, type AxiosTestContext } from "../helpers/axiosTestInstance";

vi.mock("axios");

describe("Api Client", () => {
  let ctx: AxiosTestContext;

  beforeEach(() => {
    vi.clearAllMocks();

    ctx = setupAxiosMock();

    vi.mocked(axios.create).mockReturnValue(ctx.instance);
  });

  it("creates axios client with baseURL and JSON headers", () => {
    new ApiClient({ baseURL: "http://localhost:8000" });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("adds Authorization header when access token exists", async () => {
    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => "token",
    });

    const config = { headers: {} } as AxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.Authorization).toBe("Bearer token");
  });

  it("does not override existing Authorization header", async () => {
    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => "token",
    });

    const config = {
      headers: { Authorization: "Bearer existing" },
    } as AxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.Authorization).toBe("Bearer existing");
  });

  it("calls onUnauthorized on 401 response", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = { response: { status: 401 } };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not call onUnauthorized for non-401 response", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = { response: { status: 403 } };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("get returns response.data", async () => {
    vi.mocked(ctx.instance.get).mockResolvedValue({ data: { ok: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.get("/test");

    expect(result).toEqual({ ok: true });

    expect(ctx.instance.get).toHaveBeenCalledWith("/test", undefined);
  });

  it("post returns response.data", async () => {
    vi.mocked(ctx.instance.post).mockResolvedValue({ data: { id: 1 } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.post("/test", { a: 1 });

    expect(result).toEqual({ id: 1 });
  });

  it("put returns response.data", async () => {
    vi.mocked(ctx.instance.put).mockResolvedValue({ data: { updated: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.put("/test", {});

    expect(result).toEqual({ updated: true });
  });

  it("patch returns response.data", async () => {
    vi.mocked(ctx.instance.patch).mockResolvedValue({ data: { patched: true } });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.patch("/test", {});

    expect(result).toEqual({ patched: true });
  });

  it("delete returns response.data", async () => {
    vi.mocked(ctx.instance.delete).mockResolvedValue({ data: undefined });

    const client = new ApiClient({ baseURL: "x" });
    const result = await client.delete("/test");

    expect(result).toBeUndefined();
  });

  it("passes through successful response in interceptor", () => {
    new ApiClient({ baseURL: "x" });

    const mockResponse = {
      data: "success",
      status: 200,
      headers: {},
      config: {},
    };

    const result = ctx.responseSuccess?.(mockResponse as unknown as AxiosResponse);

    expect(result).toBe(mockResponse);
  });

  it("on 401 with refreshPath set and non-refresh request, calls refresh then retries request", async () => {
    const onUnauthorized = vi.fn();

    vi.mocked(ctx.instance.post).mockResolvedValueOnce({ data: {} });
    vi.mocked(ctx.instance.request).mockResolvedValueOnce({ data: { ok: true } });

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items", method: "get" },
    };

    const result = await ctx.responseError!(error as AxiosError);

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(ctx.instance.post).toHaveBeenCalledWith("auth/refresh", undefined, { withCredentials: true });
    expect(ctx.instance.request).toHaveBeenCalledWith(expect.objectContaining({ _retry: true, url: "items" }));
    expect(result).toEqual({ data: { ok: true } });
  });

  it("on 401 with refreshPath when refresh fails calls onUnauthorized", async () => {
    const onUnauthorized = vi.fn();

    vi.mocked(ctx.instance.post).mockRejectedValueOnce(new Error("refresh failed"));

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("on 401 for refresh path url calls onUnauthorized without retry", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "auth/refresh" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(ctx.instance.post).not.toHaveBeenCalled();
  });

  it("on 401 without refreshPath calls onUnauthorized", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not add Authorization header when getAccessToken is undefined", async () => {
    new ApiClient({ baseURL: "x" });

    const config = { headers: {} } as AxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.Authorization).toBeUndefined();
  });

  it("adds X-Timezone when browser timezone is available", async () => {
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: "Europe/Warsaw" }),
      }),
    });

    new ApiClient({ baseURL: "x" });

    const config = { headers: {} } as AxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.["X-Timezone"]).toBe("Europe/Warsaw");

    vi.unstubAllGlobals();
  });

  it("does not override an existing X-Timezone header", async () => {
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: "Europe/Warsaw" }),
      }),
    });

    new ApiClient({ baseURL: "x" });

    const config = {
      headers: { "X-Timezone": "America/New_York" },
    } as AxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.["X-Timezone"]).toBe("America/New_York");

    vi.unstubAllGlobals();
  });

  it("adds X-CSRF-Token on POST when csrf_token cookie is present", async () => {
    vi.stubGlobal("document", { cookie: "csrf_token=signed-token-value" });

    new ApiClient({ baseURL: "x" });

    const config = { headers: {}, method: "post" } as InternalAxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.["X-CSRF-Token"]).toBe("signed-token-value");

    vi.unstubAllGlobals();
  });

  it("does not set X-CSRF-Token when header already present", async () => {
    vi.stubGlobal("document", { cookie: "csrf_token=cookie-value" });

    new ApiClient({ baseURL: "x" });

    const config = {
      headers: { "X-CSRF-Token": "preset" },
      method: "post",
    } as InternalAxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.["X-CSRF-Token"]).toBe("preset");

    vi.unstubAllGlobals();
  });

  it("does not add X-CSRF-Token for GET requests", async () => {
    vi.stubGlobal("document", { cookie: "csrf_token=should-not-apply" });

    new ApiClient({ baseURL: "x" });

    const config = { headers: {}, method: "get" } as InternalAxiosRequestConfig;

    const result = (await ctx.requestInterceptor?.(config)) ?? config;

    expect((result as AxiosRequestConfig).headers?.["X-CSRF-Token"]).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("uses custom tokenExpiryBufferMs when provided", () => {
    new ApiClient({ baseURL: "x", tokenExpiryBufferMs: 120_000 });

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "x",
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("triggers refresh on request when token is expiring soon", async () => {
    const expiringPayload = Buffer.from(JSON.stringify({ exp: 1 })).toString("base64");
    const expiringToken = `header.${expiringPayload}.sig`;

    vi.mocked(ctx.instance.post).mockResolvedValue({ data: {} });

    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => expiringToken,
      refreshPath: "auth/refresh",
      tokenExpiryBufferMs: 60_000,
    });

    const config = { headers: {}, url: "/items" } as AxiosRequestConfig;

    await ctx.requestInterceptor?.(config);

    expect(ctx.instance.post).toHaveBeenCalledWith("auth/refresh", undefined, { withCredentials: true });
  });

  it("does not trigger refresh when token is invalid and decodeTokenExp returns null", async () => {
    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => "invalid-no-dots",
      refreshPath: "auth/refresh",
    });

    const config = { headers: {}, url: "/items" } as AxiosRequestConfig;

    await ctx.requestInterceptor?.(config);

    expect(ctx.instance.post).not.toHaveBeenCalled();
  });

  it("does not trigger refresh when request url is refresh path", async () => {
    const expiringPayload = Buffer.from(JSON.stringify({ exp: 1 })).toString("base64");
    const expiringToken = `header.${expiringPayload}.sig`;

    new ApiClient({
      baseURL: "x",
      getAccessToken: (): string | null => expiringToken,
      refreshPath: "auth/refresh",
    });

    const config = { headers: {}, url: "auth/refresh" } as AxiosRequestConfig;

    await ctx.requestInterceptor?.(config);

    expect(ctx.instance.post).not.toHaveBeenCalled();
  });

  it("on 401 with config null after successful refresh calls onUnauthorized and rejects", async () => {
    const onUnauthorized = vi.fn();

    vi.mocked(ctx.instance.post).mockResolvedValueOnce({ data: {} });

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: null,
    };

    await expect(ctx.responseError!(error as unknown as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(ctx.instance.request).not.toHaveBeenCalled();
  });

  it("on 401 when config has _retry true calls onUnauthorized without retry", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "items", _retry: true },
    };

    await expect(ctx.responseError!(error as unknown as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(ctx.instance.post).not.toHaveBeenCalled();
    expect(ctx.instance.request).not.toHaveBeenCalled();
  });

  it("on 401 when request url ends with refresh path calls onUnauthorized without retry", async () => {
    const onUnauthorized = vi.fn();

    new ApiClient({
      baseURL: "x",
      refreshPath: "auth/refresh",
      onUnauthorized,
    });

    const error = {
      response: { status: 401 },
      config: { url: "v1/auth/refresh" },
    };

    await expect(ctx.responseError!(error as AxiosError)).rejects.toBe(error);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(ctx.instance.post).not.toHaveBeenCalled();
  });

  it("get passes config to axios", async () => {
    vi.mocked(ctx.instance.get).mockResolvedValue({ data: { ok: true } });

    const client = new ApiClient({ baseURL: "x" });
    const config = { params: { id: 1 } };

    await client.get("/test", config);

    expect(ctx.instance.get).toHaveBeenCalledWith("/test", config);
  });

  it("post passes config to axios", async () => {
    vi.mocked(ctx.instance.post).mockResolvedValue({ data: { id: 1 } });

    const client = new ApiClient({ baseURL: "x" });
    const config = { headers: { "X-Custom": "1" } };

    await client.post("/test", { a: 1 }, config);

    expect(ctx.instance.post).toHaveBeenCalledWith("/test", { a: 1 }, config);
  });
});
