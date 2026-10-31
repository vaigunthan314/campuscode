import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Stale compiled `.js` twins sit next to the real `.tsx` sources in src/.
  // Vite's default order tries ".js" first, which would resolve `./App` to the
  // broken src/App.js instead of src/App.tsx. Prefer the TypeScript sources.
  resolve: {
    extensions: [".tsx", ".ts", ".mts", ".jsx", ".mjs", ".js", ".json"],
  },
  server: {
    host: "127.0.0.1",
  },
});
