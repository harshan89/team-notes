import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const AUTH_URL = process.env.AUTH_URL ?? "http://localhost:4000";
const NOTES_URL = process.env.NOTES_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser only talks to Vite; Vite forwards API calls to the services (no CORS needed).
    proxy: {
      "/api/auth": { target: AUTH_URL, rewrite: (path) => path.replace(/^\/api/, "") },
      "/api/notes": { target: NOTES_URL, rewrite: (path) => path.replace(/^\/api/, "") },
    },
  },
});
