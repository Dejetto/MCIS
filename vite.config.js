import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Semua request ke /api/* dari frontend akan diteruskan ke backend Express
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
