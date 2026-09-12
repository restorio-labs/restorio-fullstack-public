import { defineConfig } from "tsup";

const isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: !isWatch,
  external: ["axios"],
  tsconfig: "./tsconfig.dts.json",
});
