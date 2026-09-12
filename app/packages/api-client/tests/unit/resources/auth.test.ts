/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { AuthResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post">;

describe("AuthResource", () => {
  let client: ApiClientMock;
  let resource: AuthResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
    };

    resource = new AuthResource(client as ApiClient);
  });

  it("login calls POST auth/login", async () => {
    await resource.login("a@b.com", "pass");
    expect(client.post).toHaveBeenCalledWith(
      "auth/login",
      {
        email: "a@b.com",
        password: "pass",
      },
      { signal: undefined },
    );
  });

  it("register calls POST auth/register", async () => {
    const data = {
      email: "new@user.com",
      password: "password",
      restaurant_name: "My Restaurant",
    };

    await resource.register(data);
    expect(client.post).toHaveBeenCalledWith("auth/register", data, { signal: undefined });
  });

  it("refresh calls POST auth/refresh with no body", async () => {
    await resource.refresh();

    expect(client.post).toHaveBeenCalledWith("auth/refresh", undefined, { signal: undefined });
  });

  it("me calls GET auth/me and returns unwrapped AuthMeData", async () => {
    client.get = vi.fn().mockResolvedValue({
      data: { authenticated: true },
    });

    const result = await resource.me();

    expect(client.get).toHaveBeenCalledWith("auth/me", { signal: undefined, withCredentials: true });
    expect(result).toEqual({ authenticated: true });
  });

  it("me with accessToken sends Authorization header", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { authenticated: true } });

    await resource.me(undefined, "jwt-token");

    expect(client.get).toHaveBeenCalledWith("auth/me", {
      signal: undefined,
      withCredentials: true,
      headers: { Authorization: "Bearer jwt-token" },
    });
  });

  it("activate calls POST auth/activate with activation_id query", async () => {
    await resource.activate("abc-123-uuid");

    expect(client.post).toHaveBeenCalledWith("auth/activate?activation_id=abc-123-uuid", undefined, {
      signal: undefined,
    });
  });

  it("resendActivation calls POST auth/resend-activation with activation_id query", async () => {
    await resource.resendActivation("xyz-456-uuid");

    expect(client.post).toHaveBeenCalledWith("auth/resend-activation?activation_id=xyz-456-uuid", undefined, {
      signal: undefined,
    });
  });
});
