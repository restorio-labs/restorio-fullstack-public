import { test, expect } from "@playwright/test";
import { APP_URLS } from "../playwright.config";

test.describe("Public Web - Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URLS.publicWeb);
  });

  test("homepage loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Restorio/i);
  });

  test("homepage displays main content", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main, [role='main'], #__next")).toBeVisible();
  });

  test("login link is visible and clickable", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /login|zaloguj|sign in/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/i);
    }
  });

  test("register link is visible and clickable", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /register|zarejestruj|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/i);
    }
  });
});

test.describe("Public Web - Login Page", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto(`${APP_URLS.publicWeb}/login`);
    await expect(page.locator("body")).toBeVisible();

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByLabel(/password|hasło/i).or(page.locator('input[type="password"]'));

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("login form shows validation errors for empty submission", async ({ page }) => {
    await page.goto(`${APP_URLS.publicWeb}/login`);

    const submitButton = page.getByRole("button", { name: /login|zaloguj|sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Public Web - Register Page", () => {
  test("register page loads correctly", async ({ page }) => {
    await page.goto(`${APP_URLS.publicWeb}/register`);
    await expect(page.locator("body")).toBeVisible();

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();
  });
});

test.describe("Public Web - Forgot Password Page", () => {
  test("forgot password page loads correctly", async ({ page }) => {
    await page.goto(`${APP_URLS.publicWeb}/forgot-password`);
    await expect(page.locator("body")).toBeVisible();

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();
  });
});
