import { defineConfig } from "vitest/config";
import { resolve } from "path";

import { monorepoResolveAliases } from "../../../vitest.monorepo";

export default defineConfig({
  esbuild: {
    jsxInject: `import React from "react"`,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["../../../vitest.setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
    },
  },
  resolve: {
    alias: {
      ...monorepoResolveAliases,
      "@": resolve(__dirname, "./src"),
    },
  },
});
