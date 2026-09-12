// tsup.config.ts
import { defineConfig } from "tsup";
var isWatch = process.argv.some((arg) => arg === "--watch" || arg === "-w");
var sharedConfig = {
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: false,
  tsconfig: "./tsconfig.dts.json"
};
var tsup_config_default = defineConfig([
  {
    ...sharedConfig,
    format: ["esm"],
    clean: !isWatch
  },
  {
    ...sharedConfig,
    format: ["cjs"],
    esbuildOptions(options) {
      options.define = {
        ...options.define ?? {},
        "import.meta": "undefined",
        "import.meta.env": "process.env"
      };
    }
  }
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvaG9obGFuZC9yZXN0b3Jpby1mdWxsc3RhY2svYXBwL3BhY2thZ2VzL3V0aWxzL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2hvaGxhbmQvcmVzdG9yaW8tZnVsbHN0YWNrL2FwcC9wYWNrYWdlcy91dGlsc1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vaG9tZS9ob2hsYW5kL3Jlc3RvcmlvLWZ1bGxzdGFjay9hcHAvcGFja2FnZXMvdXRpbHMvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuXG5jb25zdCBpc1dhdGNoID0gcHJvY2Vzcy5hcmd2LnNvbWUoKGFyZykgPT4gYXJnID09PSBcIi0td2F0Y2hcIiB8fCBhcmcgPT09IFwiLXdcIik7XG5cbmNvbnN0IHNoYXJlZENvbmZpZyA9IHtcbiAgZW50cnk6IFtcInNyYy9pbmRleC50c1wiXSBhcyBzdHJpbmdbXSxcbiAgZHRzOiB0cnVlLFxuICBzb3VyY2VtYXA6IGZhbHNlLFxuICB0c2NvbmZpZzogXCIuL3RzY29uZmlnLmR0cy5qc29uXCIsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoW1xuICB7XG4gICAgLi4uc2hhcmVkQ29uZmlnLFxuICAgIGZvcm1hdDogW1wiZXNtXCJdLFxuICAgIGNsZWFuOiAhaXNXYXRjaCxcbiAgfSxcbiAge1xuICAgIC4uLnNoYXJlZENvbmZpZyxcbiAgICBmb3JtYXQ6IFtcImNqc1wiXSxcbiAgICBlc2J1aWxkT3B0aW9ucyhvcHRpb25zKTogdm9pZCB7XG4gICAgICBvcHRpb25zLmRlZmluZSA9IHtcbiAgICAgICAgLi4uKG9wdGlvbnMuZGVmaW5lID8/IHt9KSxcbiAgICAgICAgXCJpbXBvcnQubWV0YVwiOiBcInVuZGVmaW5lZFwiLFxuICAgICAgICBcImltcG9ydC5tZXRhLmVudlwiOiBcInByb2Nlc3MuZW52XCIsXG4gICAgICB9O1xuICAgIH0sXG4gIH0sXG5dKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVMsU0FBUyxvQkFBb0I7QUFFcFUsSUFBTSxVQUFVLFFBQVEsS0FBSyxLQUFLLENBQUMsUUFBUSxRQUFRLGFBQWEsUUFBUSxJQUFJO0FBRTVFLElBQU0sZUFBZTtBQUFBLEVBQ25CLE9BQU8sQ0FBQyxjQUFjO0FBQUEsRUFDdEIsS0FBSztBQUFBLEVBQ0wsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUNaO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUI7QUFBQSxJQUNFLEdBQUc7QUFBQSxJQUNILFFBQVEsQ0FBQyxLQUFLO0FBQUEsSUFDZCxPQUFPLENBQUM7QUFBQSxFQUNWO0FBQUEsRUFDQTtBQUFBLElBQ0UsR0FBRztBQUFBLElBQ0gsUUFBUSxDQUFDLEtBQUs7QUFBQSxJQUNkLGVBQWUsU0FBZTtBQUM1QixjQUFRLFNBQVM7QUFBQSxRQUNmLEdBQUksUUFBUSxVQUFVLENBQUM7QUFBQSxRQUN2QixlQUFlO0FBQUEsUUFDZixtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
