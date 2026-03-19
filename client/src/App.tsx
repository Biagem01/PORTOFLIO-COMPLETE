import { Switch, Route, useLocation } from "wouter";
import { useState, useLayoutEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";

import CustomCursor from "@/components/CustomCursor";
import LoadingScreen from "@/components/LoadingScreen";

/* ✅ Lazy import delle pagine — ogni pagina diventa un chunk separato
 * scaricato solo quando l'utente naviga su quella route.
 *
 * PRIMA: tutti e 4 i bundle scaricati al primo carico (anche se non servono)
 * DOPO:  solo Index scaricato subito, AllProjects e ProjectPage on-demand
 *
 * Nota: Index NON è lazy perché è la home — viene sempre visitata per prima.
 * NotFound è lazy perché raramente raggiunta.
 */
import Index from "./pages/Index";

const AllProjects = lazy(() => import("./pages/AllProjects"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const NotFound    = lazy(() => import("./pages/NotFound"));

if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}

/* ─── Fallback minimalista durante il caricamento lazy ──────────────────── */
/* Schermo nero puro — coerente col tema del sito, zero flash visivo */
function PageFallback() {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "#000000",
        zIndex: 50,
      }}
    />
  );
}

function Router() {
  return (
    /* Suspense wrappa tutte le route lazy — mostra PageFallback
     * mentre il chunk della pagina viene scaricato */
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/projects" component={AllProjects} />
        <Route path="/project/:id" component={ProjectPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    const skipReset = sessionStorage.getItem("skip_scroll_reset");
    if (skipReset) {
      sessionStorage.removeItem("skip_scroll_reset");
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(raf);
  }, [location]);

  return null;
}

export default function App() {
  const isFirstLoad = !sessionStorage.getItem("app_loaded");
  const [isLoading, setIsLoading] = useState(isFirstLoad);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" forcedTheme="dark">
        <TooltipProvider>
          <CustomCursor />

          {isLoading && (
            <LoadingScreen
              onComplete={() => {
                sessionStorage.setItem("app_loaded", "1");
                setIsLoading(false);
              }}
            />
          )}

          {!isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <ScrollToTop />
              <Router />
              <Toaster />
              <Sonner />
            </motion.div>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
