"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── FlipBadge ────────────────────────────────────────────────────────────────
// Componente condiviso usato in Hero, About, Education, Contact, ViewAllProjects.
// Replica 1:1 l'animazione Aceternity LayoutTextFlip:
//   • motion layout  → il badge si allarga/stringe fluidamente tra le parole
//   • AnimatePresence mode="popLayout" → overlap pulito uscita/entrata
//   • La parola ENTRA dall'alto (y:-40, blur) ed ESCE verso il basso (y:50, blur)
//
// Props:
//   words        – array di stringhe da ciclare
//   interval     – ms tra un cambio e l'altro (default 2500)
//   className    – classi extra sul badge arancione (font-size, padding, ecc.)
//   autoStart    – inizia subito a girare (default true)

interface FlipBadgeProps {
  words: string[];
  interval?: number;
  className?: string;
  style?: React.CSSProperties;
  autoStart?: boolean;
}

export function FlipBadge({
  words,
  interval = 2500,
  className = "",
  style,
  autoStart = true,
}: FlipBadgeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoStart) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoStart, interval, words.length]);

  return (
    // motion layout → ridimensiona fluidamente il badge quando cambia la parola
    <motion.span
      layout
      transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      className={`font-orange uppercase tracking-tight rounded-lg inline-flex items-center overflow-hidden select-none bg-[hsl(var(--accent-orange))] text-black ${className}`}
      style={style}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={currentIndex}
          // Aceternity: entra dall'alto, esce verso il basso
          initial={{ y: -40, filter: "blur(10px)", opacity: 1 }}
          animate={{ y: 0,   filter: "blur(0px)",  opacity: 1 }}
          exit={{   y: 50,   filter: "blur(10px)", opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block whitespace-nowrap"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
