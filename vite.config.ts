import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Keep React ecosystem together in the main vendor chunk for stability
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler") || id.includes("wouter")) {
              return "vendor-core";
            }
            // Only split truly heavy, isolated libraries
            if (id.includes("recharts")) return "vendor-recharts";
            if (id.includes("framer-motion")) return "vendor-framer";
            if (id.includes("@stripe")) return "vendor-stripe";
            return "vendor";
          }
        },
      },
    },
  },
});
// trigger rebuild
