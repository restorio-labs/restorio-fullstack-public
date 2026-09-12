import { defineConfig } from "vitest/config";
import { resolve } from "path";

const isCI = !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  esbuild: {
    jsxInject: `import React from "react"`,
  },
  test: {
    globals: true,
    root: process.cwd(),
    environment: "jsdom",
    testTimeout: isCI ? 15_000 : 10_000,
    pool: "forks",
    ...(isCI ? { maxWorkers: 4 } : {}),
    include: ["app/packages/*/tests/unit/**/*.{test,spec}.{ts,tsx}", "app/apps/*/tests/unit/**/*.{test,spec}.{ts,tsx}"],

    exclude: ["/node_modules/", "/dist/", "/\.turbo/", "/\.next/"],

    setupFiles: ["vitest.setup.ts"],
    reporters: isCI ? ["default", "github-actions"] : ["default"],

    coverage: {
      enabled: isCI,
      provider: "v8",
      reportsDirectory: "./coverage",

      reporter: isCI ? ["json-summary"] : ["html", "text"],

      exclude: ["node_modules", "**/*.d.ts", "**/*.config.*", "**/dist/**"],
    },
  },
  resolve: {
    alias: {
      "@restorio/types": resolve(__dirname, "./app/packages/types/src"),
      "@restorio/ui": resolve(__dirname, "./app/packages/ui/src"),
      "@restorio/api-client": resolve(__dirname, "./app/packages/api-client/src"),
      "@restorio/auth": resolve(__dirname, "./app/packages/auth/src"),
      "@restorio/utils": resolve(__dirname, "./app/packages/utils/src"),
      "@/": resolve(__dirname, "./app/apps/public-web/src/"),
      "@utils": resolve(__dirname, "./app/packages/ui/src/utils/index.ts"),
      "@components": resolve(__dirname, "./app/packages/ui/src/components"),
    },
  },
});
