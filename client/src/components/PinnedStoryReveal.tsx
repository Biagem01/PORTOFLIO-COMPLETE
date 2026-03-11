/**
 * PinnedStoryReveal.tsx
 */

import React, { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Project {
  title: string; year: string; role: string; category: string;
  about: string; challenge: string; solution: string;
  highlight?: string; highlightDescription?: string;
  results: string[]; services: string[]; technologies: string[]; extraMedia: string[];
}
interface Props { project: Project; projectIndex: number; }

const SCROLL_MAIN = "text-[hsl(var(--scroll-indicator))]";
const PRIMARY      = "rgb(235,89,57)";
const BORDER_COLOR = "rgb(235, 89, 57)";
const GLOW_COLOR   = "rgba(235, 89, 57, 0.5)";

/* ─── FocusFrame ─────────────────────────────────────────────────────────── */
function FocusFrame({ rect, dur }: { rect: { x: number; y: number; width: number; height: number }; dur: number }) {
  return (
    <motion.div aria-hidden
      animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height, opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ x: { duration: dur, ease: [0.16,1,0.3,1] }, y: { duration: dur, ease: [0.16,1,0.3,1] }, width: { duration: dur*0.5, ease: [0.16,1,0.3,1] }, height: { duration: dur*0.5, ease: [0.16,1,0.3,1] }, opacity: { duration: 0.15 } }}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", boxSizing: "content-box", zIndex: 20 }}
    >
      {([
        { k: "tl", s: { top: -9,    left: -9,  borderRight: "none" as const, borderBottom: "none" as const } },
        { k: "tr", s: { top: -9,    right: -9, borderLeft:  "none" as const, borderBottom: "none" as const } },
        { k: "bl", s: { bottom: -9, left: -9,  borderRight: "none" as const, borderTop:    "none" as const } },
        { k: "br", s: { bottom: -9, right: -9, borderLeft:  "none" as const, borderTop:    "none" as const } },
      ]).map(({ k, s }) => (
        <span key={k} style={{ position: "absolute", width: "0.85rem", height: "0.85rem", border: `2.5px solid ${BORDER_COLOR}`, filter: `drop-shadow(0px 0px 5px ${GLOW_COLOR})`, borderRadius: "2px", ...s }} />
      ))}
    </motion.div>
  );
}

/* ─── StoryTitle ─────────────────────────────────────────────────────────── */
function StoryTitle({ keyword, fontSize = "clamp(1.9rem, 3vw, 3.4rem)", focusPause = 3000, animationDuration = 0.8 }: {
  keyword: string; fontSize?: string; focusPause?: number; animationDuration?: number;
}) {
  const [focusOnThe, setFocusOnThe] = React.useState(true);
  const wrapRef    = useRef<HTMLSpanElement>(null);
  const theRef     = useRef<HTMLSpanElement>(null);
  const keywordRef = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    const id = setInterval(() => setFocusOnThe(v => !v), focusPause);
    return () => clearInterval(id);
  }, [focusPause]);

  useEffect(() => {
    const update = () => {
      const anchor = wrapRef.current; if (!anchor) return;
      const a = anchor.getBoundingClientRect();
      const el = focusOnThe ? theRef.current : keywordRef.current;
      if (el) { const r = el.getBoundingClientRect(); setRect({ x: r.left - a.left, y: r.top - a.top, width: r.width, height: r.height }); }
      setReady(true);
    };
    update(); const tid = setTimeout(update, 50);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { update(); setTimeout(update, 80); } }, { threshold: 0.01 });
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => { clearTimeout(tid); window.removeEventListener("resize", update); window.removeEventListener("scroll", update); observer.disconnect(); };
  }, [focusOnThe]);

  const dur = animationDuration;
  const wordStyle = (isActive: boolean): React.CSSProperties => ({
    display: "inline-block", fontSize, lineHeight: 1, borderRadius: "0.5rem", padding: "2px 12px",
    backgroundColor: isActive ? "hsl(var(--accent-orange))" : "transparent",
    color: isActive ? "#000" : "hsl(38 28% 57%)",
    filter: isActive ? "blur(0px)" : "blur(4px)",
    transition: [`filter ${dur}s ease`, `background-color ${dur*0.6}s ease`, `color ${dur*0.6}s ease`].join(", "),
  });

  return (
    <span ref={wrapRef} className="relative inline-flex items-baseline gap-2 mb-8" data-cursor="big">
      <span ref={theRef} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${focusOnThe ? "font-orange" : "font-white"}`} style={wordStyle(focusOnThe)}>The</span>
      <span ref={keywordRef} className={`whitespace-nowrap tracking-tight uppercase font-extrabold leading-none ${!focusOnThe ? "font-orange" : "font-white"}`} style={wordStyle(!focusOnThe)}>{keyword}</span>
      {ready && <FocusFrame rect={rect} dur={dur} />}
    </span>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export const PinnedStoryReveal: React.FC<Props> = ({ project }) => {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const rightPinRef = useRef<HTMLDivElement>(null);

  const panels = useMemo(() => {
    const base = [
      { index: "01", tag: "Challenge", body: project.challenge, image: project.extraMedia[0] },
      { index: "02", tag: "Fix",       body: project.solution,  image: project.extraMedia[1] },
    ];
    if (project.highlight) {
      base.push({
        index: "03", tag: "Result",
        body: project.highlight + (project.highlightDescription ? ` — ${project.highlightDescription}` : ""),
        image: project.extraMedia[2] ?? project.extraMedia[0],
      });
    }
    return base;
  }, [project]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section  = sectionRef.current;
      const rightPin = rightPinRef.current;
      if (!section || !rightPin) return;

      const wrappers = gsap.utils.toArray<HTMLElement>(".psrv__img-wrapper", rightPin);
      wrappers.forEach((el, i) => { el.style.zIndex = String(wrappers.length - i); });
      const imgs = wrappers.map(w => w.querySelector("img") as HTMLImageElement);
      gsap.set(imgs, { clipPath: "inset(0% 0% 0% 0%)", objectPosition: "50% 0%" });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", pin: rightPin, scrub: 1, invalidateOnRefresh: true },
      });

      imgs.forEach((img, i) => {
        const nextImg = imgs[i + 1] ?? null;
        const seg = gsap.timeline();
        if (nextImg) {
          seg
            .to(img,     { clipPath: "inset(0% 0% 100% 0%)", objectPosition: "50% 60%", duration: 1.5, ease: "none" }, 0)
            .to(nextImg, { objectPosition: "50% 40%", duration: 1.5, ease: "none" }, 0);
        }
        tl.add(seg);
      });

      ScrollTrigger.refresh();
    }, sectionRef);
    return () => ctx.revert();
  }, [panels]);

  return (
    <section ref={sectionRef} className="relative" style={{ minHeight: `${panels.length * 100}vh`, backgroundColor: "#000000" }}>
      <div className="relative z-10 flex gap-0 justify-between max-w-[1200px] mx-auto px-6 lg:px-16">

        {/* LEFT */}
        <div className="psrv__left flex flex-col min-w-0 flex-1 pr-8 lg:pr-16">
          <div className="sticky top-0 z-20 pt-8 pb-4 flex items-center gap-4" style={{ backgroundColor: "#000000" }}>
            <span className="font-button text-[9px] uppercase tracking-[0.55em] text-white/30">03 — Story</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {panels.map((panel, i) => (
            <div key={panel.index} className="psrv__panel flex flex-col justify-center" style={{ minHeight: "100vh", paddingBlock: "8rem" }}>
              <span className="font-button text-[9px] uppercase tracking-[0.55em] block mb-6" style={{ color: PRIMARY }}>
                {panel.index} — {panel.tag}
              </span>

              <StoryTitle keyword={panel.tag} fontSize="clamp(1.9rem, 3vw, 3.4rem)" focusPause={3000} animationDuration={0.8} />

              {/* ✅ Testo statico — rimosso VariableText con ~700 spring */}
              <p className="font-button text-sm font-light leading-relaxed text-white/45">{panel.body}</p>

              {i === panels.length - 1 && project.results.length > 0 && (
                <div className="mt-10 space-y-0">
                  {project.results.map((result, ri) => (
                    <div key={ri} className="group flex gap-5 items-center py-6 border-t border-white/[0.08] last:border-b hover:bg-white/[0.03] hover:px-4 rounded-xl transition-all duration-500 -mx-4 px-4">
                      <span className="font-button text-xs min-w-[2rem] shrink-0" style={{ color: PRIMARY }}>{String(ri + 1).padStart(2, "0")}</span>
                      <p className={`font-white uppercase flex-1 leading-tight tracking-tight ${SCROLL_MAIN}`} style={{ fontSize: "clamp(1rem, 1.6vw, 1.8rem)" }}>{result}</p>
                      <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-black transition-all duration-300 shrink-0 text-white/40">
                        <ArrowRight size={11} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-16 font-white uppercase leading-none select-none pointer-events-none opacity-[0.04]" style={{ fontSize: "18vw", color: PRIMARY, lineHeight: 1 }}>
                {panel.index}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div ref={rightPinRef} className="psrv__right hidden lg:block flex-shrink-0" style={{ width: "min(480px, 42vw)", height: "100vh", position: "relative" }}>
          {panels.map((panel) => (
            <div key={panel.index} className="psrv__img-wrapper absolute inset-0 flex items-center" style={{ top: "50%", transform: "translateY(-50%)", height: "420px" }}>
              <div className="absolute top-0 left-0 w-14 h-[2px] z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${PRIMARY}, transparent)` }} />
              <div className="absolute top-0 left-0 w-[2px] h-14 z-10 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${PRIMARY}, transparent)` }} />
              <img src={panel.image} alt={panel.tag} className="w-full h-full object-cover" style={{ borderRadius: "1rem", objectPosition: "50% 0%", display: "block" }} draggable={false} />
              <div className="absolute bottom-4 left-5 right-5 flex justify-between z-10 pointer-events-none">
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-white/30">{panel.tag}</span>
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-white/30">{panel.index}</span>
              </div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)" }} />
            </div>
          ))}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 font-white uppercase select-none pointer-events-none hidden xl:block" style={{ writingMode: "vertical-rl", fontSize: "10px", letterSpacing: "0.4em", color: "rgba(235,89,57,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
            {project.title}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PinnedStoryReveal;
