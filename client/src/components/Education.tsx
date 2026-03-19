/**
 * Education.tsx — World-class edition
 *
 * • SVG timeline: vertical line draws itself as you scroll, nodes pulse when active
 * • Typing effect: description types in character-by-character on slide enter
 * • Skill bars: staggered fill animation per education item
 * • Architectural year: massive blend-mode overlay, counts up from year-3
 * • Mobile: same animations, scaled — nothing removed
 */

import {
  motion, useScroll, useTransform, useMotionTemplate,
  useSpring, MotionValue, AnimatePresence, animate,
} from "framer-motion";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { TwoWordFocus } from "./TrueFocus";

/* ─── types ──────────────────────────────────────────────────────────────── */
interface EducationItem {
  institution: string; year: string; title: string;
  description: string; details: string[]; location: string;
  skills: { label: string; pct: number }[];
}
interface SlideProps {
  item: EducationItem; index: number; total: number; progress: MotionValue<number>;
}

/* ─── useIsMobile ────────────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

/* ─── ArchitecturalYear ──────────────────────────────────────────────────── */
function ArchitecturalYear({ items, progress }: { items: EducationItem[]; progress: MotionValue<number> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayYear, setDisplayYear] = useState(items[0].year);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return progress.on("change", v => {
      const idx = Math.min(Math.floor(v * items.length), items.length - 1);
      setActiveIdx(idx);
    });
  }, [progress, items]);

  useEffect(() => {
    const target = parseInt(items[activeIdx].year, 10);
    const start = target - 3;
    let frame = 0;
    const total = 45;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      frame++;
      const p = frame / total;
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayYear(String(Math.round(start + (target - start) * eased)));
      if (frame < total) rafRef.current = requestAnimationFrame(tick);
      else setDisplayYear(items[activeIdx].year);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeIdx, items]);

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={activeIdx}
          initial={{ y: 60, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 1.06 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="font-black tracking-tighter leading-none tabular-nums font-mono"
          style={{
            fontSize: "clamp(8rem, 28vw, 26rem)",
            color: "rgba(255,255,255,0.028)",
            mixBlendMode: "overlay",
          }}
        >
          {displayYear}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ─── SVGTimeline ────────────────────────────────────────────────────────── */
function SVGTimeline({ items, progress }: { items: EducationItem[]; progress: MotionValue<number> }) {
  const [drawn, setDrawn] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const HEIGHT = 280;
  const NODE_Y = items.map((_, i) => (i / (items.length - 1)) * HEIGHT);

  useEffect(() => {
    return progress.on("change", v => {
      setDrawn(v);
      setActiveIdx(Math.min(Math.floor(v * items.length), items.length - 1));
    });
  }, [progress, items]);

  const strokeDash = HEIGHT;
  const strokeOffset = strokeDash * (1 - drawn);

  return (
    <div className="hidden md:flex flex-col items-center" style={{ width: 40 }}>
      <svg width={40} height={HEIGHT + 32} style={{ overflow: "visible" }}>
        <line x1={20} y1={0} x2={20} y2={HEIGHT} stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} />
        <line
          x1={20} y1={0} x2={20} y2={HEIGHT}
          stroke="hsl(11 80% 57%)"
          strokeWidth={1.5}
          strokeDasharray={strokeDash}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
        {items.map((item, i) => {
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;
          return (
            <g key={i}>
              {isActive && (
                <motion.circle
                  cx={20} cy={NODE_Y[i]}
                  initial={{ r: 6, opacity: 0.4 }}
                  animate={{ r: 14, opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  fill="hsl(11 80% 57%)"
                />
              )}
              <motion.circle
                cx={20} cy={NODE_Y[i]} r={isActive ? 5 : 3}
                fill={isActive ? "hsl(11 80% 57%)" : isPast ? "rgba(235,89,57,0.5)" : "rgba(255,255,255,0.15)"}
                animate={{ r: isActive ? 5 : 3 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.text
                x={32} y={NODE_Y[i] + 4}
                fill={isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)"}
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.08em"
                animate={{ opacity: isActive ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              >
                {item.year}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── TypingText ─────────────────────────────────────────────────────────── */
function TypingText({ text, isActive }: { text: string; isActive: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isActive) { setDisplayed(""); return; }

    let i = 0;
    setDisplayed("");
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length && timerRef.current) clearInterval(timerRef.current);
    }, 18);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, text]);

  return (
    <span className="text-white/50 text-sm leading-relaxed font-button">
      "{displayed}
      {isActive && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-[hsl(11,80%,57%)] align-middle ml-[1px]"
        />
      )}
      {displayed.length >= text.length ? '"' : ""}
    </span>
  );
}

/* ─── SkillBars ──────────────────────────────────────────────────────────── */
function SkillBars({ skills, isActive }: {
  skills: { label: string; pct: number }[];
  isActive: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {skills.map((skill, i) => (
        <div key={skill.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-button text-[8px] uppercase tracking-[0.35em] text-white/30">
              {skill.label}
            </span>
            <motion.span
              className="font-button text-[8px] text-white/20 tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              {skill.pct}%
            </motion.span>
          </div>
          <div className="relative h-[2px] w-full rounded-full overflow-hidden bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(11 80% 57%), hsl(38 33% 57%))",
              }}
              initial={{ width: "0%" }}
              animate={{ width: isActive ? `${skill.pct}%` : "0%" }}
              transition={{
                duration: 0.9,
                delay: 0.25 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── AlternatingTitle ───────────────────────────────────────────────────── */
const AlternatingTitle = ({ text }: { text: string }) => {
  const words = text.split(" ");
  const fontClasses = [
    "font-orange text-[hsl(var(--accent-orange))]",
    "font-white text-[hsl(var(--scroll-indicator))] text-[0.85em]",
  ];
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className={fontClasses[i % 2]}>
          {word}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
};

/* ─── StaggeredDetail ────────────────────────────────────────────────────── */
const StaggeredDetail = ({ detail, index, isVisible }: {
  detail: string; index: number; isVisible: boolean;
}) => (
  <motion.li
    initial={{ opacity: 0, y: 10 }}
    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
    transition={{ duration: 0.5, delay: 0.4 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    className="text-white/40 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium list-none flex items-center gap-3"
  >
    <span className="w-1 h-1 rounded-full bg-[hsl(var(--accent-orange))] flex-shrink-0" />
    {detail}
  </motion.li>
);

/* ─── PipIndicator ───────────────────────────────────────────────────────── */
const PipIndicator = ({ items, activeIndex }: { items: EducationItem[]; activeIndex: number }) => (
  <div className="flex flex-row md:flex-col gap-4 items-center">
    {items.map((_, i) => (
      <div key={i} className="relative flex items-center justify-center">
        <motion.div
          animate={{
            scale: i === activeIndex ? 1.5 : 1,
            opacity: i === activeIndex ? 1 : 0.3,
            backgroundColor: i === activeIndex ? "hsl(var(--accent-orange))" : "rgba(255,255,255,0.4)",
          }}
          className="w-1.5 h-1.5 rounded-full"
        />
        {i === activeIndex && (
          <motion.div
            layoutId="pip-glow"
            className="absolute inset-0 w-4 h-4 rounded-full bg-[hsl(var(--accent-orange))]/20 blur-sm -z-10"
          />
        )}
      </div>
    ))}
  </div>
);

/* ─── LeftPanel ──────────────────────────────────────────────────────────── */
const LeftPanel = ({ items, progress, titleY, titleOpacity, h2Ref }: {
  items: EducationItem[]; progress: MotionValue<number>;
  titleY: MotionValue<number>; titleOpacity: MotionValue<number>;
  h2Ref: React.RefObject<HTMLHeadingElement>;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    return progress.on("change", v =>
      setActiveIndex(Math.min(Math.floor(v * items.length), items.length - 1))
    );
  }, [progress, items]);

  return (
    <div className="hidden md:flex col-span-4 items-center">
      <motion.div style={{ y: titleY, opacity: titleOpacity }} className="w-full flex flex-col gap-6 pl-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-px bg-white/20" />
          <div className="text-[10px] font-mono tracking-[0.4em] text-white/30 uppercase">
            Selected Education
          </div>
        </div>

        <h2
          ref={h2Ref}
          className="relative text-6xl leading-[1] tracking-tight flex flex-col items-start gap-0"
          data-cursor="big"
        >
          <span className="text-white/40 italic font-serif px-[14px]">the</span>
          <TwoWordFocus
            word0="LEARNING" word1="PATH"
            fontSize="clamp(2.5rem, 5vw, 3.75rem)"
            animationDuration={0.9} focusPause={3000}
            borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
            blurAmount={4} frameAnchorRef={h2Ref}
          />
        </h2>

        <div className="flex items-start gap-6 mt-2">
          <SVGTimeline items={items} progress={progress} />
          <div className="flex flex-col gap-4 max-w-[180px] pt-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 16, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="text-[9px] font-mono text-white/25 tracking-[0.2em] uppercase">
                  Current Node
                </div>
                <p className="text-xs text-white/55 leading-relaxed font-button">
                  {items[activeIndex].location}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <PipIndicator items={items} activeIndex={activeIndex} />
      </motion.div>
    </div>
  );
};

/* ─── MobileHeader ───────────────────────────────────────────────────────── */
const MobileHeader = ({ items, progress }: { items: EducationItem[]; progress: MotionValue<number> }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    return progress.on("change", v =>
      setActiveIndex(Math.min(Math.floor(v * items.length), items.length - 1))
    );
  }, [progress, items]);

  return (
    <div className="flex md:hidden flex-col gap-4 px-6 pt-10 pb-6 bg-black border-b border-white/[0.03] sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-mono tracking-[0.4em] text-white/30 uppercase">
            02 / Education
          </div>
          <h2 className="flex flex-col items-start">
            <span className="text-white/40 italic font-serif px-[10px] text-sm">the</span>
            <span
              className="font-white uppercase tracking-tight text-[hsl(38,28%,57%)] px-[10px]"
              style={{ fontSize: "1.6rem" }}
            >
              LEARNING{" "}
              <span className="font-orange text-[hsl(var(--accent-orange))]">PATH</span>
            </span>
          </h2>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PipIndicator items={items} activeIndex={activeIndex} />
          <div className="flex gap-2 mt-1">
            {items.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === activeIndex ? 16 : 4, backgroundColor: i === activeIndex ? "hsl(11 80% 57%)" : "rgba(255,255,255,0.2)" }}
                transition={{ duration: 0.35 }}
                style={{ height: 2, borderRadius: 1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── EducationSlide ─────────────────────────────────────────────────────── */
const EducationSlide = ({ item, index, total, progress }: SlideProps) => {
  const start = index / total;
  const end = (index + 1) / total;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    return progress.on("change", v => setIsVisible(v >= start && v < end));
  }, [progress, start, end]);

  const opacity    = useTransform(progress, [start - 0.1, start, end - 0.1, end], [0, 1, 1, 0]);
  const scale      = useTransform(progress, [start - 0.1, start, end - 0.1, end], [0.9, 1, 1, 0.9]);
  const rotateX    = useTransform(progress, [start - 0.1, start, end - 0.1, end], [20, 0, 0, -20]);
  const y          = useTransform(progress, [start, end], [60, -60]);
  const blur       = useTransform(progress, [start - 0.1, start, end - 0.1, end], [20, 0, 0, 20]);
  const blurStyle  = useMotionTemplate`blur(${blur}px)`;
  const contentY   = useTransform(progress, [start, start + 0.15], [40, 0]);
  const lineW      = useTransform(progress, [start + 0.05, start + 0.2], ["0%", "100%"]);
  const parallax   = useTransform(progress, [start, end], [20, -20]);

  return (
    <motion.div
      style={{ opacity, scale, rotateX, y, filter: blurStyle, perspective: 1200 }}
      className={`absolute inset-0 flex items-center justify-center will-change-transform ${isVisible ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div className="w-full max-w-3xl px-6 md:px-12">
        <motion.div style={{ y: parallax }} className="flex flex-col gap-8">

          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={isVisible ? { opacity: 0.3, x: 0 } : { opacity: 0, x: -10 }}
                className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40"
              >
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </motion.span>
              <AnimatedYearInline year={item.year} isVisible={isVisible} />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-end gap-1 mb-2"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
                Location
              </span>
              <span className="text-xs font-mono text-[hsl(var(--accent-orange))]">
                {item.location}
              </span>
            </motion.div>
          </div>

          <motion.div style={{ y: contentY }} className="space-y-6">
            <div className="space-y-3">
              <motion.h3
                className="text-4xl md:text-6xl tracking-tight leading-[0.95]"
                data-cursor="big"
              >
                <AlternatingTitle text={item.institution} />
              </motion.h3>
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-white/10 relative overflow-hidden">
                  <motion.div
                    style={{ width: lineW }}
                    className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent-orange))] to-white/20"
                  />
                </div>
                <span className="text-sm md:text-lg font-serif italic text-white/80">
                  {item.title}
                </span>
              </div>
            </div>

            <div className="max-w-xl">
              <TypingText text={item.description} isActive={isVisible} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <ul className="flex flex-col gap-3" data-cursor="hide">
                {item.details.map((d, i) => (
                  <StaggeredDetail key={d} detail={d} index={i} isVisible={isVisible} />
                ))}
              </ul>
              <SkillBars skills={item.skills} isActive={isVisible} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ─── AnimatedYearInline ─────────────────────────────────────────────────── */
function AnimatedYearInline({ year, isVisible }: { year: string; isVisible: boolean }) {
  const [displayed, setDisplayed] = useState("0000");
  const rafRef = useRef<number | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isVisible) {
      hasRun.current = false;
      setDisplayed("0000");
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;
    const target = parseInt(year, 10);
    const start = target - 5;
    let frame = 0;
    const totalF = 50;
    const tick = () => {
      frame++;
      const p = frame / totalF;
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplayed(String(Math.round(start + (target - start) * eased)));
      if (frame < totalF) rafRef.current = requestAnimationFrame(tick);
      else setDisplayed(year);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isVisible, year]);

  return (
    <div className="overflow-hidden h-[3rem] flex items-center">
      <span className="text-2xl md:text-3xl font-mono font-medium text-white/40 tracking-tighter tabular-nums">
        {displayed}
      </span>
    </div>
  );
}

/* ─── Education ──────────────────────────────────────────────────────────── */
export const Education = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const isMobile = useIsMobile();

  const educationItems: EducationItem[] = useMemo(() => [
    {
      institution: "University of Pisa",
      year: "2021",
      title: "Bachelor's Degree in Computer Science",
      location: "Pisa, Italy",
      description: "Currently pursuing a degree in Computer Science, studying algorithms, data structures, operating systems and software engineering fundamentals.",
      details: [
        "Algorithms & Data Structures",
        "Operating Systems",
        "Software Engineering",
        "Mathematics & Logic",
      ],
      skills: [
        { label: "Problem Solving", pct: 82 },
        { label: "Algorithms", pct: 75 },
        { label: "System Design", pct: 68 },
      ],
    },
    {
      institution: "Start2Impact",
      year: "2025",
      title: "Full Stack Development — Master",
      location: "Remote, Italy",
      description: "Hands-on full stack master program focused on building real-world projects with React, Node.js, PHP and MySQL. Completed September 2025.",
      details: [
        "React & TypeScript",
        "Node.js & Express",
        "PHP & MySQL",
        "Git & Unit Testing",
      ],
      skills: [
        { label: "Frontend", pct: 92 },
        { label: "Backend", pct: 85 },
        { label: "Database", pct: 80 },
      ],
    },
    {
      institution: "Liceo Scientifico",
      year: "2018",
      title: "Scientific High School Diploma",
      location: "Comiso, Sicily",
      description: "Five-year scientific curriculum covering mathematics, physics, natural sciences and philosophy. Graduated with a score of 68/100.",
      details: [
        "Mathematics & Physics",
        "Natural Sciences",
        "Philosophy & History",
        "Graduated 68/100",
      ],
      skills: [
        { label: "Mathematics", pct: 72 },
        { label: "Sciences", pct: 68 },
        { label: "Analytical Thinking", pct: 78 },
      ],
    },
  ], []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 25, mass: 1 });
  const titleY       = useTransform(smoothProgress, [0, 1], [0, -40]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="education"
      ref={containerRef}
      className="relative bg-black text-white"
      style={{ height: `${educationItems.length * (isMobile ? 150 : 200)}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-black">

        <ArchitecturalYear items={educationItems} progress={smoothProgress} />

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 55% 55% at 75% 50%, rgba(235,89,57,0.03) 0%, transparent 70%)",
            zIndex: 1,
          }}
        />

        <div className="relative h-full w-full md:grid md:grid-cols-12 z-10">
          <MobileHeader items={educationItems} progress={smoothProgress} />
          <LeftPanel
            items={educationItems}
            progress={smoothProgress}
            titleY={titleY}
            titleOpacity={titleOpacity}
            h2Ref={h2Ref}
          />

          <div className="col-span-8 relative h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {educationItems.map((item, index) => (
                <EducationSlide
                  key={item.institution}
                  item={item}
                  index={index}
                  total={educationItems.length}
                  progress={smoothProgress}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-10 right-10 flex items-center gap-6 z-20">
          <div className="text-[10px] font-mono text-white/20 tabular-nums">01</div>
          <div className="h-px flex-1 bg-white/5 relative overflow-hidden">
            <motion.div
              style={{ scaleX: smoothProgress, originX: 0 }}
              className="absolute inset-0 bg-[hsl(var(--accent-orange))]"
            />
          </div>
          <div className="text-[10px] font-mono text-white/20 tabular-nums">
            0{educationItems.length}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Education;
