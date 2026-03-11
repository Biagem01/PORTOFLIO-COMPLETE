import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 180, mass: 0.3 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  const [variant, setVariant] = useState<
    "default" | "small" | "medium" | "big" | "hidden" | "view" | "details"
  >("default"); // 🔥 aggiunta variante "medium"

  useEffect(() => {
    let rafId: number | null = null;
    const latest = { x: 0, y: 0, target: null as HTMLElement | null };

    const process = () => {
      const px = latest.x;
      const py = latest.y;
      const target = latest.target;

      cursorX.set(px);
      cursorY.set(py);

      const elems = (document.elementsFromPoint(px, py) || []) as Element[];

      for (const el of elems) {
        const elh = el as HTMLElement;
        if (elh.closest && elh.closest("[data-cursor='details']")) {
          setVariant("details");
          rafId = null;
          return;
        }
      }

      for (const el of elems) {
        const elh = el as HTMLElement;
        if (elh.closest && elh.closest("[data-cursor='hide']")) {
          setVariant("hidden");
          rafId = null;
          return;
        }
      }

      if (target && target.closest("[data-cursor='hide']")) {
        setVariant("hidden");
      } else if (target && target.closest("[data-cursor='view']")) {
        setVariant("view");
      } else if (target && target.closest("[data-cursor='small']")) {
        setVariant("small");
      } else if (target && target.closest("[data-cursor='medium']")) { // 🔥 nuova variante
        setVariant("medium");
      } else if (target && target.closest("[data-cursor='big']")) {
        setVariant("big");
      } else {

        setVariant("default");
      }

      rafId = null;
    };

    const move = (e: MouseEvent) => {
      latest.x = e.clientX;
      latest.y = e.clientY;
      latest.target = e.target as HTMLElement | null;
      if (rafId == null) rafId = requestAnimationFrame(process);
    };

    const handleMouseLeave = () => {
      setVariant("hidden");
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [cursorX, cursorY]);

  const isDetails = variant === "details";

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[999999] flex items-center justify-center font-semibold uppercase tracking-widest"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      animate={{
        width:
          variant === "view" ? 170 :
          variant === "small" ? 22 :
          variant === "medium" ? 100 : // 🔥 grandezza media per logo
          variant === "big" ? 250 :
          38,
        height:
          variant === "view" ? 170 :
          variant === "small" ? 22 :
          variant === "medium" ? 100 : // 🔥 altezza media
          variant === "big" ? 250 :
          38,
        opacity: variant === "hidden" ? 0 : 1,
        borderRadius: "999px",
        backgroundColor: "rgb(235, 89, 57)",
        mixBlendMode: isDetails ? "normal" : variant === "view" ? "normal" : "difference",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      {variant === "view" && !isDetails && (
        <span className="pointer-events-none text-[14px] text-black">VIEW DETAILS</span>
      )}
    </motion.div>
  );
}