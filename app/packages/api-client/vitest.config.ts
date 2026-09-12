import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["/node_modules/", "/dist/", "/\.turbo/", "/\.next/"],
    setupFiles: ["../../vitest.setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary"],
    },
  },
});
