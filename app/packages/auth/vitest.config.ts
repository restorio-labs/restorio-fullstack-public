import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../vitest.setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
    },
  },
  resolve: {
    alias: {
      "@restorio/types": resolve(__dirname, "../types/dist/index.js"),
    },
  },
});
