import { motion, useReducedMotion, MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

// ─── SVG Filter ───────────────────────────────────────────────────────────────
export const MorphingSvgFilters: React.FC = () => (
  <svg id="filters" className="fixed h-0 w-0" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic" type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

// ─── Hook ─────────────────────────────────────────────────────────────────────
const morphTime = 2.5;
const cooldownTime = 1.5;

// 🔑 initialDelay: secondi da aspettare prima del PRIMO morph
// Il hook ora lo accetta come parametro così ogni istanza può avere il suo ritardo
export const useMorphingText = (texts: string[], initialDelay = 0) => {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  // Inizializziamo con initialDelay → il RAF aspetta finché non scende a 0
  const cooldownRef = useRef(initialDelay);
  const timeRef = useRef(new Date());
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback((fraction: number) => {
    const [c1, c2] = [text1Ref.current, text2Ref.current];
    if (!c1 || !c2) return;
    c2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    c2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
    const inv = 1 - fraction;
    c1.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
    c1.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    c1.textContent = texts[textIndexRef.current % texts.length];
    c2.textContent = texts[(textIndexRef.current + 1) % texts.length];
  }, [texts]);

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;
    let fraction = morphRef.current / morphTime;
    if (fraction > 1) { cooldownRef.current = cooldownTime; fraction = 1; }
    setStyles(fraction);
    if (fraction === 1) textIndexRef.current++;
  }, [setStyles]);

  // Traccia se siamo ancora nel periodo di initialDelay iniziale
  const isInInitialDelayRef = useRef(initialDelay > 0);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    // Durante l'initialDelay NON toccare gli stili: la prima parola deve restare visibile
    if (isInInitialDelayRef.current) return;
    const [c1, c2] = [text1Ref.current, text2Ref.current];
    if (c1 && c2) {
      c2.style.filter = "none";
      c2.style.opacity = "100%";
      c1.style.filter = "none";
      c1.style.opacity = "0%";
    }
  }, []);

  useEffect(() => {
    // Mostra subito la prima parola
    if (text1Ref.current) {
      text1Ref.current.textContent = texts[0];
      text1Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter = "none";
    }
    if (text2Ref.current) {
      text2Ref.current.textContent = "";
      text2Ref.current.style.opacity = "0%";
      text2Ref.current.style.filter = "none";
    }

    let id: number;
    const animate = () => {
      id = requestAnimationFrame(animate);
      const now = new Date();
      const dt = (now.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = now;
      cooldownRef.current -= dt;
      if (cooldownRef.current <= 0) {
        // Prima volta che usciamo dall'initialDelay
        isInInitialDelayRef.current = false;
        doMorph();
      } else {
        doCooldown();
      }
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

// ─── MorphingLine ─────────────────────────────────────────────────────────────
type MorphingLineProps = {
  texts: string[];
  className?: string;
  yScroll?: MotionValue<number>;
  opacityScroll?: MotionValue<number>;
  delay?: number;
  /** Secondi da aspettare prima che parta il primo morph (default 0) */
  initialDelay?: number;
};

export function MorphingLine({
  texts,
  className = "",
  yScroll,
  opacityScroll,
  delay = 0,
  initialDelay = 0,
}: MorphingLineProps) {
  const reduce = useReducedMotion();
  const { text1Ref, text2Ref } = useMorphingText(texts, initialDelay);

  return (
    <span className="block overflow-hidden perspective-1000">
      <motion.span
        className={`block will-change-transform ${className}`}
        initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0, rotateX: 45, filter: "blur(12px)" }}
        animate={reduce ? { opacity: 1 } : { y: "0%", opacity: 1, rotateX: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ y: yScroll, opacity: opacityScroll }}
      >
        <span
          className="relative inline-block w-full [filter:url(#threshold)_blur(0.6px)]"
          style={{ height: "1.1em" }}
        >
          <span ref={text1Ref} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
          <span ref={text2Ref} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
        </span>
      </motion.span>
    </span>
  );
}

// ─── MorphingInline ───────────────────────────────────────────────────────────
type MorphingInlineProps = {
  texts: string[];
  className?: string;
  initialDelay?: number;
};

export function MorphingInline({ texts, className = "", initialDelay = 0 }: MorphingInlineProps) {
  const { text1Ref, text2Ref } = useMorphingText(texts, initialDelay);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const rulerRef   = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const ruler   = rulerRef.current;
    const t1      = text1Ref.current;
    const t2      = text2Ref.current;
    if (!wrapper || !ruler || !t1 || !t2) return;

    let rafId: number;
    const sync = () => {
      const op1 = parseFloat(t1.style.opacity ?? "1");
      const op2 = parseFloat(t2.style.opacity ?? "0");
      const activeText = op1 >= op2 ? t1.textContent : t2.textContent;
      if (activeText !== null) {
        ruler.textContent = activeText;
        wrapper.style.width = `${ruler.offsetWidth}px`;
      }
      rafId = requestAnimationFrame(sync);
    };
    sync();
    return () => cancelAnimationFrame(rafId);
  }, [text1Ref, text2Ref]);

  return (
    <>
      <span
        ref={rulerRef}
        aria-hidden
        className={className}
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      />
      <span
        ref={wrapperRef}
        className={`relative inline-block [filter:url(#threshold)_blur(0.6px)] ${className}`}
        style={{
          whiteSpace: "nowrap",
          transition: "width 0.4s ease",
          lineHeight: "inherit",
          verticalAlign: "baseline",
        }}
      >
        <span aria-hidden style={{ visibility: "hidden", fontSize: "inherit", lineHeight: "inherit" }}>|</span>
        <span ref={text1Ref} className="absolute inset-0 text-center" style={{ whiteSpace: "nowrap", lineHeight: "inherit" }} />
        <span ref={text2Ref} className="absolute inset-0 text-center" style={{ whiteSpace: "nowrap", lineHeight: "inherit" }} />
      </span>
    </>
  );
}
