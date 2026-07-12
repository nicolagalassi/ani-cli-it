import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Renderer-only Vite config. The Electron main/preload are plain CommonJS
// (electron/*.cjs) and need no bundling. `base: "./"` makes the production
// build load correctly from the file:// protocol inside Electron.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
