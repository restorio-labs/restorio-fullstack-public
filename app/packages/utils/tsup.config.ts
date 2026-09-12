import { defineConfig } from "tsup";

const isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");

const sharedConfig = {
  entry: ["src/index.ts"] as string[],
  dts: true,
  sourcemap: false,
  tsconfig: "./tsconfig.dts.json",
};

export default defineConfig([
  {
    ...sharedConfig,
    format: ["esm"],
    clean: !isWatch,
  },
  {
    ...sharedConfig,
    format: ["cjs"],
    esbuildOptions(options): void {
      options.define = {
        ...(options.define ?? {}),
        "import.meta": "undefined",
        "import.meta.env": "process.env",
      };
    },
  },
]);
