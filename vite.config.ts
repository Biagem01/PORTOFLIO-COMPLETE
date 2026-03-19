import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, "client"),
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "client/public"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,

    // ✅ Target moderno — elimina polyfill inutili per browser vecchi
    target: "es2020",

    // ✅ Soglia warning chunk: alzata a 600KB per evitare falsi positivi
    //    dopo il code splitting i chunk reali saranno molto più piccoli
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /* ── manualChunks — divide il bundle in chunk lazy-loaded ──────────
         *
         * STRATEGIA:
         * • react-vendor:    React + ReactDOM — stabile, cached a lungo
         * • framer:          Framer Motion — grande ma serve solo nelle pagine animate
         * • gsap:            GSAP + ScrollTrigger — serve solo nelle pagine con scroll
         * • ui-icons:        Lucide React — icone, cambiano raramente
         * • pages:           Ogni pagina diventa lazy chunk separato (gestito da React.lazy)
         *
         * RISULTATO ATTESO:
         * Prima:  chunk-FJ2A54M7: 906KB, chunk-B5BJ7X3G: 427KB
         * Dopo:   react-vendor: ~140KB, framer: ~160KB, gsap: ~80KB, ui-icons: ~35KB
         *         + chunks pagina da 50-150KB ciascuno
         */
        manualChunks(id: string) {
          // React core — caricato per primo, cachato a lungo
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) {
            return "react-vendor";
          }

          // Framer Motion — separato perché grande e serve solo dopo FCP
          if (id.includes("node_modules/framer-motion/") ||
              id.includes("node_modules/motion/")) {
            return "framer";
          }

          // GSAP + ScrollTrigger — separato, caricato solo quando serve
          if (id.includes("node_modules/gsap/")) {
            return "gsap";
          }

          // Lucide React — icone SVG, cambia raramente
          if (id.includes("node_modules/lucide-react/")) {
            return "ui-icons";
          }

          // Wouter (router) — piccolissimo ma separato per cache
          if (id.includes("node_modules/wouter/")) {
            return "router";
          }

          // Resto dei node_modules — vendor generico
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },

        // ✅ Nomi chunk stabili per cache HTTP a lungo termine
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
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
