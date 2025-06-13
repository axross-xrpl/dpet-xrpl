import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@repo/frontend": path.resolve(__dirname, "../frontend/src"),
      "@repo/frontend-dpet": path.resolve(__dirname, "../frontend-dpet/src"),
    },
  },
});
