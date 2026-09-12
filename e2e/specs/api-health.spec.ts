import { test, expect } from "@playwright/test";
import { APP_URLS } from "../playwright.config";

test.describe("API Health Checks", () => {
  test("API health endpoint returns 200", async ({ request }) => {
    const response = await request.get(`${APP_URLS.api}/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test("API live endpoint returns 200", async ({ request }) => {
    const response = await request.get(`${APP_URLS.api}/health/live`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});
