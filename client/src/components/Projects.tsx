/**
 * Projects.tsx — Performance edition v2
 *
 * OTTIMIZZAZIONI v2:
 * • LazyVideo: IntersectionObserver con soglia 0.25 per precarico anticipato
 * • Formato video: <source> multipli → H.265/HEVC (.mp4 hevc), H.264 (.mp4), WebM fallback
 * • Poster image con loading="lazy" + decoding="async"
 * • ScrollTrigger.refresh() throttled con debounce 150ms + abortController su unmount
 * • scrub: true mantenuto (zero latency)
 * • ResizeObserver con cleanup corretto
 */

import { Link } from "wouter";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { PROJECTS } from "../lib/constants";

gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });

/* ─── Tipi per PROJECTS con supporto multi-formato video ────────────────── */
// Il progetto può avere:
//   video: string         → MP4 H.264 (fallback universale)
//   videoHevc?: string    → MP4 H.265/HEVC (Safari 14+, Edge 80+, meno bytes)
//   videoWebm?: string    → WebM VP9/AV1 (Chrome/Firefox)
//   poster?: string       → immagine anteprima (lazy loaded)
type ProjectWithSources = typeof PROJECTS[0] & {
  videoHevc?: string;
  videoWebm?: string;
  poster?: string;
};

/* ─── LazyVideo v2 ───────────────────────────────────────────────────────── */
/**
 * Strategia di caricamento:
 * 1. IntersectionObserver con threshold=0.25 → precarica appena il card
 *    è per il 25% visibile (invece di aspettare isActive)
 * 2. <source> multipli: HEVC prima (file ~40% più piccoli su Safari),
 *    poi H.264 MP4, poi WebM come ultimo fallback
 * 3. poster lazy per non bloccare LCP con frame video
 */
function LazyVideo({ src, isActive, poster, videoHevc, videoWebm }: {
  src: string;
  isActive: boolean;
  poster?: string;
  videoHevc?: string;
  videoWebm?: string;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  /* Precarica a 0.25 di visibilità — non aspetta isActive */
  useEffect(() => {
    if (shouldMount) return; // già montato
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldMount]);

  /* Play/pause in risposta ad isActive */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !shouldMount) return;
    if (isActive) {
      v.play().catch(() => {/* autoplay blocked, ok */});
    } else {
      v.pause();
    }
  }, [isActive, shouldMount]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {shouldMount && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
          className="h-full w-full object-cover"
          style={{ willChange: "transform" }}
        >
          {/* H.265/HEVC — Safari 14+, Edge Chromium 80+. File ~40% più piccoli */}
          {videoHevc && (
            <source src={videoHevc} type='video/mp4; codecs="hvc1"' />
          )}
          {/* WebM VP9/AV1 — Chrome, Firefox, Edge */}
          {videoWebm && (
            <source src={videoWebm} type="video/webm" />
          )}
          {/* H.264 MP4 — fallback universale */}
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

/* ─── SVG progress ring ──────────────────────────────────────────────────── */
function ProgressRing({ index, total, isActive }: {
  index: number; total: number; isActive: boolean;
}) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <svg
        width={48} height={48}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx={24} cy={24} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5}
        />
        <motion.circle
          cx={24} cy={24} r={r}
          fill="none"
          stroke="hsl(11 80% 57%)" strokeWidth={1.5}
          strokeDasharray={circ}
          animate={{ strokeDashoffset: isActive ? 0 : circ }}
          initial={{ strokeDashoffset: circ }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-button text-[9px] text-white/50 relative z-10">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ─── SplitTitle ─────────────────────────────────────────────────────────── */
function SplitTitle({ title, projectId }: { title: string; projectId: string }) {
  const words = title.split(" ");
  return (
    <AnimatePresence mode="wait">
      <motion.h2
        key={projectId}
        className="leading-[0.92] font-white uppercase tracking-tight"
        style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: "hsl(38 28% 57%)" }}
        aria-label={title}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              marginRight: "0.22em",
              verticalAlign: "top",
            }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ y: i % 2 === 0 ? "110%" : "-110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: i % 2 === 0 ? "-80%" : "80%", opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.h2>
    </AnimatePresence>
  );
}

/* ─── MagneticTitleWrapper ───────────────────────────────────────────────── */
function MagneticTitleWrapper({ children }: { children: React.ReactNode }) {
  const ref    = useRef<HTMLDivElement>(null);
  const x      = useMotionValue(0);
  const y      = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 16 });
  const springY = useSpring(y, { stiffness: 120, damping: 16 });

  const handleMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 180) {
      const strength = (1 - dist / 180) * 18;
      x.set(dx * strength / dist);
      y.set(dy * strength / dist);
    } else {
      x.set(0); y.set(0);
    }
  }, [x, y]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [handleMove]);

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} data-cursor="view">
      {children}
    </motion.div>
  );
}

/* ─── ProjectContent ─────────────────────────────────────────────────────── */
function ProjectContent({ project, index, total, isActive }: {
  project: ProjectWithSources;
  index: number;
  total: number;
  isActive: boolean;
}) {
  return (
    <div
      className="project-content relative z-10 flex flex-col items-center text-center px-6 select-none"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="mb-6 flex items-center gap-4">
        <ProgressRing index={index} total={total} isActive={isActive} />
        <span className="font-button text-[8px] uppercase tracking-[0.5em] text-white/20">
          of {String(total).padStart(2, "0")}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.span
          key={project.id + "-cat"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 font-button text-[0.65rem] uppercase tracking-[0.28em]"
          style={{ color: "hsl(11 80% 57%)" }}
        >
          {project.category} — {project.year}
        </motion.span>
      </AnimatePresence>

      <MagneticTitleWrapper>
        <SplitTitle title={project.title} projectId={project.id} />
      </MagneticTitleWrapper>

      <AnimatePresence mode="wait">
        <motion.p
          key={project.id + "-role"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mt-4 mb-10 text-white/40 font-role"
          style={{ fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)" }}
        >
          {project.role}
        </motion.p>
      </AnimatePresence>

      <Link
        to={`/project/${project.id}`}
        onClick={() => {
          sessionStorage.setItem("project_back", "/");
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        style={{ pointerEvents: "auto" }}
      >
        <motion.button
          className={cn(
            "group relative overflow-hidden rounded-full cursor-pointer",
            "border border-white/20 px-10 py-4 transition-all duration-500",
            "hover:border-[hsl(var(--accent-orange))]",
            "hover:shadow-[0_0_40px_hsl(11,80%,57%,0.3)]",
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-[hsl(var(--accent-orange))] transition-transform duration-500 group-hover:scale-x-100" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-black font-button text-[0.65rem] uppercase tracking-[0.22em] text-white">
            View Project
          </span>
        </motion.button>
      </Link>
    </div>
  );
}

/* ─── Projects ───────────────────────────────────────────────────────────── */
export const Projects = () => {
  const container   = useRef<HTMLDivElement>(null);
  const cardRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const featuredProjects = PROJECTS.slice(0, 3) as ProjectWithSources[];
  const PAUSE_VH      = 0.45;
  const PEEK_PERCENT  = 88;

  useGSAP(() => {
    const cards    = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const videos   = videoRefs.current.filter(Boolean) as HTMLDivElement[];
    const overlays = overlayRefs.current.filter(Boolean) as HTMLDivElement[];
    const total    = cards.length;
    if (!total) return;

    /* Setup iniziale */
    gsap.set(videos[0], { yPercent: 0, scale: 1, rotation: 0, force3D: true });
    gsap.set(overlays[0], { opacity: 0 });

    for (let i = 1; i < total; i++) {
      const peekOffset = PEEK_PERCENT + (i - 1) * 4;
      gsap.set(videos[i], {
        yPercent: peekOffset,
        scale: 0.92 - (i - 1) * 0.04,
        rotation: 0,
        force3D: true,
      });
      gsap.set(overlays[i], { opacity: 0 });
    }

    cards.forEach((card, i) => {
      const content = card.querySelector(".project-content");
      gsap.set(content, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40, force3D: true });
      card.style.pointerEvents = i === 0 ? "auto" : "none";
    });

    const totalScrollHeight = window.innerHeight * (PAUSE_VH + (total - 1));

    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: `+=${totalScrollHeight}`,
        pin: true,
        scrub: true,           // zero latency
        pinSpacing: true,
        onUpdate: (self) => {
          const pauseRatio     = (PAUSE_VH * window.innerHeight) / totalScrollHeight;
          const adjustedProgress = Math.max(0, (self.progress - pauseRatio) / (1 - pauseRatio));
          const idx = Math.round(adjustedProgress * (total - 1));
          if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx;
            cards.forEach((card, i) => {
              card.style.pointerEvents = i === idx ? "auto" : "none";
            });
            setActiveIndex(idx);
          }
        },
      },
    });

    scrollTimeline.to({}, { duration: PAUSE_VH });

    for (let i = 0; i < total - 1; i++) {
      const pos = PAUSE_VH + i;

      // EXIT — scale + rotate only (NO filter:blur)
      scrollTimeline.to(videos[i], {
        scale: 0.62, rotation: 3, yPercent: -6,
        duration: 1, ease: "none", force3D: true,
      }, pos);

      // Depth overlay — opacity only → compositor thread, zero GPU repaint
      scrollTimeline.to(overlays[i], {
        opacity: 0.75, duration: 1, ease: "none",
      }, pos);

      // ENTER
      const peekOffset = PEEK_PERCENT + i * 4;
      scrollTimeline.fromTo(videos[i + 1],
        { yPercent: peekOffset, scale: 0.92 - i * 0.04 },
        { yPercent: 0, scale: 1, rotation: 0, duration: 1, ease: "none", force3D: true },
        pos
      );

      // Cascade peeking cards restanti
      for (let j = i + 2; j < total; j++) {
        const newPeek = PEEK_PERCENT + (j - i - 1) * 4;
        scrollTimeline.to(videos[j], {
          yPercent: newPeek, scale: 0.92 - (j - i - 2) * 0.04,
          duration: 1, ease: "none", force3D: true,
        }, pos);
      }

      // Content fade
      const currentContent = cards[i].querySelector(".project-content");
      scrollTimeline.to(currentContent, {
        opacity: 0, y: -28, duration: 0.35, ease: "power2.in", force3D: true,
      }, pos);

      const nextContent = cards[i + 1].querySelector(".project-content");
      scrollTimeline.to(nextContent, {
        opacity: 1, y: 0, duration: 0.5, ease: "power2.out", force3D: true,
      }, pos + 0.5);
    }

    /* ── ResizeObserver con debounce 150ms + abort su unmount ─────────────
     * Problema originale: ScrollTrigger.refresh() chiamato ad ogni pixel
     * durante resize causava picchi di CPU. Soluzione: debounce 150ms.
     * AbortController garantisce cleanup senza memory leak.
     */
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const abortCtrl = new AbortController();

    const ro = new ResizeObserver(() => {
      if (abortCtrl.signal.aborted) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (!abortCtrl.signal.aborted) {
          ScrollTrigger.refresh();
        }
      }, 150);
    });

    if (container.current) ro.observe(container.current);

    return () => {
      abortCtrl.abort();
      ro.disconnect();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, { scope: container });

  return (
    <div ref={container} className="relative bg-black">
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}
      >
        {featuredProjects.map((project, index) => (
          <div
            key={project.id}
            ref={el => { cardRefs.current[index] = el; }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Video layer — transform only, no filter */}
            <div
              ref={el => { videoRefs.current[index] = el; }}
              className="absolute inset-x-6 inset-y-6 md:inset-x-12 md:inset-y-10 origin-top overflow-hidden rounded-2xl"
              style={{ willChange: "transform" }}
            >
              <LazyVideo
                src={project.video}
                isActive={activeIndex === index}
                poster={project.poster}
                videoHevc={project.videoHevc}
                videoWebm={project.videoWebm}
              />

              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

              {/* Depth overlay — opacity only, compositor thread */}
              <div
                ref={el => { overlayRefs.current[index] = el; }}
                className="absolute inset-0 bg-black"
                style={{ willChange: "opacity", opacity: 0 }}
              />

              {/* Poster lazy image per SEO e primo frame statico */}
              {project.poster && (
                <img
                  src={project.poster}
                  alt={`${project.title} preview`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover -z-10"
                  aria-hidden="true"
                />
              )}

              {/* Peek label */}
              {index > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-3"
                  style={{
                    height: "14%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  }}
                >
                  <span className="font-button text-[8px] uppercase tracking-[0.4em] text-white/35">
                    {project.title}
                  </span>
                </div>
              )}
            </div>

            {/* Vertical category label */}
            <div
              className="absolute z-20 hidden md:flex items-center"
              style={{
                left: "2.5rem",
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                transformOrigin: "center center",
              }}
            >
              <AnimatePresence mode="wait">
                {activeIndex === index && (
                  <motion.span
                    key={project.id + "-vcat"}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                    className="font-button text-[7px] uppercase tracking-[0.55em] whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >
                    {project.category}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom left — services */}
            <div className="absolute bottom-10 left-14 z-10 hidden md:flex items-center gap-3">
              <motion.div
                animate={{ scaleX: activeIndex === index ? 1 : 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: "left",
                  width: 24, height: 1,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              />
              <AnimatePresence mode="wait">
                {activeIndex === index && (
                  <motion.span
                    key={project.id + "-svc"}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="font-button text-[0.6rem] uppercase tracking-[0.3em] text-white/25"
                  >
                    {project.services.slice(0, 2).join(" · ")}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom right — year */}
            <div className="absolute bottom-10 right-14 z-10 hidden md:block">
              <span className="font-button text-[0.6rem] uppercase tracking-[0.3em] text-white/22">
                {project.year}
              </span>
            </div>

            <ProjectContent
              project={project}
              index={index}
              total={featuredProjects.length}
              isActive={activeIndex === index}
            />
          </div>
        ))}

        {/* Progress dots */}
        <div
          className="absolute bottom-8 left-1/2 z-30 flex gap-2"
          style={{ transform: "translateX(-50%)" }}
        >
          {featuredProjects.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: activeIndex === i ? 20 : 4,
                backgroundColor: activeIndex === i
                  ? "hsl(11 80% 57%)"
                  : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: 4, borderRadius: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
