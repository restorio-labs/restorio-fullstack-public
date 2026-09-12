import { defineConfig } from "tsup";

const isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: !isWatch,
  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "@restorio/api-client",
    "@restorio/types",
    "@restorio/ui",
    "@restorio/utils",
  ],
  tsconfig: "./tsconfig.dts.json",
});
