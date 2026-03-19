/**
 * Hero.tsx — Responsive edition
 *
 * MOBILE FIX:
 * • Beat text: padding laterale clamp invece di fisso pl-8/pr-8 md:pl-16 lg:pl-24
 * • fontSize beats: clamp più aggressivo su mobile (non taglia lo schermo)
 * • Scroll indicator: su touch non scompare (non c'è scroll velocity da mouse)
 * • GraphHero entrance: invariata (già gestita in GraphHero.tsx)
 * • eyebrow text: truncate su schermi <360px
 *
 * CURSOR FIX:
 * • data-cursor="big" aggiunto su tutti i BeatText wrapper
 * • data-cursor="big" aggiunto su Beat A wrapper
 *
 * WIP BADGE:
 * • Banner "Work in progress" top-right, si anima in entrata con il resto
 */

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  animate,
  AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { HeroBadgesFocus, TwoWordFocus } from "./TrueFocus";
import GraphHero from "./GraphHero";

const BEATS = [
  {
    id: "b", start: 0.10, peak: 0.14, hold: 0.22, end: 0.27,
    align: "left" as const, eyebrow: "Every detail considered",
    line1: "ENGINEERED TO", line2: "PERFORM",
  },
  {
    id: "c", start: 0.28, peak: 0.32, hold: 0.40, end: 0.45,
    align: "right" as const, eyebrow: "React · TypeScript · Framer Motion",
    line1: "BUILT WITH", line2: "PURPOSE",
  },
  {
    id: "d", start: 0.70, peak: 0.74, hold: 0.82, end: 0.87,
    align: "center" as const, eyebrow: "Design meets engineering",
    line1: "WHERE FORM", line2: "MEETS FUNCTION",
  },
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·—";

function useTextScramble(finalText: string, isActive: boolean, speed = 28) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!isActive) { setDisplay(""); return; }
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(finalText.split("").map((char, index) => {
        if (char === " ") return " ";
        if (index < iteration) return finalText[index];
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join(""));
      if (iteration >= finalText.length) clearInterval(interval);
      iteration += 0.4;
    }, speed);
    return () => clearInterval(interval);
  }, [isActive, finalText, speed]);
  return display;
}

/* ─── WipBadge ───────────────────────────────────────────────────────────── */
function WipBadge({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
      transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        top: "clamp(1rem, 3vh, 1.75rem)",
        right: "clamp(1rem, 4vw, 2.5rem)",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid rgba(235, 89, 57, 0.25)",
          backgroundColor: "rgba(235, 89, 57, 0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Pulsing dot */}
        <span style={{ position: "relative", display: "flex", width: 6, height: 6 }}>
          <motion.span
            animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              backgroundColor: "hsl(11 80% 57%)",
            }}
          />
          <span style={{
            position: "relative", display: "inline-flex",
            width: 6, height: 6, borderRadius: "50%",
            backgroundColor: "hsl(11 80% 57%)",
          }} />
        </span>

        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "hsl(38 33% 57% / 0.7)",
            whiteSpace: "nowrap",
          }}
        >
          Work in progress
        </span>

        {/* Separator */}
        <span style={{ width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.1)" }} />

        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          v0.1
        </span>
      </div>
    </motion.div>
  );
}

/* ─── BeatText ───────────────────────────────────────────────────────────── */
function BeatText({ beat, scrollProgress }: { beat: (typeof BEATS)[0]; scrollProgress: ReturnType<typeof useSpring> }) {
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const opacity   = useTransform(scrollProgress, [beat.start, beat.peak, beat.hold, beat.end], [0, 1, 1, 0]);
  const y         = useTransform(scrollProgress, [beat.start, beat.peak, beat.hold, beat.end], [52, 0, 0, -28]);
  const blurVal   = useTransform(scrollProgress, [beat.start, beat.peak, beat.hold, beat.end], [12, 0, 0, 6]);
  const filter    = useTransform(blurVal, (v) => `blur(${v}px)`);
  const lineScale = useTransform(scrollProgress, [beat.start, beat.peak + 0.05], [0, 1]);

  const isRight  = beat.align === "right";
  const isCenter = beat.align === "center";

  const FONT_SIZE = "clamp(1.8rem, 5.5vw, 5rem)";
  const hPad = "clamp(20px, 6vw, 96px)";

  const alignStyle: React.CSSProperties = isCenter
    ? { alignItems: "center", textAlign: "center" }
    : isRight
    ? { alignItems: "flex-end", paddingRight: hPad }
    : { alignItems: "flex-start", paddingLeft: hPad };

  return (
    <motion.div
      data-cursor="big"
      style={{
        opacity, y, filter,
        position: "absolute", inset: 0,
        pointerEvents: "auto", zIndex: 20,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        ...alignStyle,
      }}
    >
      <p
        className="font-button text-[7px] uppercase tracking-[0.65em] mb-5"
        style={{
          color: "hsl(38 33% 57% / 0.35)",
          maxWidth: "90vw",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {beat.eyebrow}
      </p>

      <h2
        ref={h2Ref}
        className="relative leading-[0.88]"
        style={{ fontSize: FONT_SIZE }}
      >
        <TwoWordFocus
          word0={beat.line1} word1={beat.line2}
          fontSize={FONT_SIZE}
          animationDuration={0.9} focusPause={3500}
          borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
          blurAmount={4} frameAnchorRef={h2Ref}
        />
      </h2>

      <motion.div style={{
        scaleX: lineScale,
        transformOrigin: isCenter ? "center" : isRight ? "right" : "left",
        width: 40, height: 1,
        backgroundColor: "hsl(11 80% 57% / 0.6)",
        marginTop: "1.25rem",
        alignSelf: isCenter ? "center" : isRight ? "flex-end" : "flex-start",
      }} />
    </motion.div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export default function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const h1Ref      = useRef<HTMLHeadingElement>(null);
  useReducedMotion();

  const entranceProgress = useMotionValue(0);
  const [textVisible, setTextVisible] = useState(false);
  const [showScroll, setShowScroll]   = useState(false);

  const isTouchRef = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(hover: none) and (pointer: coarse)").matches
      : false
  );

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.00005 });

  useEffect(() => {
    window.scrollTo(0, 0);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      entranceProgress.set(1);
      setTextVisible(true);
      setShowScroll(true);
      return;
    }

    const controls = animate(entranceProgress, 1, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (v >= 0.4 && !textVisible) setTextVisible(true);
      },
      onComplete: () => {
        setTimeout(() => setShowScroll(true), 600);
      },
    });
    return () => controls.stop();
  }, []);

  useEffect(() => smoothProgress.on("change", (v) => {
    const threshold = isTouchRef.current ? 0.03 : 0.05;
    if (v > threshold) setShowScroll(false);
  }), [smoothProgress]);

  const eyebrowText = useTextScramble("biagio cubisino — portfolio", textVisible);

  const beatAOpacity = useTransform(smoothProgress, [0.0, 0.06, 0.10], [1, 1, 0]);
  const beatAY       = useTransform(smoothProgress, [0.0, 0.06, 0.10], [0, 0, -28]);
  const beatABlur    = useTransform(smoothProgress, [0.0, 0.06, 0.10], [0, 0, 8]);
  const beatAFilter  = useTransform(beatABlur, (v) => `blur(${v}px)`);
  const fontWeight    = useTransform(smoothProgress, [0, 0.1], [700, 450]);
  const letterSpacing = useTransform(smoothProgress, [0, 0.1], ["0.02em", "-0.01em"]);

  const HERO_FONT = "clamp(2rem, 8vw, 6.5rem)";

  return (
    <div ref={wrapperRef} style={{ height: "850vh", position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh", width: "100%",
        overflow: "hidden", backgroundColor: "#000000",
      }}>
        <GraphHero scrollProgress={smoothProgress} entranceProgress={entranceProgress} />

        {/* Vignette radiale */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 42%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.95) 100%)",
          pointerEvents: "none", zIndex: 5,
        }} />
        {/* Gradient bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.82) 60%, #000000 100%)",
          pointerEvents: "none", zIndex: 6,
        }} />

        {/* WIP Badge */}
        <WipBadge visible={textVisible} />

        {/* Beat A — titolo principale */}
        <motion.div
          data-cursor="big"
          style={{
            opacity: beatAOpacity, y: beatAY, filter: beatAFilter,
            position: "absolute", inset: 0, pointerEvents: "auto", zIndex: 20,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", textAlign: "center",
            padding: "0 clamp(16px, 5vw, 48px)",
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: textVisible ? 1 : 0, y: textVisible ? 0 : 14 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-button text-[7px] uppercase tracking-[0.7em] mb-7"
            style={{
              color: "hsl(38 33% 57% / 0.35)",
              maxWidth: "88vw", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {eyebrowText}
          </motion.p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1
              ref={h1Ref}
              initial={{ y: "110%" }}
              animate={{ y: textVisible ? "0%" : "110%" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
              className="relative font-extrabold leading-[1] tracking-tight"
              style={{ fontSize: HERO_FONT, fontWeight, letterSpacing }}
            >
              <HeroBadgesFocus
                word0="CRAFTING" word1="MINIMAL" word2="DIGITAL" word3="PRODUCTS"
                fontSize={HERO_FONT}
                animationDuration={0.9} focusPause={3500}
                borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
                blurAmount={4} frameAnchorRef={h1Ref}
              />
            </motion.h1>
          </div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: textVisible ? 1 : 0, opacity: textVisible ? 1 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              transformOrigin: "center", width: 36, height: 1,
              backgroundColor: "hsl(11 80% 57% / 0.6)", margin: "1.5rem auto",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: textVisible ? 1 : 0, y: textVisible ? 0 : 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="font-button text-[7px] uppercase tracking-[0.5em]"
            style={{ color: "hsl(38 33% 57% / 0.35)" }}
          >
            Full Stack Developer &amp; Visual Director
          </motion.p>
        </motion.div>

        {/* Beat B, C, D */}
        {BEATS.map((beat) => (
          <BeatText key={beat.id} beat={beat} scrollProgress={smoothProgress} />
        ))}

        {/* Scroll indicator */}
        <AnimatePresence>
          {showScroll && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                bottom: "clamp(2rem, 6vh, 4rem)",
                left: 0, right: 0,
                margin: "0 auto", width: "fit-content",
                zIndex: 30,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                pointerEvents: "none",
              }}
            >
              <p className="font-button text-[6px] uppercase tracking-[0.7em]"
                style={{ color: "hsl(38 33% 57% / 0.2)" }}>
                {isTouchRef.current ? "Swipe" : "Scroll"}
              </p>
              <motion.div
                animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 1, height: 44,
                  backgroundColor: "hsl(11 80% 57%)",
                  transformOrigin: "top",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: textVisible ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            position: "absolute", bottom: 0, left: 0,
            height: 1, backgroundColor: "hsl(11 80% 57% / 0.4)",
            scaleX: smoothProgress, transformOrigin: "left",
            zIndex: 30, width: "100%",
          }}
        />
      </div>
    </div>
  );
}
