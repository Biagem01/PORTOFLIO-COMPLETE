import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  Variants,
  Transition,
} from "framer-motion";

// ─── SpinningText (Magic UI) ──────────────────────────────────────────────────

const CIRCULAR_COLORS = [
  "hsl(var(--scroll-indicator))",
  "hsl(var(--accent-orange))",
];

const CIRCULAR_SEGMENTS: { text: string; colorIdx: number }[] = [
  { text: "PORT",     colorIdx: 1 },
  { text: "FOLIO",    colorIdx: 0 },
  { text: "*",        colorIdx: 1 },
  { text: "BIAGIO",   colorIdx: 1 },
  { text: "*",        colorIdx: 0 },
  { text: "CUBISINO", colorIdx: 0 },
  { text: "*",        colorIdx: 1 },
];

const CIRCULAR_FULL_TEXT = CIRCULAR_SEGMENTS.map((s) => s.text).join("");
const CIRCULAR_COLOR_MAP: string[] = [];
for (const seg of CIRCULAR_SEGMENTS) {
  for (let i = 0; i < seg.text.length; i++) {
    CIRCULAR_COLOR_MAP.push(CIRCULAR_COLORS[seg.colorIdx]);
  }
}

interface SpinningTextProps {
  duration?: number;
  reverse?: boolean;
  radius?: number;
  className?: string;
}

function SpinningText({
  duration = 20,
  reverse = false,
  radius = 5,
  className = "",
}: SpinningTextProps) {
  const letters = [...Array.from(CIRCULAR_FULL_TEXT), " "];
  const total = letters.length;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: 200, height: 200, margin: "0 auto" }}
      initial={{ rotate: 0 }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration }}
    >
      {letters.map((letter, index) => (
        <motion.span
          aria-hidden="true"
          key={`${index}-${letter}`}
          className="absolute top-1/2 left-1/2 inline-block"
          style={{
            transform: `
              translate(-50%, -50%)
              rotate(${(360 / total) * index}deg)
              translateY(calc(${radius} * -1ch))
            `,
            transformOrigin: "center",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: CIRCULAR_COLOR_MAP[index] ?? CIRCULAR_COLORS[0],
          }}
        >
          {letter}
        </motion.span>
      ))}
      <span className="sr-only">{CIRCULAR_FULL_TEXT}</span>
    </motion.div>
  );
}

// ─── BounceLoader ─────────────────────────────────────────────────────────────

function BounceLoader() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div
        className="h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.3s]"
        style={{ backgroundColor: "hsl(var(--accent-orange))" }}
      />
      <div
        className="h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.15s]"
        style={{ backgroundColor: "hsl(var(--accent-orange))" }}
      />
      <div
        className="h-2.5 w-2.5 animate-bounce rounded-full"
        style={{ backgroundColor: "hsl(var(--accent-orange))" }}
      />
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

type LoadingScreenProps = {
  onComplete: () => void;
  durationMs?: number;
  holdMs?: number;
};

export default function LoadingScreen({
  onComplete,
  durationMs = 5000,
  holdMs = 500,
}: LoadingScreenProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);

  const holdTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    if (reduce) {
      holdTimerRef.current = window.setTimeout(() => setOpen(false), 60);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        holdTimerRef.current = window.setTimeout(() => setOpen(false), holdMs);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    };
  }, [durationMs, holdMs, reduce, open]);

  // ── Variants ────────────────────────────────────────────────────────────────
  const overlayVariants: Variants = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: { duration: reduce ? 0.15 : 0.45, ease: "easeInOut" },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeInOut" } as Transition,
    },
  };

  const loaderVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeInOut", delay: 0.8 } as Transition,
    },
  };

  const centerVariants: Variants = {
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.6 } },
    exit: { opacity: 0, y: -8, transition: { duration: reduce ? 0.15 : 0.35 } },
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black text-white overflow-x-clip overflow-y-hidden [contain:layout_paint_size]"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          role="dialog"
          aria-label="Loading"
          data-cursor="hide"
        >
          {/* Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/50" />

          {/* CENTER */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center select-none px-6"
            variants={centerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* LOGO + SPINNING TEXT */}
            <motion.div
              className="relative flex items-center justify-center [transform:translateZ(0)]"
              style={{ width: 200, height: 200 }}
              variants={logoVariants}
              initial="hidden"
              animate="visible"
            >
              {!reduce && (
                <div className="absolute inset-0">
                  <SpinningText duration={20} radius={8.5} />
                </div>
              )}

              <motion.img
                src="/logo/favicon.png"
                alt="Logo"
                className="relative z-10 h-[100px] w-[100px] sm:h-[140px] sm:w-[140px] object-contain pointer-events-none select-none"
              />
            </motion.div>

            {/* BOUNCE LOADER */}
            <motion.div
              className="mt-8"
              variants={loaderVariants}
              initial="hidden"
              animate="visible"
            >
              <BounceLoader />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
