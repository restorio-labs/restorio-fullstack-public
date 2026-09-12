import { defineConfig, devices } from "@playwright/test";

export const APP_URLS = {
  publicWeb: "http://localhost:3000",
  adminPanel: "http://localhost:3001",
  kitchenPanel: "http://localhost:3002",
  mobileApp: "http://localhost:3003",
  waiterPanel: "http://localhost:3004",
  api: "http://localhost:8000",
} as const;

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: APP_URLS.publicWeb,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: [
    {
      command: "bun run dev",
      url: APP_URLS.publicWeb,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "docker compose up -d api",
      url: `${APP_URLS.api}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
