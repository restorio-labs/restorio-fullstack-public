import path from "path";

import { defineConfig } from "tsup";

const isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");

export default defineConfig({
  entry: ["src/index.ts", "src/theme/tailwindUtils.ts", "src/theme/themeMode.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: !isWatch,
  external: ["react", "react-dom"],
  tsconfig: "./tsconfig.dts.json",
  esbuildPlugins: [
    {
      name: "path-alias",
      setup(build): void {
        build.onResolve({ filter: /^@utils$/ }, () => {
          return {
            path: path.resolve(__dirname, "./src/utils/index.ts"),
          };
        });
        build.onResolve({ filter: /^@components/ }, (args: { path: string }) => {
          const match = args.path.match(/^@components\/(.+)$/);

          if (match) {
            return {
              path: path.resolve(__dirname, "./src/components", match[1]),
            };
          }

          return {
            path: path.resolve(__dirname, "./src/components"),
          };
        });
      },
    },
  ],
});
