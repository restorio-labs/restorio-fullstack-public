// tsup.config.ts
import path from "path";
import { defineConfig } from "tsup";
var __injected_dirname__ = "/home/hohland/restorio-fullstack/app/packages/ui";
var isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");
var tsup_config_default = defineConfig({
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
      setup(build) {
        build.onResolve({ filter: /^@utils$/ }, () => {
          return {
            path: path.resolve(__injected_dirname__, "./src/utils/index.ts")
          };
        });
        build.onResolve({ filter: /^@components/ }, (args) => {
          const match = args.path.match(/^@components\/(.+)$/);
          if (match) {
            return {
              path: path.resolve(__injected_dirname__, "./src/components", match[1])
            };
          }
          return {
            path: path.resolve(__injected_dirname__, "./src/components")
          };
        });
      }
    }
  ]
});
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvaG9obGFuZC9yZXN0b3Jpby1mdWxsc3RhY2svYXBwL3BhY2thZ2VzL3VpL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2hvaGxhbmQvcmVzdG9yaW8tZnVsbHN0YWNrL2FwcC9wYWNrYWdlcy91aVwiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vaG9tZS9ob2hsYW5kL3Jlc3RvcmlvLWZ1bGxzdGFjay9hcHAvcGFja2FnZXMvdWkvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuXG5jb25zdCBpc1dhdGNoID0gcHJvY2Vzcy5hcmd2LnNvbWUoKGFyZykgPT4gYXJnID09PSBcIi0td2F0Y2hcIiB8fCBhcmcgPT09IFwiLXdcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGVudHJ5OiBbXCJzcmMvaW5kZXgudHNcIiwgXCJzcmMvdGhlbWUvdGFpbHdpbmRVdGlscy50c1wiLCBcInNyYy90aGVtZS90aGVtZU1vZGUudHNcIl0sXG4gIGZvcm1hdDogW1wiZXNtXCIsIFwiY2pzXCJdLFxuICBkdHM6IHRydWUsXG4gIHNvdXJjZW1hcDogZmFsc2UsXG4gIGNsZWFuOiAhaXNXYXRjaCxcbiAgZXh0ZXJuYWw6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICB0c2NvbmZpZzogXCIuL3RzY29uZmlnLmR0cy5qc29uXCIsXG4gIGVzYnVpbGRQbHVnaW5zOiBbXG4gICAge1xuICAgICAgbmFtZTogXCJwYXRoLWFsaWFzXCIsXG4gICAgICBzZXR1cChidWlsZCk6IHZvaWQge1xuICAgICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eQHV0aWxzJC8gfSwgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL3V0aWxzL2luZGV4LnRzXCIpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eQGNvbXBvbmVudHMvIH0sIChhcmdzOiB7IHBhdGg6IHN0cmluZyB9KSA9PiB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBhcmdzLnBhdGgubWF0Y2goL15AY29tcG9uZW50c1xcLyguKykkLyk7XG5cbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHBhdGg6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29tcG9uZW50c1wiLCBtYXRjaFsxXSksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2NvbXBvbmVudHNcIiksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFIsT0FBTyxVQUFVO0FBRS9TLFNBQVMsb0JBQW9CO0FBRm1FLElBQU0sdUJBQXVCO0FBSTdILElBQU0sVUFBVSxRQUFRLEtBQUssS0FBSyxDQUFDLFFBQVEsUUFBUSxhQUFhLFFBQVEsSUFBSTtBQUU1RSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPLENBQUMsZ0JBQWdCLDhCQUE4Qix3QkFBd0I7QUFBQSxFQUM5RSxRQUFRLENBQUMsT0FBTyxLQUFLO0FBQUEsRUFDckIsS0FBSztBQUFBLEVBQ0wsV0FBVztBQUFBLEVBQ1gsT0FBTyxDQUFDO0FBQUEsRUFDUixVQUFVLENBQUMsU0FBUyxXQUFXO0FBQUEsRUFDL0IsVUFBVTtBQUFBLEVBQ1YsZ0JBQWdCO0FBQUEsSUFDZDtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sTUFBTSxPQUFhO0FBQ2pCLGNBQU0sVUFBVSxFQUFFLFFBQVEsV0FBVyxHQUFHLE1BQU07QUFDNUMsaUJBQU87QUFBQSxZQUNMLE1BQU0sS0FBSyxRQUFRLHNCQUFXLHNCQUFzQjtBQUFBLFVBQ3REO0FBQUEsUUFDRixDQUFDO0FBQ0QsY0FBTSxVQUFVLEVBQUUsUUFBUSxlQUFlLEdBQUcsQ0FBQyxTQUEyQjtBQUN0RSxnQkFBTSxRQUFRLEtBQUssS0FBSyxNQUFNLHFCQUFxQjtBQUVuRCxjQUFJLE9BQU87QUFDVCxtQkFBTztBQUFBLGNBQ0wsTUFBTSxLQUFLLFFBQVEsc0JBQVcsb0JBQW9CLE1BQU0sQ0FBQyxDQUFDO0FBQUEsWUFDNUQ7QUFBQSxVQUNGO0FBRUEsaUJBQU87QUFBQSxZQUNMLE1BQU0sS0FBSyxRQUFRLHNCQUFXLGtCQUFrQjtBQUFBLFVBQ2xEO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
