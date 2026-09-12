import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "^/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
