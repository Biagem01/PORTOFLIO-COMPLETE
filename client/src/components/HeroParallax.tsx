"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Link } from "wouter";

export interface ParallaxProject {
  id: string; title: string; category: string; year: string; video: string;
}
interface HeroParallaxProps {
  projects: ParallaxProject[];
  headline?: React.ReactNode;
}

// Keyframes CSS una volta sola
const STYLE_ID = "hero-marquee-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes marquee-left  { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
    @keyframes marquee-right { from { transform: translateX(-33.333%); } to { transform: translateX(0); } }
  `;
  document.head.appendChild(s);
}

/* ─── MarqueeRow ───────────────────────────────────────────────────────────── */
function MarqueeRow({ projects, direction, scrollTranslate, duration = 30 }: {
  projects: ParallaxProject[];
  direction: "left" | "right";
  scrollTranslate: MotionValue<number>;
  duration?: number;
}) {
  const items = [...projects, ...projects, ...projects];
  return (
    <motion.div style={{ x: scrollTranslate, overflow: "visible" }}>
      <div style={{
        display: "flex", gap: 12, width: "max-content",
        animation: `${direction === "left" ? "marquee-left" : "marquee-right"} ${duration}s linear infinite`,
        willChange: "transform",
      }}>
        {items.map((p, i) => (
          <ProjectCard key={`${p.id}-${i}`} project={p} index={i % projects.length} />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── HeroParallax ─────────────────────────────────────────────────────────── */
export function HeroParallax({ projects, headline }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // ✅ Niente spring — useTransform diretti, zero calcoli fisici per frame
  const rotateX  = useTransform(scrollYProgress, [0, 0.35], [15, 0]);
  const rotateZ  = useTransform(scrollYProgress, [0, 0.35], [20, 0]);
  const opacity  = useTransform(scrollYProgress, [0, 0.35], [0.2, 1]);
  const gridY    = useTransform(scrollYProgress, [0, 0.35], [-700, 0]);

  const translateX        = useTransform(scrollYProgress, [0.35, 1], [0,  800]);
  const translateXReverse = useTransform(scrollYProgress, [0.35, 1], [0, -800]);

  const headlineY       = useTransform(scrollYProgress, [0, 0.4],    [0, -80]);
  const headlineOpacity = useTransform(scrollYProgress, [0.1, 0.38], [1, 0]);

  return (
    <div ref={ref} style={{ height: "300vh", position: "relative", background: "hsl(240 10% 5%)" }}>
      {/* Grain */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />

      {/* Vignette */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "none",
        background: "linear-gradient(to right, hsl(240 10% 5%) 0%, transparent 7%, transparent 93%, hsl(240 10% 5%) 100%), linear-gradient(to bottom, hsl(240 10% 5%) 0%, transparent 10%, transparent 88%, hsl(240 10% 5%) 100%)" }} />

      {/* Sticky container */}
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", perspective: "1000px" }}>

        <motion.div style={{ y: headlineY, opacity: headlineOpacity, position: "absolute", top: "10vh", left: 0, zIndex: 10, maxWidth: 960, padding: "0 48px" }}>
          {headline}
        </motion.div>

        <motion.div
          data-cursor="hide"
          style={{ rotateX, rotateZ, y: gridY, opacity, position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <MarqueeRow projects={projects}                direction="left"  scrollTranslate={translateX}        duration={32} />
          <MarqueeRow projects={[...projects].reverse()} direction="right" scrollTranslate={translateXReverse} duration={26} />
          <MarqueeRow projects={projects}                direction="left"  scrollTranslate={translateX}        duration={38} />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── ProjectCard ──────────────────────────────────────────────────────────── */
const ProjectCard = React.memo(function ProjectCard({ project, index }: {
  project: ParallaxProject; index: number;
}) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      style={{ flexShrink: 0, width: "clamp(240px, 28vw, 500px)", height: "clamp(150px, 18vw, 360px)", zIndex: 5 }}
      className="group/product relative cursor-none"
    >
      <Link href={`/project/${project.id}`} style={{ display: "block", height: "100%" }}>
        <div className="relative h-full w-full overflow-hidden transition-transform duration-300 ease-out group-hover/product:scale-[1.04]"
          style={{ borderRadius: 14 }}>

          {inView ? (
            <video autoPlay muted loop playsInline
              className="absolute inset-0 h-full w-full object-cover object-left-top"
              src={project.video} />
          ) : (
            <div className="absolute inset-0 bg-[hsl(240_10%_10%)]" />
          )}

          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
          <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-500 group-hover/product:opacity-75" />
          <div className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-300 group-hover/product:opacity-100"
            style={{ boxShadow: "inset 0 0 0 1px hsl(38 33% 57% / 0.5), 0 0 40px rgba(235,89,57,0.12)" }} />

          <span aria-hidden style={{ position: "absolute", top: 14, left: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "hsl(38 33% 57%)", opacity: 0.35, transition: "opacity 0.3s" }}
            className="group-hover/product:opacity-0">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5 opacity-0 transition-opacity duration-300 group-hover/product:opacity-100">
            <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: "hsl(11 80% 57%)", marginBottom: 6 }}>
              {project.category} — {project.year}
            </span>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 900, fontSize: "clamp(1rem, 1.8vw, 1.5rem)", color: "white", lineHeight: 1.05 }}>
              {project.title}
            </h3>
          </div>

          <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover/product:opacity-100"
            style={{ background: "hsl(11 80% 57%)" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 8L8 2M8 2H4M8 2V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
});
