import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, "client"), // la root è client
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),     // src dentro client
      "@shared": path.resolve(__dirname, "shared"),   // shared fuori da client
      "@assets": path.resolve(__dirname, "client/public"), // public dentro client
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // build fuori da client
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
}));
