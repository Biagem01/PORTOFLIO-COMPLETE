/**
 * AllProjects.tsx — Responsive edition
 *
 * FIX MOBILE:
 * • Tutti i padding fissi 48px → clamp(16px, 5vw, 48px)
 * • Header row: flex-wrap su mobile (titolo sopra, counter/toggle sotto)
 * • Su mobile viewMode forzato a "grid" — lista con video preview non ha senso su touch
 * • Toggle lista/griglia nascosto su mobile (sempre griglia)
 * • ProjectListItem video preview disabilitato su touch
 * • ProjectGridItem: griglia minmax ridotto a 160px su mobile
 * • CategoryFilters: scroll orizzontale su mobile invece di wrap
 */

import { useLayoutEffect, useRef, useEffect, useState, useMemo } from 'react';
import gsap from 'gsap';
import { motion, useScroll, useSpring, AnimatePresence, animate, LayoutGroup } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { PROJECTS } from '../lib/constants';
import Footer from '../components/Footer';
import { HeroParallax } from '../components/HeroParallax';
import { MorphingSvgFilters } from '@/components/MorphingLine';
import { TwoWordFocus } from '@/components/TrueFocus';

/* ─── Hook isMobile ──────────────────────────────────────────────────────── */
function useIsMobile(bp = 768) {
  const [m, setM] = useState(
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const h = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", h);
    setM(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return m;
}

/* ─── Counter ────────────────────────────────────────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const ctrl = animate(from, value, {
      duration: 0.55, ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplayed(Math.round(v)),
      onComplete: () => setDisplayed(value),
    });
    return () => ctrl.stop();
  }, [value]);
  return <span className="tabular-nums">{displayed}</span>;
}

/* ─── Marquee ────────────────────────────────────────────────────────────── */
function Marquee() {
  const items = ["Video Production", "Motion Design", "Direction", "Cinematography", "Post\u2011Production", "Color Grading"];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid hsl(38 33% 57% / 0.08)", borderBottom: "1px solid hsl(38 33% 57% / 0.08)", padding: "14px 0" }}>
      <motion.div
        style={{ display: "flex", gap: 64, width: "max-content" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.3, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: "hsl(11 80% 57%)", opacity: 0.6 }}>✶</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── HoverVideo ─────────────────────────────────────────────────────────── */
function HoverVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { videoRef.current?.play().catch(() => {}); }, []);
  return (
    <video ref={videoRef} muted loop playsInline preload="none"
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
      src={src} />
  );
}

/* ─── ScrollProgressBar ──────────────────────────────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  return (
    <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "hsl(11 80% 57%)", zIndex: 9998 }} />
  );
}

/* ─── CategoryFilters ────────────────────────────────────────────────────── */
const ALL = "All";

function CategoryFilters({ categories, active, onChange }: {
  categories: string[]; active: string; onChange: (c: string) => void;
}) {
  return (
    /* ✅ FIX: su mobile scroll orizzontale invece di wrap — evita pill su 3 righe */
    <div style={{
      display: "flex", gap: 8, alignItems: "center",
      overflowX: "auto", paddingBottom: 4,
      /* Nasconde scrollbar visivamente */
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}
      className="hide-scrollbar"
    >
      {[ALL, ...categories].map(cat => {
        const isActive = cat === active;
        return (
          <motion.button
            key={cat}
            data-cursor="hide"
            onClick={() => onChange(cat)}
            className="relative rounded-full text-[9px] font-mono uppercase tracking-[0.25em] transition-colors duration-200"
            style={{
              flexShrink: 0, /* ✅ Non si restringe su mobile */
              padding: "5px 12px",
              border: `1px solid ${isActive ? "hsl(11 80% 57%)" : "hsl(38 33% 57% / 0.2)"}`,
              color: isActive ? "#000" : "hsl(38 33% 57%)",
              background: isActive ? "hsl(11 80% 57%)" : "transparent",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}

function ProjectListItem({ project, index, onNavigate, isMobile }: {
  project: (typeof PROJECTS)[0]; index: number; onNavigate: () => void; isMobile: boolean;
}) {
  const ref      = useRef<HTMLLIElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [visible,   setVisible]   = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile || rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      videoRef.current.style.left = `${60 + px * 10}%`;
      videoRef.current.style.top  = `${40 + py * 20}%`;
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.li
      ref={ref}
      data-cursor="hide"
      initial={{ opacity: 0, x: -32 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.03 * (index % 6) }}
      style={{ position: "relative" }}
    >
      <div style={{ transformOrigin: "left", position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "hsl(38 33% 57% / 0.12)", transform: visible ? "scaleX(1)" : "scaleX(0)", transition: `transform 0.6s ${0.03 * (index % 6)}s cubic-bezier(0.16,1,0.3,1)` }} />
      <a
        href={`/project/${project.id}`}
        onClick={() => { sessionStorage.setItem('project_back', '/projects'); onNavigate(); }}
        onMouseEnter={() => { if (!isMobile) setIsHovered(true);  }}
        onMouseLeave={() => { if (!isMobile) setIsHovered(false); }}
        onMouseMove={handleMouseMove}
        className="group"
        style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "20px 0" : "32px 0",
          textDecoration: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 32, position: "relative", zIndex: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "hsl(38 33% 57%)", opacity: isHovered ? 0 : 0.2, letterSpacing: "0.1em", transition: "opacity 0.2s", minWidth: "2.2rem", display: "block" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <span style={{
              display: "block", fontFamily: "'Tanker', sans-serif", fontWeight: 900,
              fontSize: isMobile ? "clamp(1.1rem, 5vw, 1.5rem)" : "clamp(1.3rem, 3.5vw, 2.1rem)",
              lineHeight: 1, color: isHovered ? "hsl(11 80% 57%)" : "hsl(38 33% 72%)",
              transform: isHovered ? "translateX(12px)" : "translateX(0)",
              transition: "color 0.25s, transform 0.25s", position: "relative", zIndex: 10,
            }}>
              {project.title}
            </span>
            <span style={{ display: "block", marginTop: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.35 }}>
              {project.category}
            </span>
          </div>
        </div>

        {/* Video preview — solo desktop */}
        {!isMobile && (
          <div ref={videoRef} style={{ position: "absolute", top: "50%", left: "65%", transform: "translate(-50%, -50%) rotate(12.5deg)", width: 256, height: 160, zIndex: 0, pointerEvents: "none", opacity: isHovered ? 1 : 0, scale: isHovered ? "1" : "0", transition: "opacity 0.25s, scale 0.25s" }}>
            {isHovered && <HoverVideo src={project.video} />}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20, position: "relative", zIndex: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "hsl(38 33% 57%)", letterSpacing: "0.15em", opacity: isMobile ? 0.4 : isHovered ? 1 : 0.25, transform: isHovered ? "translateX(0)" : "translateX(6px)", transition: "opacity 0.25s, transform 0.25s" }}>
            {project.year}
          </span>
          <div style={{
            width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
            borderRadius: "50%", background: "hsl(11 80% 57%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            opacity: isMobile ? 1 : isHovered ? 1 : 0,
            transform: isMobile ? "none" : isHovered ? "translateX(0)" : "translateX(25%)",
            transition: "opacity 0.25s, transform 0.25s",
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </a>
    </motion.li>
  );
}

/* ─── ProjectGridItem ────────────────────────────────────────────────────── */
function ProjectGridItem({ project, index, onNavigate, isMobile }: {
  project: (typeof PROJECTS)[0]; index: number; onNavigate: () => void; isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tapped,  setTapped]  = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Su touch: tap attiva il video, secondo tap naviga */
  const isActive = isMobile ? tapped : hovered;

  useEffect(() => {
    if (isActive) videoRef.current?.play().catch(() => {});
    else { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }
  }, [isActive]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !tapped) {
      e.preventDefault(); // primo tap: mostra video
      setTapped(true);
      return;
    }
    // secondo tap (o desktop click): naviga
    sessionStorage.setItem('project_back', '/projects');
    onNavigate();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 * (index % 6) }}
      data-cursor="view"
    >
      <a
        href={`/project/${project.id}`}
        onClick={handleClick}
        style={{ display: "block", textDecoration: "none" }}
        onMouseEnter={() => { if (!isMobile) setHovered(true);  }}
        onMouseLeave={() => { if (!isMobile) setHovered(false); }}
      >
        <div style={{
          position: "relative",
          aspectRatio: "16/10",
          borderRadius: isMobile ? 10 : 12,
          overflow: "hidden",
          background: "hsl(38 33% 57% / 0.04)",
          marginBottom: 12,
        }}>
          <video
            ref={videoRef}
            src={project.video}
            muted loop playsInline preload="none"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isActive ? 1 : 0, transition: "opacity 0.4s ease" }}
          />
          {project.extraMedia?.[0] && (
            <img
              src={project.extraMedia[0]}
              alt={project.title}
              loading="lazy"
              decoding="async"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: isActive ? 0 : 1, transition: "opacity 0.4s ease" }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)", opacity: isActive ? 1 : 0, transition: "opacity 0.4s" }} />

          {/* Arrow / Play icon */}
          <motion.div
            animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 8 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", bottom: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "hsl(11 80% 57%)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isMobile && !tapped ? (
              /* Play icon al primo tap */
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <polygon points="2,1 9,5 2,9" fill="white" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </motion.div>

          {/* Tap hint su mobile non ancora tappato */}
          {isMobile && !tapped && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "hsl(11 80% 57% / 0.8)",
              borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <polygon points="2,1 7,4 2,7" fill="white" />
              </svg>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <span style={{ display: "block", fontFamily: "'Tanker', sans-serif", fontWeight: 900, fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)", lineHeight: 1.1, color: isActive ? "hsl(11 80% 57%)" : "hsl(38 33% 72%)", transition: "color 0.25s" }}>
              {project.title}
            </span>
            <span style={{ display: "block", marginTop: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.35 }}>
              {project.category}
            </span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "hsl(38 33% 57%)", opacity: 0.3, flexShrink: 0, marginTop: 2 }}>
            {project.year}
          </span>
        </div>
      </a>
    </motion.div>
  );
}

/* ─── AllProjects ────────────────────────────────────────────────────────── */
const SCROLL_KEY = "allprojects_scroll";

const AllProjects = () => {
  const overlayRef   = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const listTitleRef = useRef<HTMLHeadingElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();

  /* Default griglia su mobile, lista su desktop — utente può sempre cambiare */
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    typeof window !== "undefined" && window.innerWidth < 768 ? "grid" : "list"
  );

  const [activeCategory, setActiveCategory] = useState(ALL);

  const categories = useMemo(() =>
    Array.from(new Set(PROJECTS.map(p => p.category))).filter(Boolean), []
  );
  const filtered = useMemo(() =>
    activeCategory === ALL ? PROJECTS : PROJECTS.filter(p => p.category === activeCategory),
    [activeCategory]
  );

  const handleNavigate = () => { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); };
  const scrollRestored = useRef(false);

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    gsap.set("body", { overflow: "hidden" });
    const tl = gsap.timeline();
    tl.to(overlayRef.current, { y: "-100%", duration: 1.1, ease: "power4.inOut" });
    tl.call(() => {
      gsap.set("body", { overflow: "auto", clearProps: "overflow" });
      if (!scrollRestored.current) {
        scrollRestored.current = true;
        const saved = sessionStorage.getItem(SCROLL_KEY);
        if (saved) {
          const y = parseInt(saved, 10);
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
          sessionStorage.removeItem(SCROLL_KEY);
        } else {
          window.scrollTo(0, 0);
        }
      }
    });
    return () => { tl.kill(); gsap.set("body", { overflow: "auto", clearProps: "all" }); };
  }, []);

  /* Padding orizzontale adattivo usato in tutti i blocchi */
  const hPad = "clamp(16px, 5vw, 48px)";

  const headline = (
    <div>
      <MorphingSvgFilters />
      <motion.p
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.45, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}
      >
        <span style={{ display: "inline-block", width: 28, height: 1, background: "hsl(11 80% 57%)", opacity: 0.6 }} />
        Biagio Cubisino — Portfolio
      </motion.p>
      <div style={{ overflow: "hidden" }}>
        <motion.div initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ delay: 1.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <h1 ref={heroTitleRef} className="relative" style={{ lineHeight: 0.88, margin: 0 }} data-cursor="big">
            <TwoWordFocus word0="Selected" word1="Works."
              fontSize="clamp(2.2rem, 6.4vw, 5.2rem)" animationDuration={0.9} focusPause={2800}
              borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
              blurAmount={4} frameAnchorRef={heroTitleRef} />
          </h1>
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: "hsl(38 33% 57%)", opacity: 0.4, marginTop: 28, maxWidth: 340, lineHeight: 1.7 }}
      >
        A curated collection of projects spanning video production, motion design, and visual direction.
      </motion.p>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative", zIndex: 10, background: "#000000", minHeight: "100vh" }}>
        <ScrollProgressBar />
        <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ background: "hsl(11 80% 57%)" }} />

        {/* Back button */}
        <motion.div
          className="fixed left-6 top-8 z-50 lg:left-12"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.5 }}
        >
          <Link to="/" className="group flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.4, transition: "opacity 0.3s", textDecoration: "none" }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.4")}
            data-cursor="hide">
            <ArrowLeft size={12} className="transition-transform duration-300 group-hover:-translate-x-1" />
            Back
          </Link>
        </motion.div>

        <HeroParallax projects={PROJECTS} headline={headline} />
        <Marquee />

        {/* Archive section */}
        <div style={{ background: "#000000" }} ref={listRef}>

          {/* ✅ FIX Header row: flex-wrap su mobile */}
          <div style={{ padding: `40px ${hPad} 24px`, borderBottom: "1px solid hsl(38 33% 57% / 0.06)" }}>
            <div style={{
              display: "flex",
              alignItems: isMobile ? "flex-start" : "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap", /* ✅ wrap su mobile */
              gap: isMobile ? 20 : 0,
              marginBottom: 20,
            }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.3, marginBottom: 12 }}>
                  Full archive
                </span>
                <h2 ref={listTitleRef} className="relative" style={{ lineHeight: 1, margin: 0 }} data-cursor="big">
                  <TwoWordFocus word0="All" word1="Works."
                    fontSize="clamp(1.3rem, 3.2vw, 2.4rem)" animationDuration={0.9} focusPause={2800}
                    borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
                    blurAmount={4} frameAnchorRef={listTitleRef} />
                </h2>
              </motion.div>

              {/* Right: counter + toggle — toggle nascosto su mobile */}
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "flex-end", gap: 12 }}
              >
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 5vw, 4rem)", color: "hsl(11 80% 57%)", lineHeight: 1, opacity: 0.25 }}>
                    <AnimatedCounter value={filtered.length} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.25 }}>
                    {filtered.length === 1 ? "work" : "works"}
                  </span>
                </div>

                {/* ✅ Toggle sempre visibile — compatto su mobile, normale su desktop */}
                <div
                  data-cursor="hide"
                  style={{
                    display: "flex", gap: 4,
                    border: "1px solid hsl(38 33% 57% / 0.15)",
                    borderRadius: 8, padding: 3,
                  }}
                >
                  {(["list", "grid"] as const).map(mode => (
                    <motion.button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      data-cursor="hide"
                      animate={{
                        background: viewMode === mode ? "hsl(11 80% 57%)" : "transparent",
                        color: viewMode === mode ? "#000" : "hsl(38 33% 57%)",
                      }}
                      transition={{ duration: 0.2 }}
                      style={{
                        padding: isMobile ? "7px 10px" : "5px 8px", /* più grande su touch */
                        borderRadius: 5, border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center",
                      }}
                    >
                      {mode === "list" ? <List size={isMobile ? 15 : 13} /> : <LayoutGrid size={isMobile ? 15 : 13} />}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Category filters — scroll orizzontale su mobile */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <CategoryFilters
                categories={categories}
                active={activeCategory}
                onChange={cat => setActiveCategory(cat)}
              />
            </motion.div>
          </div>

          {/* Project list or grid */}
          <LayoutGroup>
            <AnimatePresence mode="wait">
              {viewMode === "list" ? (
                <motion.ul
                  key="list"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ maxWidth: 960, margin: "0 auto", padding: `0 ${hPad} 120px`, listStyle: "none" }}
                >
                  {filtered.map((project, index) => (
                    <ProjectListItem key={project.id} project={project} index={index} onNavigate={handleNavigate} isMobile={isMobile} />
                  ))}
                  {filtered.length === 0 && (
                    <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ padding: "80px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.3 }}>
                      Nessun progetto trovato
                    </motion.li>
                  )}
                </motion.ul>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: `32px ${hPad} 120px`,
                    display: "grid",
                    /* ✅ FIX: minmax ridotto su mobile — 2 colonne su 390px */
                    gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "160px" : "280px"}, 1fr))`,
                    gap: isMobile ? 20 : 32,
                  }}
                >
                  {filtered.map((project, index) => (
                    <ProjectGridItem
                      key={project.id} project={project} index={index}
                      onNavigate={handleNavigate} isMobile={isMobile}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ gridColumn: "1/-1", padding: "80px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.3 }}>
                      Nessun progetto trovato
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AllProjects;
