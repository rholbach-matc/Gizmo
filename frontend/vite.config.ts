import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VITE_PROXY_API_BASE_URL ?? "http://127.0.0.1:8010";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/bm-entries": apiTarget,
      "/bowls": apiTarget,
      "/dashboard": apiTarget,
      "/episode-entries": apiTarget,
      "/fluid-entries": apiTarget,
      "/food-entries": apiTarget,
      "/foods": apiTarget,
      "/health": apiTarget,
      "/medication-entries": apiTarget,
      "/vet-visit-entries": apiTarget,
      "/vomit-entries": apiTarget,
      "/water-entries": apiTarget,
      "/weight-entries": apiTarget,
    },
  },
});
