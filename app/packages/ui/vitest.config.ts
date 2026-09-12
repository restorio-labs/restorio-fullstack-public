import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["/node_modules/", "/dist/", "/\.turbo/", "/\.next/"],
    setupFiles: ["../../vitest.setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
    },
  },
  resolve: {
    alias: {
      "@utils": path.resolve(__dirname, "./src/utils/index.ts"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
});
