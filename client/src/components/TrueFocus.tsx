import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// ─── FocusFrame ───────────────────────────────────────────────────────────────
function FocusFrame({ rect, dur, borderColor, glowColor }: {
  rect: { x: number; y: number; width: number; height: number };
  dur: number; borderColor: string; glowColor: string;
}) {
  return (
    <motion.div
      aria-hidden
      animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height, opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{
        x:       { duration: dur, ease: [0.16, 1, 0.3, 1] },
        y:       { duration: dur, ease: [0.16, 1, 0.3, 1] },
        width:   { duration: dur * 0.5, ease: [0.16, 1, 0.3, 1] },
        height:  { duration: dur * 0.5, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.15 },
      }}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', boxSizing: 'content-box', zIndex: 20 }}
    >
      {([
        { k: 'tl', s: { top: -9,    left: -9,  borderRight: 'none' as const, borderBottom: 'none' as const } },
        { k: 'tr', s: { top: -9,    right: -9, borderLeft:  'none' as const, borderBottom: 'none' as const } },
        { k: 'bl', s: { bottom: -9, left: -9,  borderRight: 'none' as const, borderTop:    'none' as const } },
        { k: 'br', s: { bottom: -9, right: -9, borderLeft:  'none' as const, borderTop:    'none' as const } },
      ]).map(({ k, s }) => (
        <span key={k} style={{
          position: 'absolute', width: '0.85rem', height: '0.85rem',
          border: `2.5px solid ${borderColor}`,
          filter: `drop-shadow(0px 0px 5px ${glowColor})`,
          borderRadius: '2px', ...s,
        }} />
      ))}
    </motion.div>
  );
}

// ─── useRectUpdater ───────────────────────────────────────────────────────────
// Hook condiviso: aggiorna i rect SOLO su resize e focusChange, MAI sullo scroll
function useRectUpdater(
  deps: unknown[],
  update: () => void,
  anchorRef: React.RefObject<HTMLElement>,
) {
  useEffect(() => {
    update();
    const tid = setTimeout(update, 50);

    // Solo resize — NO scroll listener
    window.addEventListener('resize', update);

    // IntersectionObserver per quando l'elemento rientra nel viewport
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { update(); setTimeout(update, 80); } },
      { threshold: 0.01 }
    );
    if (anchorRef.current) observer.observe(anchorRef.current);

    return () => {
      clearTimeout(tid);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HeroBadgesFocus — 4 parole verticali, focus alterna coppie A/B
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroBadgesFocusProps {
  word0: string; word1: string; word2: string; word3: string;
  fontSize?: string; animationDuration?: number; focusPause?: number;
  borderColor?: string; glowColor?: string; blurAmount?: number;
  frameAnchorRef: React.RefObject<HTMLHeadingElement>;
}

export function HeroBadgesFocus({
  word0, word1, word2, word3,
  fontSize = 'clamp(2rem, 8vw, 5.5rem)',
  animationDuration = 0.9, focusPause = 3500,
  borderColor = 'rgb(235, 89, 57)', glowColor = 'rgba(235, 89, 57, 0.5)',
  blurAmount = 5, frameAnchorRef,
}: HeroBadgesFocusProps) {
  const [focusOnA, setFocusOnA] = useState(true);
  const ref0 = useRef<HTMLSpanElement>(null);
  const ref1 = useRef<HTMLSpanElement>(null);
  const ref2 = useRef<HTMLSpanElement>(null);
  const ref3 = useRef<HTMLSpanElement>(null);
  const [rect0, setRect0] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [rect1, setRect1] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFocusOnA(v => !v), focusPause);
    return () => clearInterval(id);
  }, [focusPause]);

  const update = useCallback(() => {
    const anchor = frameAnchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const elTop = focusOnA ? ref0.current : ref1.current;
    const elBot = focusOnA ? ref2.current : ref3.current;
    if (elTop) { const r = elTop.getBoundingClientRect(); setRect0({ x: r.left - a.left, y: r.top - a.top, width: r.width, height: r.height }); }
    if (elBot) { const r = elBot.getBoundingClientRect(); setRect1({ x: r.left - a.left, y: r.top - a.top, width: r.width, height: r.height }); }
    setReady(true);
  }, [focusOnA, frameAnchorRef]);

  useRectUpdater([focusOnA], update, frameAnchorRef as React.RefObject<HTMLElement>);

  const dur = animationDuration;
  const PADDING = '3px 14px';
  const blurStyle = `blur(${blurAmount}px)`;

  const wordStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-block', fontSize, lineHeight: 1,
    borderRadius: '0.5rem', padding: PADDING,
    backgroundColor: isActive ? 'hsl(var(--accent-orange))' : 'transparent',
    color: isActive ? '#000' : 'hsl(38 28% 57%)',
    filter: isActive ? 'blur(0px)' : blurStyle,
    transition: [`filter ${dur}s ease`, `background-color ${dur * 0.6}s ease`, `color ${dur * 0.6}s ease`].join(', '),
  });

  return (
    <>
      <span className="block"><span ref={ref0} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(focusOnA)}>{word0}</span></span>
      <span className="block"><span ref={ref1} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${!focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(!focusOnA)}>{word1}</span></span>
      <span className="block"><span ref={ref2} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(focusOnA)}>{word2}</span></span>
      <span className="block"><span ref={ref3} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${!focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(!focusOnA)}>{word3}</span></span>
      {ready && <FocusFrame rect={rect0} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
      {ready && <FocusFrame rect={rect1} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// InlineTrueFocus — parole inline nella stessa riga
// ═══════════════════════════════════════════════════════════════════════════════

interface InlineTrueFocusProps {
  words: string[]; lineBreakAfter?: number; fontSize?: string;
  animationDuration?: number; focusPause?: number;
  borderColor?: string; glowColor?: string; blurAmount?: number; className?: string;
}

export function InlineTrueFocus({
  words, lineBreakAfter, fontSize = 'inherit',
  animationDuration = 0.9, focusPause = 3500,
  borderColor = 'rgb(235, 89, 57)', glowColor = 'rgba(235, 89, 57, 0.5)',
  blurAmount = 5, className = '',
}: InlineTrueFocusProps) {
  const [focusOnA, setFocusOnA] = useState(true);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [rects, setRects] = useState<{ x: number; y: number; width: number; height: number }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFocusOnA(v => !v), focusPause);
    return () => clearInterval(id);
  }, [focusPause]);

  const update = useCallback(() => {
    const anchor = wrapperRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const activeIndices = words.map((_, i) => i).filter(i => focusOnA ? i % 2 === 0 : i % 2 !== 0);
    const newRects = activeIndices.map(i => {
      const el = wordRefs.current[i];
      if (!el) return { x: 0, y: 0, width: 0, height: 0 };
      const r = el.getBoundingClientRect();
      return { x: r.left - a.left, y: r.top - a.top, width: r.width, height: r.height };
    });
    setRects(newRects);
    setReady(true);
  }, [focusOnA, words]);

  useRectUpdater([focusOnA], update, wrapperRef as React.RefObject<HTMLElement>);

  const dur = animationDuration;
  const PADDING = '2px 12px';
  const blurStyle = `blur(${blurAmount}px)`;

  return (
    <span ref={wrapperRef} className={`relative inline-block ${className}`}>
      {words.map((word, i) => {
        const isActive = focusOnA ? i % 2 === 0 : i % 2 !== 0;
        return (
          <span key={i}>
            <span
              ref={el => { wordRefs.current[i] = el; }}
              className={`inline-block whitespace-nowrap tracking-tight uppercase font-extrabold ${isActive ? 'font-orange' : 'font-white'}`}
              style={{
                fontSize, lineHeight: 'inherit', borderRadius: '0.45rem', padding: PADDING,
                backgroundColor: isActive ? 'hsl(var(--accent-orange))' : 'transparent',
                color: isActive ? '#000' : 'hsl(38 28% 57%)',
                filter: isActive ? 'blur(0px)' : blurStyle,
                verticalAlign: 'middle',
                transition: [`filter ${dur}s ease`, `background-color ${dur * 0.6}s ease`, `color ${dur * 0.6}s ease`].join(', '),
              }}
            >
              {word}
            </span>
            {lineBreakAfter === i && <br />}
          </span>
        );
      })}
      {ready && rects.map((rect, i) => (
        <FocusFrame key={i} rect={rect} dur={dur} borderColor={borderColor} glowColor={glowColor} />
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TwoWordFocus — alterna frame tra 2 parole verticali
// ═══════════════════════════════════════════════════════════════════════════════

interface TwoWordFocusProps {
  word0: string; word1: string; fontSize?: string;
  animationDuration?: number; focusPause?: number;
  borderColor?: string; glowColor?: string; blurAmount?: number;
  frameAnchorRef: React.RefObject<HTMLElement>;
}

export function TwoWordFocus({
  word0, word1,
  fontSize = 'clamp(2rem, 8vw, 5.5rem)',
  animationDuration = 0.9, focusPause = 3000,
  borderColor = 'rgb(235, 89, 57)', glowColor = 'rgba(235, 89, 57, 0.5)',
  blurAmount = 4, frameAnchorRef,
}: TwoWordFocusProps) {
  const [focusOnA, setFocusOnA] = useState(true);
  const ref0 = useRef<HTMLSpanElement>(null);
  const ref1 = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFocusOnA(v => !v), focusPause);
    return () => clearInterval(id);
  }, [focusPause]);

  const update = useCallback(() => {
    const anchor = frameAnchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const el = focusOnA ? ref0.current : ref1.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left - a.left, y: r.top - a.top, width: r.width, height: r.height });
    }
    setReady(true);
  }, [focusOnA, frameAnchorRef]);

  useRectUpdater([focusOnA], update, frameAnchorRef);

  const dur = animationDuration;
  const PADDING = '3px 14px';
  const blurStyle = `blur(${blurAmount}px)`;

  const wordStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-block', fontSize, lineHeight: 1,
    borderRadius: '0.5rem', padding: PADDING,
    backgroundColor: isActive ? 'hsl(var(--accent-orange))' : 'transparent',
    color: isActive ? '#000' : 'hsl(38 28% 57%)',
    filter: isActive ? 'blur(0px)' : blurStyle,
    transition: [`filter ${dur}s ease`, `background-color ${dur * 0.6}s ease`, `color ${dur * 0.6}s ease`].join(', '),
  });

  return (
    <>
      <span className="block">
        <span ref={ref0} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(focusOnA)}>{word0}</span>
      </span>
      <span className="block">
        <span ref={ref1} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${!focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(!focusOnA)}>{word1}</span>
      </span>
      {ready && <FocusFrame rect={rect} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
    </>
  );
}
