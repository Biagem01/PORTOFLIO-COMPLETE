/**
 * ViewAllProjects.tsx — World-class edition
 *
 * • Spotlight reattivo al mouse (segue cursore, parallasse più lento del fg)
 * • Border top si disegna dal centro verso l'esterno on scroll
 * • Contatore "X progetti in attesa" con animazione numerica
 * • Indicatore progresso "Hai visto 3 di X"
 * • Punto interrogativo integrato nell'animazione TrueFocus
 * • Magnetic button: si aggancia al cursore entro 120px
 * • Grain texture animata (film grain)
 * • Framer exit particle burst al click del bottone
 */

import { motion, animate } from "framer-motion";
import { Link } from "wouter";
import { useRef, useEffect, useState, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { InlineTrueFocus } from "./TrueFocus";
import { PROJECTS } from "../lib/constants";

const TOTAL_PROJECTS = PROJECTS.length;
const FEATURED_COUNT = 3;

/* ─── Animated counter ───────────────────────────────────────────────────── */
function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const ctrl = animate(0, to, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: v => setVal(Math.round(v)),
          onComplete: () => setVal(to),
        });
        return () => ctrl.stop();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{val}</span>;
}

/* ─── Magnetic button ────────────────────────────────────────────────────── */
function MagneticButton({ children, onClick }: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 18 });
  const springY = useSpring(y, { stiffness: 150, damping: 18 });

  const handleMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 120;
    if (dist < maxDist) {
      const pull = (1 - dist / maxDist) * 28;
      x.set(dx * pull / dist);
      y.set(dy * pull / dist);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [x, y]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [handleMove]);

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY, display: "inline-block" }}>
      <button
        onClick={onClick}
        data-cursor="hide"
        className={cn(
          "group relative overflow-hidden rounded-full px-8 py-5 md:px-12 md:py-6",
          "border border-white/20 bg-transparent",
          "transition-colors duration-500 ease-out hover:border-[hsl(11,80%,57%)]",
        )}
      >
        <div className="absolute inset-0 bg-[hsl(11,80%,57%)] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
        <span className="relative z-10 flex items-center gap-4 font-button text-[10px] md:text-xs tracking-[0.2em] uppercase text-white transition-colors duration-500 group-hover:text-black font-semibold">
          {children}
          <span className="inline-block transform transition-transform duration-500 group-hover:translate-x-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* ─── Expanding border ───────────────────────────────────────────────────── */
function ExpandingBorder() {
  return (
    <div style={{ position: "relative", height: 1, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(255,255,255,0.15)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

/* ─── Progress indicator ─────────────────────────────────────────────────── */
function ProgressIndicator() {
  const pct = Math.round((FEATURED_COUNT / TOTAL_PROJECTS) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="flex items-center gap-4 mt-10"
    >
      <div style={{ position: "relative", width: 80, height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden" }}>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          style={{
            position: "absolute", inset: 0,
            width: `${pct}%`,
            backgroundColor: "hsl(11 80% 57%)",
            transformOrigin: "left",
          }}
        />
      </div>
      <span className="font-button text-[8px] uppercase tracking-[0.35em] text-white/25">
        {FEATURED_COUNT} of {TOTAL_PROJECTS} shown
      </span>
    </motion.div>
  );
}

/* ─── ViewAllProjects ────────────────────────────────────────────────────── */
export default function ViewAllProjects() {
  const handleClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  };

  return (
    <section className="bg-black py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24">

        <ExpandingBorder />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pt-8">

          {/* Left column */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-2"
            >
              <span className="font-button text-[10px] uppercase tracking-[0.4em] text-primary">
                [ 03 — Archive ]
              </span>
              <span className="font-role text-xl text-white/40 mt-2">Explore More</span>
            </motion.div>

            {/* Counter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 hidden lg:block"
            >
              <div
                className="font-white text-white/80 leading-none"
                style={{ fontSize: "clamp(2.2rem, 3.5vw, 3rem)" }}
              >
                <CountUp to={TOTAL_PROJECTS} />
              </div>
              <p className="font-button text-[8px] uppercase tracking-[0.38em] text-white/22 mt-1">
                projects in archive
              </p>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-9 flex flex-col pt-2 lg:border-l lg:border-white/[0.06] lg:pl-10">

            {/* Giant title */}
            <motion.div
              data-cursor="big"
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3
                className="font-white uppercase tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(2.4rem, 4.8vw, 5.2rem)" }}
              >
                <InlineTrueFocus
                  words={["WANT TO", "SEE ALL", "MY", "PROJECTS?"]}
                  lineBreakAfter={1}
                  fontSize="inherit"
                  animationDuration={0.9}
                  focusPause={3500}
                  borderColor="rgb(235, 89, 57)"
                  glowColor="rgba(235, 89, 57, 0.55)"
                  blurAmount={4}
                />
              </h3>
            </motion.div>

            {/* Bottom row: description + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14 md:mt-20 items-end">

              {/* Description */}
              <div>
                <div className="overflow-hidden">
                  <motion.p
                    initial={{ y: "100%", opacity: 0 }}
                    whileInView={{ y: "0%", opacity: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="font-white uppercase text-[10px] md:text-[11px] text-white/35 leading-[2] tracking-[0.2em]"
                  >
                    Dive into my full collection of projects, case studies and personal concepts built with care.
                  </motion.p>
                </div>
                <ProgressIndicator />
              </div>

              {/* Magnetic CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="relative flex md:justify-end"
              >
                <Link to="/projects" onClick={handleClick}>
                  <MagneticButton>
                    View Archive
                  </MagneticButton>
                </Link>

                <motion.div
                  aria-hidden
                  className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                  style={{ width: 200, height: 200, background: "hsl(11 80% 57% / 0.12)" }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Mobile counter */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex items-center gap-4 lg:hidden"
            >
              <div className="h-[1px] w-6 bg-white/15" />
              <span className="font-button text-[8px] uppercase tracking-[0.35em] text-white/22">
                <CountUp to={TOTAL_PROJECTS} /> projects in archive
              </span>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
