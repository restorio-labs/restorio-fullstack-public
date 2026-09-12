# End-to-End Test Suite

This module contains the end-to-end (E2E) test suite for the Restorio Platform. The tests are implemented using the [Playwright](https://playwright.dev/) testing framework, which enables automated browser-based validation of application behaviour across multiple rendering engines.

## Environment Setup

```bash
bun install
bun playwright install
```

## Executing the Test Suite

The following commands are available for running and inspecting the E2E tests:

```bash
# Execute all test specifications
bun run test

# Launch the interactive test runner interface
bun run test:ui

# Execute tests in headed mode (browser window visible)
bun run test:headed

# Execute tests in debug mode (step-by-step execution)
bun run test:debug

# Open the HTML test report
bun run report
```

## Test Organisation

The test specifications are organised by functional scope within the `specs/` directory:

```
e2e/
├── specs/
│   ├── api-health.spec.ts          # Verification of API health check endpoints
│   ├── authenticated-apps.spec.ts  # Tests for authentication-protected applications
│   └── public-web.spec.ts          # Tests for the public-facing website
└── playwright.config.ts            # Playwright configuration and project definitions
```

## Configuration

The test runner is configured in `playwright.config.ts` with the following parameters:

- **Browser engines**: Chromium, Firefox, and WebKit (desktop viewport dimensions)
- **Parallelisation strategy**: Fully parallel execution in local environments; sequential execution in continuous integration pipelines
- **Retry policy**: No retries during local development; two automatic retries in CI environments
- **Artefact collection**: Screenshots are captured on test failure; execution traces are recorded on the first retry attempt

### Automatically Provisioned Services

The Playwright test runner is configured to start the following services automatically before test execution begins:

| Service | Address | Start Command |
|---|---|---|
| Public Web | http://localhost:3000 | `bun run dev` |
| API | http://localhost:8000 | `docker compose up -d api` |

### Application Addresses

The following table lists the network addresses of all platform services as configured for the local development environment:

| Application | Address |
|---|---|
| Public Web | http://localhost:3000 |
| Admin Panel | http://localhost:3001 |
| Kitchen Panel | http://localhost:3002 |
| Mobile App | http://localhost:3003 |
| Waiter Panel | http://localhost:3004 |
| API | http://localhost:8000 |

## Writing Test Specifications

Test specifications follow the Playwright test authoring conventions. The example below illustrates a representative test case:

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "user@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## Continuous Integration Behaviour

In CI environments, the test suite is executed with a single worker process, failed tests are retried up to two times, and detailed trace files are generated to facilitate post-execution debugging and failure analysis.
