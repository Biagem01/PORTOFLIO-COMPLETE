import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useVelocity } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { PROJECTS } from '../lib/constants';
import { MagneticWrapper } from "../components/Magnetic";
import { PinnedStoryReveal } from "../components/PinnedStoryReveal";
import { TwoWordFocus } from '../components/TrueFocus';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_MAIN = "text-[hsl(var(--scroll-indicator))]";
const LABEL_MUTED = "text-foreground/40";
const HERO_SCROLL = 1000;

type BadgeRef = HTMLSpanElement & { __setProgress?: (progress: number) => void; };

/* ─── Badge components ───────────────────────────────────────────────────── */
function RevealBadge({ rotateTexts, interval, triggerRef, triggerProgress, fontSize }: {
  rotateTexts: string[]; interval: number; triggerRef: React.RefObject<BadgeRef>;
  triggerProgress: number; fontSize: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const el = spanRef.current; if (!el) return;
    const badgeEl = el as BadgeRef;
    (triggerRef as React.MutableRefObject<BadgeRef | null>).current = badgeEl;
    badgeEl.__setProgress = (progress: number) => {
      if (progress >= triggerProgress && !triggered.current) { triggered.current = true; setRevealed(true); }
      if (progress < triggerProgress - 0.04 && triggered.current) {
        triggered.current = false; setRevealed(false); setIndex(0);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    };
  }, [triggerRef, triggerProgress]);
  useEffect(() => {
    if (!revealed) return;
    intervalRef.current = setInterval(() => setIndex(i => (i + 1) % rotateTexts.length), interval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [revealed, interval, rotateTexts.length]);
  return (
    <motion.span ref={spanRef}
      animate={revealed ? { backgroundSize: "100% 100%" } : { backgroundSize: "0% 100%" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{ backgroundImage: "linear-gradient(hsl(var(--accent-orange)), hsl(var(--accent-orange)))", backgroundRepeat: "no-repeat", backgroundPosition: "left center", backgroundSize: "0% 100%", display: "inline-block", verticalAlign: "middle", borderRadius: "0.5rem", margin: "0 2px", position: "relative" }}
    >
      <motion.span layout transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        className="font-orange uppercase tracking-tight rounded-lg inline-flex items-center overflow-hidden select-none"
        style={{ fontSize, padding: "2px 10px", background: "transparent", color: "transparent" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={`${revealed ? "r" : "h"}-${index}`}
            initial={{ y: -40, filter: "blur(10px)", opacity: 1 }} animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }} transition={{ duration: 0.5 }}
            className="inline-block whitespace-nowrap"
            style={{ color: revealed ? "#000" : "transparent", transition: "color 0.1s ease" }}
          >{rotateTexts[index]}</motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.span>
  );
}

function AutoBadge({ rotateTexts, interval, fontSize }: { rotateTexts: string[]; interval: number; fontSize: string; }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCurrentIndex(i => (i + 1) % rotateTexts.length), interval);
    return () => clearInterval(id);
  }, [interval, rotateTexts.length]);
  return (
    <span style={{ display: "inline-block", verticalAlign: "middle" }}>
      <motion.span layout transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        className="font-orange uppercase tracking-tight px-3 py-1 rounded-lg inline-flex items-center leading-none select-none overflow-hidden"
        style={{ fontSize, backgroundColor: "hsl(var(--accent-orange))", color: "#000" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)", opacity: 1 }} animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }} transition={{ duration: 0.5 }}
            className="inline-block whitespace-nowrap"
          >{rotateTexts[currentIndex]}</motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
}

function AnimatedBadge({ rotateTexts, interval = 2200, triggerRef, triggerProgress, fontSize, autoStart = false }: {
  rotateTexts: string[]; interval?: number; triggerRef?: React.RefObject<BadgeRef>;
  triggerProgress?: number; fontSize?: string; autoStart?: boolean;
}) {
  const fs = fontSize ?? "clamp(1.7rem, 3.8vw, 4.2rem)";
  if (autoStart) return <AutoBadge rotateTexts={rotateTexts} interval={interval} fontSize={fs} />;
  return <RevealBadge rotateTexts={rotateTexts} interval={interval} triggerRef={triggerRef!} triggerProgress={triggerProgress ?? 0} fontSize={fs} />;
}

const SectionLabel = ({ label }: { label: string }) => (
  <div className="reveal-up flex items-center gap-5 mb-20">
    <span className={`font-button text-xs uppercase tracking-[0.5em] ${LABEL_MUTED} whitespace-nowrap`}>{label}</span>
    <div className="divider-line flex-1 h-[1px] bg-white/10" />
  </div>
);

const StaticText = ({ children, as: Tag = 'p', className }: {
  children: string; as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; className?: string;
}) => <Tag className={className}>{children}</Tag>;

/* ─── ScrollingMarquee ───────────────────────────────────────────────────── */
const ScrollingMarquee = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => {
  const track = items.concat(items);
  return (
    <div className="overflow-hidden border-t border-b border-white/[0.06] py-5 select-none">
      <motion.div className="flex gap-0 whitespace-nowrap" animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ duration: 24, ease: "linear", repeat: Infinity }}>
        {track.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 pr-6">
            <span className="font-white uppercase text-sm tracking-[0.4em] text-white/15">{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
};

/* ─── ProjectHoverGallery — with cursor lens magnifier ───────────────────── */
const ProjectHoverGallery = ({ images }: { images: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [lensVisible, setLensVisible] = useState(false);

  // Lens position — updated via direct DOM for zero re-renders
  const rafId = useRef<number | null>(null);
  const lensX = useRef(0);
  const lensY = useRef(0);

  const ITEM_W = 11; const ITEM_H = 20; const ACTIVE_W = 44; const HOVER_SCALE = 10;
  const GAP = 0.8; const PERSPECTIVE = 55; const TRANSITION = 1.25;
  const LENS_SIZE = 140; // px

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!lensRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      lensX.current = e.clientX - rect.left;
      lensY.current = e.clientY - rect.top;
      lensRef.current.style.left = `${lensX.current}px`;
      lensRef.current.style.top  = `${lensY.current}px`;

      // Also update the background-position of the lens to show magnified area
      if (activeIndex !== null) {
        const itemEls = containerRef.current.children;
        const itemEl = itemEls[activeIndex] as HTMLElement;
        if (!itemEl) return;
        const itemRect = itemEl.getBoundingClientRect();
        const mx = (e.clientX - itemRect.left) / itemRect.width;
        const my = (e.clientY - itemRect.top) / itemRect.height;
        const ZOOM = 2.2;
        const bpx = mx * (100 * ZOOM - 100) * -1 + 50;
        const bpy = my * (100 * ZOOM - 100) * -1 + 50;
        lensRef.current.style.backgroundPosition = `${bpx}% ${bpy}%`;
        lensRef.current.style.backgroundSize = `${ZOOM * 100}%`;
        lensRef.current.style.backgroundImage = `url(${images[activeIndex]})`;
      }
    });
  }, [activeIndex, images]);

  const getItemStyle = (index: number): React.CSSProperties => {
    const isActive = activeIndex === index; const isFocused = focusedIndex === index;
    return {
      width: isActive ? `${ACTIVE_W}vw` : `calc(${ITEM_W}vw + 10px)`,
      height: `calc(${ITEM_H}vw + ${ITEM_H}vh)`,
      backgroundImage: `url(${images[index]})`,
      backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'none',
      filter: isActive || isFocused ? 'brightness(1)' : `grayscale(1) brightness(0.45)`,
      transform: isActive ? `translateZ(calc(${HOVER_SCALE}vw + ${HOVER_SCALE}vh))` : 'none',
      transition: `transform ${TRANSITION}s cubic-bezier(.1,.7,0,1), filter 2.5s cubic-bezier(.1,.7,0,1), width ${TRANSITION}s cubic-bezier(.1,.7,0,1)`,
      willChange: 'transform, filter, width', zIndex: isActive ? 100 : 'auto',
      margin: isActive ? '0 0.4vw' : '0',
      outline: isFocused ? '2px solid rgb(235,89,57)' : 'none', outlineOffset: '2px',
      borderRadius: '0.75rem',
      boxShadow: isActive ? '0 0 60px rgba(235,89,57,0.2)' : 'none',
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveIndex(activeIndex === index ? null : index); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); (containerRef.current?.children[index > 0 ? index - 1 : images.length - 1] as HTMLElement)?.focus(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); (containerRef.current?.children[index < images.length - 1 ? index + 1 : 0] as HTMLElement)?.focus(); }
  };

  return (
    <div
      className="flex items-center justify-center w-full overflow-hidden py-4 relative"
      style={{ minHeight: '520px', cursor: activeIndex !== null ? 'none' : 'default' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setLensVisible(true)}
      onMouseLeave={() => { setLensVisible(false); setActiveIndex(null); }}
    >
      {/* Cursor lens */}
      <div
        ref={lensRef}
        aria-hidden
        style={{
          position: 'absolute',
          width: LENS_SIZE, height: LENS_SIZE,
          borderRadius: '50%',
          border: '1.5px solid rgba(235,89,57,0.6)',
          pointerEvents: 'none',
          zIndex: 200,
          transform: 'translate(-50%, -50%)',
          opacity: lensVisible && activeIndex !== null ? 1 : 0,
          transition: 'opacity 0.25s ease',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.1)',
          backdropFilter: 'contrast(1.1)',
          overflow: 'hidden',
        }}
      />

      <div
        ref={containerRef}
        className="flex justify-center items-center w-full"
        style={{ perspective: `calc(${PERSPECTIVE}vw + ${PERSPECTIVE}vh)`, gap: `${GAP}rem` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="relative will-change-transform"
            style={getItemStyle(index)}
            tabIndex={0}
            role="button"
            aria-label={`Image ${index + 1} of ${images.length}`}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── FlipCard — with passive micro-movements (Perlin-ish float) ─────────── */
const springCfg = { type: "spring", stiffness: 500, damping: 60, mass: 1 } as const;

function usePerlinFloat(speed = 1.0, amplitude = 1.0) {
  // Simple pseudo-Perlin using multiple sine waves at different frequencies
  const t = useRef(Math.random() * 100); // random phase offset per card
  const [val, setVal] = useState({ x: 0, y: 0, rotate: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      t.current += 0.008 * speed;
      const x = (Math.sin(t.current * 1.3) * 0.7 + Math.sin(t.current * 2.1) * 0.3) * amplitude * 2.5;
      const y = (Math.sin(t.current * 0.9 + 1) * 0.6 + Math.sin(t.current * 1.7 + 2) * 0.4) * amplitude * 2.0;
      const rotate = (Math.sin(t.current * 0.7 + 3) * 0.5 + Math.sin(t.current * 1.1 + 1.5) * 0.5) * amplitude * 0.8;
      setVal({ x, y, rotate });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [speed, amplitude]);

  return val;
}

const FlipCard = ({ label, sub, topImage, bottomImage }: {
  label: string; sub: string; topImage: string; bottomImage: string
}) => {
  const [hovered, setHovered] = useState(false);
  const float = usePerlinFloat(0.85, hovered ? 0 : 1); // stops floating on hover

  // Magnetic tilt on hover
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(tiltX, { stiffness: 300, damping: 30 });
  const springTiltY = useSpring(tiltY, { stiffness: 300, damping: 30 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    tiltX.set(((e.clientY - cy) / rect.height) * -12);
    tiltY.set(((e.clientX - cx) / rect.width) * 12);
  }, [tiltX, tiltY]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  return (
    <motion.div
      ref={cardRef}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="relative cursor-pointer"
      style={{
        width: '100%', height: '100%', overflow: 'visible',
        x: hovered ? 0 : float.x,
        y: hovered ? 0 : float.y,
        rotate: hovered ? 0 : float.rotate,
        rotateX: springTiltX,
        rotateY: springTiltY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      transition={{ x: { duration: 0.8 }, y: { duration: 0.8 }, rotate: { duration: 0.8 } }}
    >
      <div className="absolute inset-0 p-7 flex flex-col justify-between z-[1]">
        <div className="flex justify-between items-start">
          <span className="font-white uppercase text-sm tracking-widest text-white/90">{label}</span>
          <div className="text-right">
            <span className="font-button text-[10px] uppercase tracking-[0.3em] text-white/30 block">Project</span>
            <span className="font-button text-[10px] uppercase tracking-[0.3em] text-white/30 block">{sub}</span>
          </div>
        </div>
        <motion.div animate={{ opacity: hovered ? 0 : 1 }} transition={{ duration: 0.3 }} className="flex items-center gap-2">
          <span className="font-button text-[9px] uppercase tracking-[0.4em] text-primary/60">Hover to reveal</span>
          <ArrowRight size={10} className="text-primary/50" />
        </motion.div>
      </div>
      <div className="absolute inset-0 z-[2]" style={{ transformStyle: 'preserve-3d', perspective: 700 }}>
        <motion.div animate={{ rotateX: hovered ? 0 : 90 }} transition={springCfg} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', transformOrigin: 'bottom center', transformStyle: 'preserve-3d', overflow: 'hidden' }}>
          <img src={topImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgb(235,89,57)', opacity: 0.6 }} />
        </motion.div>
        <motion.div animate={{ rotateX: hovered ? 0 : -90 }} transition={springCfg} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', transformOrigin: 'top center', transformStyle: 'preserve-3d', overflow: 'hidden' }}>
          <img src={bottomImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }} />
          <motion.div animate={{ opacity: hovered ? 0 : 0.88 }} transition={springCfg} style={{ position: 'absolute', inset: 0, backgroundColor: '#050505' }} />
        </motion.div>
      </div>
      <div className="absolute inset-0 rounded-2xl border border-white/[0.08] z-[3] pointer-events-none" />
    </motion.div>
  );
};

/* ─── ScrollControlledVideo — hero video with scroll-speed playback rate ─── */
function ScrollControlledVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const rafRef = useRef<number | null>(null);
  const targetRate = useRef(1.0);
  const currentRate = useRef(1.0);

  useEffect(() => {
    const unsubVelocity = scrollVelocity.on("change", (v) => {
      // Map scroll velocity to playback rate
      // Slow scroll (v~0): rate 0.3 (slow motion while reading)
      // Fast scroll (v~1000): rate 2.5 (fast forward during transition)
      const absV = Math.abs(v);
      if (absV < 20) {
        targetRate.current = 0.3; // near-pause while reading
      } else if (absV > 800) {
        targetRate.current = 2.5; // fast during rapid scroll
      } else {
        targetRate.current = 0.3 + (absV / 800) * 2.2;
      }
    });

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (!videoRef.current) return;
      // Smooth interpolation toward target rate
      currentRate.current += (targetRate.current - currentRate.current) * 0.08;
      try {
        videoRef.current.playbackRate = Math.max(0.1, Math.min(4, currentRate.current));
      } catch { /* browser may reject rate changes */ }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      unsubVelocity();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollVelocity]);

  return (
    <video
      ref={videoRef}
      autoPlay muted loop playsInline
      className={className}
      src={src}
    />
  );
}

/* ─── ProjectHeroTitle ───────────────────────────────────────────────────── */
function ProjectHeroTitle({ title, scrollStyle }: { title: string; scrollStyle: string }) {
  const words = title.split(' ');
  const h1Ref = useRef<HTMLHeadingElement>(null);
  if (words.length === 2) {
    return (
      <h1 ref={h1Ref} className={`relative font-white uppercase leading-[0.85] tracking-tight mb-16 ${scrollStyle}`} style={{ fontSize: 'clamp(3.5rem, 12vw, 11rem)' }} data-cursor="big">
        <TwoWordFocus word0={words[0]} word1={words[1]} fontSize="clamp(3.5rem, 12vw, 11rem)" animationDuration={0.9} focusPause={2800} borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)" blurAmount={5} frameAnchorRef={h1Ref} />
      </h1>
    );
  }
  return (
    <h1 className={`font-white uppercase leading-[0.85] tracking-tight mb-16 ${scrollStyle}`} style={{ fontSize: 'clamp(3.5rem, 12vw, 11rem)' }} data-cursor="big">
      {words.map((word, i) => (
        <span key={i} className="block overflow-hidden pb-1 -mb-1">
          <motion.span initial={{ y: "105%", skewX: -5 }} animate={{ y: 0, skewX: 0 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.7 + i * 0.1 }} className="block">{word}</motion.span>
        </span>
      ))}
    </h1>
  );
}

/* ─── BackButton ─────────────────────────────────────────────────────────── */
function BackButton() {
  const [hovered, setHovered] = useState(false);
  const [, navigate] = useLocation();
  function getBackDestination(): string {
    const stored = sessionStorage.getItem('project_back');
    if (stored) return stored;
    try {
      const ref = document.referrer;
      if (ref) { const url = new URL(ref); if (url.origin === window.location.origin && url.pathname === '/projects') return '/projects'; }
    } catch { /* invalid URL */ }
    return '/';
  }
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    const dest = getBackDestination();
    sessionStorage.removeItem('project_back');
    sessionStorage.setItem('skip_scroll_reset', '1');
    navigate(dest);
  };
  const backTo = (typeof window !== 'undefined' ? sessionStorage.getItem('project_back') : null) ?? '/';
  return (
    <a href={backTo} onClick={handleBack} data-cursor="hide"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', zIndex: 100, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '3rem', width: hovered ? '9rem' : '3rem', overflow: 'hidden', borderRadius: '9999px', backgroundColor: 'hsl(11,80%,57%)', transition: 'width 300ms cubic-bezier(0.16,1,0.3,1)', textDecoration: 'none' }}>
      <p className="font-button whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-black" style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0.75rem)' : 'translateX(0)', transition: 'opacity 200ms, transform 200ms' }}>Back</p>
      <div style={{ position: 'absolute', left: '0.875rem' }}>
        <svg viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem', fill: 'black', transform: 'scaleX(-1)' }}>
          <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" />
        </svg>
      </div>
    </a>
  );
}

/* ─── ProjectDetails ─────────────────────────────────────────────────────── */
export const ProjectDetails = () => {
  const [match, params] = useRoute<{ id: string }>('/project/:id');
  const [, setLocation] = useLocation();
  const id = params?.id ?? null;
  const projectIndex = PROJECTS.findIndex(p => p.id === id);
  const project = projectIndex !== -1 ? PROJECTS[projectIndex] : null;
  useEffect(() => { if (!match || !id || !project) setLocation('/projects'); }, [match, id, project, setLocation]);
  if (!project) return null;
  return (
    <AnimatePresence mode="wait">
      <ProjectDetailsInner key={id} id={id!} project={project} projectIndex={projectIndex} />
    </AnimatePresence>
  );
};

/* ─── ProjectDetailsInner ────────────────────────────────────────────────── */
const ProjectDetailsInner = ({ id, project, projectIndex }: {
  id: string; project: (typeof PROJECTS)[number]; projectIndex: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTransitionRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<BadgeRef>(null);
  const badge2Ref = useRef<BadgeRef>(null);
  const badge3Ref = useRef<BadgeRef>(null);
  const badge4Ref = useRef<BadgeRef>(null);

  const { scrollYProgress } = useScroll({ target: heroTransitionRef, offset: ["start start", "end end"] });
  const heroOpacity    = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);
  const videoOpacity   = useTransform(scrollYProgress, [0.05, 0.25], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0.4,  0.95], [0.75, 0.98]);
  const textY          = useTransform(scrollYProgress, [0, 1],        [0, -300]);
  const textScale      = useTransform(scrollYProgress, [0, 0.25],     [1, 1.7]);
  const textOpacity    = useTransform(scrollYProgress, [0.05, 0.25],  [1, 0]);
  const textBlur       = useTransform(scrollYProgress, [0.02, 0.25],  ["blur(0px)", "blur(25px)"]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const ctx = gsap.context(() => {
      containerRef.current?.querySelectorAll('.cinema-text').forEach((el) => {
        const words = el.querySelectorAll('.word'); if (!words.length) return;
        gsap.from(words, { scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" }, y: "110%", opacity: 0, duration: 1.1, stagger: 0.04, ease: "expo.out" });
      });

      const pinnedEl = containerRef.current?.querySelector('.pinned-statement');
      if (pinnedEl) {
        const chars = Array.from(pinnedEl.querySelectorAll('.char')) as HTMLElement[];
        chars.forEach((c) => { c.style.opacity = '0'; c.style.filter = 'blur(8px)'; c.style.color = 'rgba(255,255,255,0.0)'; c.style.transform = 'translateY(12px) skewX(4deg)'; c.style.display = 'inline'; c.style.transition = 'none'; });
        const aboutLabel = pinnedEl.querySelector('.about-label') as HTMLElement | null;
        if (aboutLabel) { aboutLabel.style.opacity = '0'; aboutLabel.style.transform = 'translateY(20px)'; }
        ScrollTrigger.create({
          trigger: pinnedEl, start: "top 90%", end: "bottom 10%", scrub: true,
          onUpdate: (self) => {
            if (aboutLabel) {
              const le = 1 - Math.pow(1 - Math.min(1, self.progress / 0.12), 3);
              aboutLabel.style.opacity = String(le); aboutLabel.style.transform = `translateY(${(1 - le) * 20}px)`;
            }
            const charStart = 0.05; const charRange = 0.82; const n = chars.length;
            chars.forEach((char, i) => {
              const wStart = charStart + (i / n) * charRange * 0.85; const wEnd = wStart + charRange * 0.18;
              const t = Math.max(0, Math.min(1, (self.progress - wStart) / (wEnd - wStart)));
              const e = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
              char.style.opacity = String(Math.min(1, e)); char.style.filter = `blur(${(1 - e) * 8}px)`;
              char.style.transform = `translateY(${(1 - e) * 12}px) skewX(${(1 - e) * 4}deg)`;
              char.style.color = e > 0.3 ? `hsl(38 28% ${(35 + ((e - 0.3) / 0.7) * 22).toFixed(1)}%)` : `rgba(255,255,255,${e * 0.5})`;
            });
            badge1Ref.current?.__setProgress?.(self.progress); badge2Ref.current?.__setProgress?.(self.progress);
            badge3Ref.current?.__setProgress?.(self.progress); badge4Ref.current?.__setProgress?.(self.progress);
          },
        });
      }

      containerRef.current?.querySelectorAll('.slide-from-left').forEach((el) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }, x: -140, opacity: 0, duration: 1.5, ease: "expo.out" }); });
      containerRef.current?.querySelectorAll('.slide-from-right').forEach((el) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }, x: 140, opacity: 0, duration: 1.5, ease: "expo.out" }); });
      containerRef.current?.querySelectorAll('.gallery-reveal').forEach((el, i) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }, clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", delay: i * 0.12 }); });
      containerRef.current?.querySelectorAll('.gallery-img').forEach((img) => { gsap.to(img, { scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }, yPercent: 12, ease: "none" }); });
      containerRef.current?.querySelectorAll('.divider-line').forEach((el) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 90%" }, scaleX: 0, transformOrigin: "left center", duration: 2, ease: "expo.inOut" }); });
      const techTags = containerRef.current?.querySelectorAll('.tech-tag'); const techContainer = containerRef.current?.querySelector('.tech-tags-container');
      if (techTags && techContainer) { gsap.from(techTags, { scrollTrigger: { trigger: techContainer, start: "top 85%" }, opacity: 0, y: 28, stagger: 0.08, duration: 0.9, ease: "power3.out", clearProps: "opacity,y" }); }
      containerRef.current?.querySelectorAll('.reveal-up').forEach((el) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 87%", toggleActions: "play none none reverse" }, opacity: 0, y: 55, duration: 1.3, ease: "expo.out" }); });
      const resultsRows = containerRef.current?.querySelectorAll('.result-row'); const resultsList = containerRef.current?.querySelector('.results-list');
      if (resultsRows?.length && resultsList) { gsap.from(resultsRows, { scrollTrigger: { trigger: resultsList, start: "top 80%", toggleActions: "play none none reverse" }, opacity: 0, x: -60, skewX: -3, stagger: 0.12, duration: 1.0, ease: "expo.out" }); }
      const flipSection = containerRef.current?.querySelector('.flipcard-section');
      if (flipSection) { gsap.from(flipSection, { scrollTrigger: { trigger: flipSection, start: "top 80%", toggleActions: "play none none reverse" }, opacity: 0, y: 60, duration: 1.4, ease: "expo.out" }); }
      containerRef.current?.querySelectorAll('.editorial-item').forEach((el, i) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }, opacity: 0, y: 40, duration: 1.1, ease: "expo.out", delay: i * 0.15 }); });
      containerRef.current?.querySelectorAll('.mockup-reveal').forEach((el, i) => { gsap.from(el, { scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" }, clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", delay: i * 0.1 }); });
      ScrollTrigger.refresh();
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const [nextHovered, setNextHovered] = useState(false);
  const nextProject = PROJECTS[(projectIndex + 1) % PROJECTS.length];

  const aboutWords = project.about.trim().split(/\s+/);
  const n = aboutWords.length;
  const findNaturalCut = (targetIdx: number, words: string[]): number => {
    const radius = Math.min(5, Math.floor(words.length * 0.08));
    for (let delta = 0; delta <= radius; delta++) {
      for (const dir of [0, 1, -1]) {
        const idx = targetIdx + dir * delta;
        if (idx > 0 && idx < words.length - 1) { const w = words[idx - 1]; if (/[,.]$/.test(w)) return idx; }
      }
    }
    return targetIdx;
  };
  const t1 = findNaturalCut(Math.floor(n * 0.18), aboutWords); const t2 = findNaturalCut(Math.floor(n * 0.38), aboutWords);
  const t3 = findNaturalCut(Math.floor(n * 0.60), aboutWords); const t4 = findNaturalCut(Math.floor(n * 0.80), aboutWords);
  const aboutP1 = aboutWords.slice(0, t1).join(' '); const aboutP2 = aboutWords.slice(t1, t2).join(' ');
  const aboutP3 = aboutWords.slice(t2, t3).join(' '); const aboutP4 = aboutWords.slice(t3, t4).join(' ');
  const aboutP5 = aboutWords.slice(t4).join(' ');
  const makeChars = (text: string, prefix: string) =>
    text.split('').map((char, i) => (
      <span key={`${prefix}-${i}`} className="char" style={{ display: 'inline' }}>{char === ' ' ? '\u00A0' : char}</span>
    ));

  const marqueeItems = [project.role, project.year, project.category, ...(project.services ?? []), ...(project.technologies?.slice(0, 3) ?? [])];
  const labelBadgeSize = "clamp(0.75rem, 1vw, 0.9rem)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={containerRef} className="bg-black selection:bg-primary selection:text-black">
      <motion.div initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ duration: 1.1, ease: [0.83, 0, 0.17, 1] }} className="fixed inset-0 z-[110] origin-top pointer-events-none" style={{ backgroundColor: "rgb(235, 89, 57)" }} />
      <BackButton />

      {/* ─── Hero ─── */}
      <div ref={heroTransitionRef} className="relative bg-black" style={{ height: `calc(${HERO_SCROLL}px + 100vh)` }}>
        <motion.section ref={heroRef} style={{ opacity: heroOpacity }} className="sticky top-0 z-10 h-screen w-full overflow-hidden flex items-end pb-20 lg:pb-32 px-6 lg:px-16">
          <motion.div style={{ opacity: videoOpacity }} className="absolute inset-0 z-0">
            <motion.div initial={{ scale: 1.3, borderRadius: "2rem" }} animate={{ scale: 1, borderRadius: "0rem" }} transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} className="w-full h-full overflow-hidden">
              <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="w-full h-full">
                {/* ✅ ScrollControlledVideo — playback rate tied to scroll velocity */}
                <ScrollControlledVideo src={project.video} className="w-full h-full object-cover brightness-[0.45]" />
              </motion.div>
            </motion.div>
            <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
          </motion.div>
          <motion.div style={{ y: textY, scale: textScale, opacity: textOpacity, filter: textBlur }} className="relative z-10 w-full max-w-[1400px] mx-auto will-change-transform">
            <div className="overflow-hidden mb-8">
              <motion.p initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.55 }} className="font-button text-xs uppercase tracking-[0.5em] text-primary">{project.category}</motion.p>
            </div>
            <ProjectHeroTitle title={project.title} scrollStyle={SCROLL_MAIN} />
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.3 }} className="flex items-end justify-between gap-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 border-t border-white/10 pt-8">
                {[{ label: "Role", value: project.role }, { label: "Year", value: project.year }, { label: "Services", value: project.services.join(' · '), wide: true }].map(({ label, value, wide }) => (
                  <div key={label} className={wide ? "col-span-2" : ""}>
                    <span className="font-button text-[10px] uppercase tracking-widest text-white/20 block mb-2">{label}</span>
                    <span className={`text-sm font-light ${SCROLL_MAIN}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="hidden md:flex flex-col items-center gap-3">
                <div className="w-[1px] h-20 bg-white/10 overflow-hidden">
                  <motion.div className="w-full h-1/2 bg-primary" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
                </div>
                <span className="font-button text-[8px] tracking-[0.4em] text-white/20 rotate-90 origin-center translate-y-6">scroll</span>
              </div>
            </motion.div>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20" style={{ background: "linear-gradient(to bottom, transparent, #000000)" }} />
        </motion.section>
      </div>

      {/* ─── About animato (char reveal) ─── */}
      <div style={{ marginTop: "-110vh" }}>
        <motion.section initial={{ scale: 0.92, rotate: 4, opacity: 0 }} whileInView={{ scale: 1, rotate: 0, opacity: 1 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="pinned-statement relative min-h-screen flex items-center justify-center px-8 lg:px-24 bg-[#050505] origin-top overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(235,89,57,0.04) 0%, transparent 70%)' }} />
          <div className="max-w-[1100px] w-full relative z-10 py-32">
            <div className="overflow-hidden mb-14">
              <div className="about-label flex items-center gap-6">
                <span className="font-button text-[9px] uppercase tracking-[0.6em] text-primary/40">— About</span>
                <div className="h-[1px] w-16 bg-primary/20" />
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-white/15">The Project</span>
              </div>
            </div>
            <p className="font-white uppercase leading-[1.35] tracking-tight" style={{ fontSize: 'clamp(1.7rem, 3.8vw, 4.2rem)' }} data-cursor="big">
              {makeChars(aboutP1, 'p1')}{'\u00A0'}
              <AnimatedBadge rotateTexts={["CRAFTED", "DESIGNED", "BUILT", "SHIPPED"]} interval={2400} triggerRef={badge1Ref} triggerProgress={0.20} />{'\u00A0'}
              {makeChars(aboutP2, 'p2')}{'\u00A0'}
              <AnimatedBadge rotateTexts={["SMOOTH", "CLEAN", "MINIMAL", "REFINED"]} interval={2000} triggerRef={badge2Ref} triggerProgress={0.38} />{'\u00A0'}
              {makeChars(aboutP3, 'p3')}{'\u00A0'}
              <AnimatedBadge rotateTexts={["PRECISE", "BOLD", "SHARP", "FOCUSED"]} interval={2200} triggerRef={badge3Ref} triggerProgress={0.56} />{'\u00A0'}
              {makeChars(aboutP4, 'p4')}{'\u00A0'}
              <AnimatedBadge rotateTexts={["PASSION", "CRAFT", "VISION", "IMPACT"]} interval={1900} triggerRef={badge4Ref} triggerProgress={0.72} />{'\u00A0'}
              {makeChars(aboutP5, 'p5')}
            </p>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2">
              <div className="w-[1px] h-14 bg-white/[0.06]" />
              <span className="font-button text-[8px] tracking-[0.4em] text-white/10" style={{ writingMode: 'vertical-rl' }}>scroll to read</span>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 font-white uppercase leading-none select-none pointer-events-none" style={{ fontSize: '22vw', color: 'rgba(235,89,57,0.035)' }}>
            {String(projectIndex + 1).padStart(2, '0')}
          </div>
        </motion.section>
      </div>

      <ScrollingMarquee items={marqueeItems} />
      <PinnedStoryReveal project={project} projectIndex={projectIndex} />
      <ScrollingMarquee items={project.technologies ?? []} reverse />

      {/* ─── The Project ─── */}
      <section className="py-40 px-6 lg:px-16 bg-black border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24">
            <div className="lg:col-span-4">
              <SectionLabel label="The Project" />
              <div className="editorial-item">
                <span className="font-button text-[9px] uppercase tracking-[0.55em] text-white/20 block mb-6">Overview</span>
                <StaticText className="font-button text-sm leading-relaxed text-white/40 max-w-sm">{project.about}</StaticText>
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col justify-end gap-8 pb-1">
              <div className="editorial-item grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-white/[0.07] pt-10">
                <div><span className="font-button text-[8px] uppercase tracking-[0.5em] text-white/15 block mb-3">Year</span><span className={`font-white uppercase text-4xl ${SCROLL_MAIN}`}>{project.year}</span></div>
                <div><span className="font-button text-[8px] uppercase tracking-[0.5em] text-white/15 block mb-3">Role</span><span className="font-button text-sm text-white/50 leading-relaxed">{project.role}</span></div>
                <div><span className="font-button text-[8px] uppercase tracking-[0.5em] text-white/15 block mb-3">Category</span><span className="font-button text-sm text-white/50 leading-relaxed">{project.category}</span></div>
              </div>
            </div>
          </div>
          <div className="space-y-0">
            {[{ n: '( 1 )', label: 'Objective', text: project.challenge }, { n: '( 2 )', label: 'Approach', text: project.solution }].map(({ n, label, text }, i) => (
              <div key={i} className="editorial-item group grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 py-12 border-t border-white/[0.07] hover:border-primary/30 transition-colors duration-500">
                <div className="lg:col-span-2 flex items-start gap-4"><span className="font-button text-xs text-primary/50 shrink-0 mt-1">{n}</span><span className="font-button text-[9px] uppercase tracking-[0.45em] text-white/20 mt-[3px]">{label}</span></div>
                <div className="lg:col-span-7 lg:col-start-4"><StaticText className="font-button text-sm leading-relaxed text-white/40 group-hover:text-white/55 transition-colors duration-500">{text}</StaticText></div>
                <div className="lg:col-span-2 hidden lg:flex justify-end items-start pt-1"><div className="w-7 h-7 rounded-full border border-white/[0.08] flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300"><ArrowRight size={10} className="text-white/20 group-hover:text-primary/70" /></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Technologies ─── */}
      <section className="py-32 px-6 lg:px-16 bg-black border-t border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto">
          <div className="reveal-up flex flex-wrap items-center gap-x-5 gap-y-4 mb-20">
            <span className={`font-button text-xs uppercase tracking-[0.5em] ${LABEL_MUTED} whitespace-nowrap`}>Built with</span>
            <AnimatedBadge rotateTexts={["MODERN TECH", "BEST TOOLS", "SOLID STACK", "CLEAN CODE"]} interval={3000} fontSize={labelBadgeSize} autoStart />
            <div className="divider-line flex-1 h-[1px] bg-white/10" />
          </div>
          <div className="tech-tags-container flex flex-wrap gap-4" data-cursor="hide">
            {project.technologies.map((tech, i) => (
              <MagneticWrapper key={i}>
                <div className="tech-tag font-white uppercase px-8 py-4 border border-white/10 rounded-xl text-base tracking-wider transition-all duration-300 cursor-pointer" style={{ color: 'hsl(38 33% 57%)' }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = "rgb(235, 89, 57)"; el.style.borderColor = "rgb(235, 89, 57)"; el.style.color = "#000"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = "transparent"; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "hsl(38 33% 57%)"; }}
                >{tech}</div>
              </MagneticWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery ─── */}
      <section className="py-20 bg-black border-t border-white/[0.05]" data-cursor="hide">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16"><SectionLabel label="Gallery" /></div>
        {/* ✅ Gallery with cursor lens magnifier */}
        <ProjectHoverGallery images={project.extraMedia} />
      </section>

      <ScrollingMarquee items={project.services} />

      {/* ─── Visual Archive ─── */}
      <section className="py-32 px-6 lg:px-16 bg-black border-t border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4 mb-20">
            <span className={`font-button text-xs uppercase tracking-[0.5em] ${LABEL_MUTED} whitespace-nowrap`}>Visual Archive</span>
            <AnimatedBadge rotateTexts={["HOVER ME", "FLIP IT", "EXPLORE", "DISCOVER"]} interval={2800} fontSize={labelBadgeSize} autoStart />
            <div className="divider-line flex-1 h-[1px] bg-white/10" />
          </div>
          {/* ✅ FlipCards with Perlin float micro-movements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col gap-4" data-cursor="hide">
              <div style={{ height: 420 }}><FlipCard label={project.title} sub={project.year} topImage={project.extraMedia[0]} bottomImage={project.extraMedia[1]} /></div>
              <p className="font-button text-[10px] uppercase tracking-[0.4em] text-white/20 text-center">Before / After</p>
            </div>
            <div className="flex flex-col gap-4 sm:mt-16" data-cursor="hide">
              <div style={{ height: 420 }}><FlipCard label={project.role} sub={project.category} topImage={project.extraMedia[1]} bottomImage={project.extraMedia[2]} /></div>
              <p className="font-button text-[10px] uppercase tracking-[0.4em] text-white/20 text-center">Process</p>
            </div>
            <div className="hidden lg:flex flex-col justify-center gap-8 pl-8 border-l border-white/[0.08] h-[420px]" data-cursor="big">
              <span className="font-button text-[9px] uppercase tracking-[0.5em] text-primary/50">— Visual story</span>
              <p className={`font-white uppercase leading-tight tracking-tight ${SCROLL_MAIN}`} style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.8rem)' }}>{project.title}</p>
              <p className="font-button text-xs text-white/30 leading-relaxed">Hover the cards to reveal the visual story behind the project.</p>
              <div className="flex items-center gap-3">
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-primary/40">{project.year}</span>
                <span className="w-6 h-[1px] bg-white/15" />
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-primary/40">{project.role}</span>
              </div>
            </div>
          </div>
          <div className="reveal-up mt-16 pt-10 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-8" data-cursor="hide">
            {[{ label: 'Typography', value: 'Riking · T1Korium' }, { label: 'Year', value: project.year }, { label: 'Role', value: project.role }, { label: 'Services', value: project.services.slice(0, 2).join(' · ') }].map(({ label, value }) => (
              <div key={label}><span className="font-button text-[8px] uppercase tracking-[0.5em] text-white/15 block mb-2">{label}</span><span className="font-button text-xs text-white/35">{value}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Next Project — with background video teaser ──────────────────── */}
      <section className="relative overflow-hidden bg-black" data-cursor="hide">
        {/* ✅ Next project video playing silently in background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video
            key={nextProject.id}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            style={{ opacity: nextHovered ? 0.12 : 0.04, transition: 'opacity 1.2s cubic-bezier(0.16,1,0.3,1)' }}
            src={nextProject.video}
          />
          {/* Gradient to keep text readable */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.85) 100%)' }} />
        </div>

        <div className="w-full h-[2px] bg-primary relative z-10" />
        <div className="relative z-10 px-6 lg:px-16 pt-20 pb-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4 mb-24">
              <span className="font-button text-xs uppercase tracking-[0.5em] text-white/20 whitespace-nowrap">Up next</span>
              <AnimatedBadge rotateTexts={["NEXT PROJECT", "NEXT CASE", "KEEP GOING", "EXPLORE MORE"]} interval={3500} fontSize={labelBadgeSize} autoStart />
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>
            <Link to={`/project/${nextProject.id}`} className="group block"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              onMouseEnter={() => setNextHovered(true)} onMouseLeave={() => setNextHovered(false)}>
              <p className="font-button text-xs uppercase tracking-[0.5em] text-white/20 mb-6">{nextProject.category}</p>
              <div className="flex items-end justify-between gap-8">
                <div className="overflow-hidden flex-1">
                  <motion.h3 className={`font-white uppercase leading-[0.82] tracking-tight ${SCROLL_MAIN} group-hover:text-primary transition-colors duration-700 block`}
                    style={{ fontSize: 'clamp(3.5rem, 9vw, 11rem)' }} data-cursor="big"
                    whileHover={{ x: 12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                    {nextProject.title}
                  </motion.h3>
                </div>
                <div className="hidden md:flex flex-col items-end gap-3 pb-3 shrink-0">
                  <div className="relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[hsl(11,80%,57%)] transition-all duration-300" style={{ width: nextHovered ? '11rem' : '3rem' }}>
                    <p className="font-button inline-flex whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-black transition-all duration-200" style={{ opacity: nextHovered ? 1 : 0, transform: nextHovered ? 'translateX(-0.75rem)' : 'translateX(0)' }}>Next Project</p>
                    <div className="absolute right-3.5">
                      <svg viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-black">
                        <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" />
                      </svg>
                    </div>
                  </div>
                  <span className="font-button text-[10px] uppercase tracking-[0.35em] text-white/20">View case study</span>
                </div>
              </div>
              <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-12">
                {[{ label: "Category", val: nextProject.category }, { label: "Year", val: nextProject.year }, { label: "Role", val: nextProject.role }].map(({ label, val }) => (
                  <div key={label}><span className="font-button text-[10px] uppercase tracking-widest text-white/15 block mb-1">{label}</span><span className={`text-sm font-light ${SCROLL_MAIN}`}>{val}</span></div>
                ))}
              </div>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 font-white uppercase leading-none select-none pointer-events-none opacity-[0.04] translate-y-6 translate-x-4" style={{ fontSize: '28vw', color: 'rgb(235,89,57)' }}>{String(((projectIndex + 1) % PROJECTS.length) + 1).padStart(2, '0')}</div>
        <div className="w-full h-[2px] bg-primary relative z-10" />
      </section>
    </motion.div>
  );
};

export default ProjectDetails;
