import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@restorio/utils": resolve(__dirname, "src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["/node_modules/", "/dist/", "/.turbo/", "/.next/"],
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary"],
    },
  },
});
