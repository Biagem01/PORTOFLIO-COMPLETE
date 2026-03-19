/**
 * CustomCursor.tsx — Performance edition v3
 *
 * MOBILE FIX v3:
 * • useIsTouch() — (hover:none)+(pointer:coarse) = touch → return null
 * • Zero DOM, zero rAF, zero eventi su mobile
 * • Desktop invariato rispetto alla v2
 */

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorVariant = "default" | "small" | "medium" | "big" | "hidden" | "view" | "details";

const SIZES: Record<CursorVariant, { w: number; h: number }> = {
  default: { w: 38,  h: 38  },
  small:   { w: 22,  h: 22  },
  medium:  { w: 100, h: 100 },
  big:     { w: 250, h: 250 },
  view:    { w: 170, h: 170 },
  details: { w: 170, h: 170 },
  hidden:  { w: 38,  h: 38  },
};

const SPRING_CONFIG = { damping: 20, stiffness: 180, mass: 0.3 };

function resolveVariant(elems: Element[]): CursorVariant {
  for (const el of elems) {
    const h = el as HTMLElement;
    if (h.closest?.("[data-cursor='details']")) return "details";
  }
  for (const el of elems) {
    const h = el as HTMLElement;
    if (h.closest?.("[data-cursor='hide']"))    return "hidden";
    if (h.closest?.("[data-cursor='view']"))    return "view";
    if (h.closest?.("[data-cursor='small']"))   return "small";
    if (h.closest?.("[data-cursor='medium']"))  return "medium";
    if (h.closest?.("[data-cursor='big']"))     return "big";
  }
  return "default";
}

/* ─── Touch detection ────────────────────────────────────────────────────── */
function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: none) and (pointer: coarse)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

/* ─── Shell: null su touch, cursore su desktop ───────────────────────────── */
export default function CustomCursor() {
  const isTouch = useIsTouch();
  if (isTouch) return null;
  return <DesktopCursor />;
}

function DesktopCursor() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const prefersReduced = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const x = useSpring(rawX, prefersReduced.current ? { damping: 1, stiffness: 1000 } : SPRING_CONFIG);
  const y = useSpring(rawY, prefersReduced.current ? { damping: 1, stiffness: 1000 } : SPRING_CONFIG);

  const [variant, setVariant] = useState<CursorVariant>("default");
  const variantRef = useRef<CursorVariant>("default");

  useEffect(() => {
    let rafId: number | null = null;
    const latest = { x: 0, y: 0 };

    const processFrame = () => {
      rafId = null;
      rawX.set(latest.x);
      rawY.set(latest.y);
      const elems = document.elementsFromPoint(latest.x, latest.y) ?? [];
      const next  = resolveVariant(elems as Element[]);
      if (next !== variantRef.current) {
        variantRef.current = next;
        setVariant(next);
      }
    };

    const onMove = (e: MouseEvent) => {
      latest.x = e.clientX;
      latest.y = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(processFrame);
    };

    const onLeave = () => {
      if (variantRef.current !== "hidden") {
        variantRef.current = "hidden";
        setVariant("hidden");
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [rawX, rawY]);

  const isDetails = variant === "details";
  const size      = SIZES[variant];
  const isVisible = variant !== "hidden";

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[999999] flex items-center justify-center font-semibold uppercase tracking-widest"
      style={{ x, y, translateX: "-50%", translateY: "-50%", willChange: "transform" }}
      animate={{
        width:  size.w,
        height: size.h,
        opacity: isVisible ? 1 : 0,
        borderRadius: "999px",
        backgroundColor: "rgb(235, 89, 57)",
        mixBlendMode: (isDetails || variant === "view") ? "normal" : "difference",
      }}
      transition={
        prefersReduced.current
          ? { duration: 0 }
          : { type: "spring", stiffness: 220, damping: 26 }
      }
    >
      {variant === "view" && !isDetails && (
        <span className="pointer-events-none text-[14px] text-black select-none">
          VIEW DETAILS
        </span>
      )}
    </motion.div>
  );
}
