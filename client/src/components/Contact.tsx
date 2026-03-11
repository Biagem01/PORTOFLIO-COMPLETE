import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { MagneticWrapper } from "@/components/Magnetic";

type ContactFormData = { name: string; email: string; message: string; };
type Field = { label: string; name: keyof ContactFormData; type: string; placeholder: string; };

// ─── FocusFrame ───────────────────────────────────────────────────────────────
function ContactFrame({ rect, dur, borderColor, glowColor }: {
  rect: { x: number; y: number; width: number; height: number };
  dur: number; borderColor: string; glowColor: string;
}) {
  return (
    <motion.div
      aria-hidden
      animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height, opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{
        x: { duration: dur, ease: [0.16, 1, 0.3, 1] },
        y: { duration: dur, ease: [0.16, 1, 0.3, 1] },
        width:  { duration: dur * 0.5, ease: [0.16, 1, 0.3, 1] },
        height: { duration: dur * 0.5, ease: [0.16, 1, 0.3, 1] },
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
        <span key={k} style={{ position: 'absolute', width: '0.85rem', height: '0.85rem', border: `2.5px solid ${borderColor}`, filter: `drop-shadow(0px 0px 5px ${glowColor})`, borderRadius: '2px', ...s }} />
      ))}
    </motion.div>
  );
}

// ─── ContactTrueFocus ─────────────────────────────────────────────────────────
function ContactTrueFocus({
  fontSize = 'clamp(1.8rem, 4vw, 3rem)',
  animationDuration = 0.9,
  focusPause = 3200,
  borderColor = 'rgb(235, 89, 57)',
  glowColor = 'rgba(235, 89, 57, 0.5)',
  blurAmount = 4,
  frameAnchorRef,
}: {
  fontSize?: string;
  animationDuration?: number;
  focusPause?: number;
  borderColor?: string;
  glowColor?: string;
  blurAmount?: number;
  frameAnchorRef: React.RefObject<HTMLElement>;
}) {
  const [focusOnA, setFocusOnA] = useState(true);
  const refLets   = useRef<HTMLSpanElement>(null);
  const refCreate = useRef<HTMLSpanElement>(null);
  const refExp    = useRef<HTMLSpanElement>(null);
  const [rect0, setRect0] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [rect1, setRect1] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFocusOnA(v => !v), focusPause);
    return () => clearInterval(id);
  }, [focusPause]);

  // ✅ useCallback + unico useEffect con cleanup corretto
  const update = useCallback(() => {
    const anchor = frameAnchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    if (focusOnA) {
      const r0 = refLets.current?.getBoundingClientRect();
      const r1 = refExp.current?.getBoundingClientRect();
      if (r0) setRect0({ x: r0.left - a.left, y: r0.top - a.top, width: r0.width, height: r0.height });
      if (r1) setRect1({ x: r1.left - a.left, y: r1.top - a.top, width: r1.width, height: r1.height });
    } else {
      const r0 = refCreate.current?.getBoundingClientRect();
      if (r0) setRect0({ x: r0.left - a.left, y: r0.top - a.top, width: r0.width, height: r0.height });
      setRect1({ x: 0, y: 0, width: 0, height: 0 });
    }
    setReady(true);
  }, [focusOnA, frameAnchorRef]);

  useEffect(() => {
    update();
    const tid = setTimeout(update, 50);
    // ✅ Solo resize, NO scroll
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(tid);
      window.removeEventListener('resize', update);
    };
  }, [update]);

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
      <div className="overflow-hidden">
        <motion.div initial={{ y: "110%", rotate: 3 }} whileInView={{ y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0, ease: [0.16, 1, 0.3, 1] }}>
          <span ref={refLets} className={`whitespace-nowrap tracking-tighter font-extrabold leading-[0.95] ${focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(focusOnA)}>LET'S</span>
        </motion.div>
      </div>
      <div className="overflow-hidden">
        <motion.div initial={{ y: "110%", rotate: 3 }} whileInView={{ y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
          <span ref={refCreate} className={`whitespace-nowrap tracking-tighter font-extrabold leading-[0.95] ${!focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(!focusOnA)}>CREATE</span>
        </motion.div>
      </div>
      <div className="overflow-hidden">
        <motion.div initial={{ y: "110%", rotate: 3 }} whileInView={{ y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
          <span className="whitespace-nowrap tracking-tighter font-medium leading-[0.95] italic font-serif"
            style={{ display: 'inline-block', fontSize, lineHeight: 1, padding: PADDING, color: 'rgba(255,255,255,0.3)' }}>
            something
          </span>
        </motion.div>
      </div>
      <div className="overflow-hidden">
        <motion.div initial={{ y: "110%", rotate: 3 }} whileInView={{ y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <span ref={refExp} className={`whitespace-nowrap tracking-tighter font-extrabold leading-[0.95] ${focusOnA ? 'font-orange' : 'font-white'}`} style={wordStyle(focusOnA)}>EXPERIENCES</span>
        </motion.div>
      </div>

      {ready && focusOnA && <ContactFrame rect={rect0} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
      {ready && focusOnA && rect1.width > 0 && <ContactFrame rect={rect1} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
      {ready && !focusOnA && <ContactFrame rect={rect0} dur={dur} borderColor={borderColor} glowColor={glowColor} />}
    </>
  );
}

export const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 1 });

  const opacity   = useTransform(smoothProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const scale     = useTransform(smoothProgress, [0, 0.12, 0.88, 1], [0.94, 1, 1, 0.94]);
  const leftY     = useTransform(smoothProgress, [0, 1], [60, -60]);
  const rightY    = useTransform(smoothProgress, [0, 1], [100, -40]);
  const barScaleX = useTransform(smoothProgress, [0, 1], [0, 1]);

  const fields: Field[] = [
    { label: "Name",  name: "name",  type: "text",  placeholder: "Your name" },
    { label: "Email", name: "email", type: "email", placeholder: "Your professional email" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      toast.success("Message sent!", { description: "I'll get back to you as soon as possible." });
      setFormData({ name: "", email: "", message: "" });
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} id="contact" className="relative min-h-screen py-24 lg:py-48 px-6 bg-black text-white overflow-hidden">
      <div className="absolute bottom-8 left-6 right-6 flex items-center gap-4 z-20 opacity-30">
        <div className="text-[9px] font-mono text-white/40 tabular-nums">03</div>
        <div className="h-px flex-1 bg-white/5 relative overflow-hidden">
          <motion.div style={{ scaleX: barScaleX, originX: 0 }} className="absolute inset-0 bg-[hsl(var(--accent-orange))]" />
        </div>
        <div className="text-[9px] font-mono text-white/40 tabular-nums">END</div>
      </div>

      <motion.div style={{ opacity, scale }} className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">

          {/* LEFT */}
          <motion.div style={{ y: leftY }} className="space-y-16">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.2em]"
              >
                <span className="w-1 h-1 rounded-full bg-[hsl(var(--accent-orange))] animate-pulse" />
                Open for new collaborations
              </motion.div>

              <div ref={titleRef} className="relative space-y-0" data-cursor="big">
                <ContactTrueFocus
                  fontSize="clamp(1.8rem, 4vw, 3rem)"
                  animationDuration={0.9} focusPause={3200}
                  borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
                  blurAmount={4}
                  frameAnchorRef={titleRef as React.RefObject<HTMLElement>}
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm text-white/50 max-w-md leading-relaxed font-light" data-cursor="big"
              >
                Whether you have a specific project in mind or just want to say hello,
                I'm always open to new opportunities and interesting conversations.
              </motion.p>
            </div>

            <div className="space-y-8 pt-4">
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-px w-full bg-white/8 origin-left" />
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3" data-cursor="hide">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">Contact Details</span>
                <MagneticWrapper>
                  <a href="mailto:biagio.99cubisino@gmail.com"
                    className="group relative flex items-center gap-2 text-base md:text-lg italic font-serif font-medium text-white/50 hover:text-[hsl(var(--accent-orange))] transition-colors duration-500">
                    <span>biagio.99cubisino@gmail.com</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                  </a>
                </MagneticWrapper>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div style={{ y: rightY }}
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[48px] bg-[hsl(var(--accent-orange))]/5 blur-2xl opacity-50" />
            <motion.div initial={{ opacity: 0, scale: 0.7, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center mb-8" data-cursor="medium">
              <MagneticWrapper>
                <img src="/logo/favicon.png" alt="Logo" data-cursor="medium" className="w-40 h-40 md:w-48 md:h-48 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
              </MagneticWrapper>
            </motion.div>

            <div className="p-8 md:p-12 rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {fields.map((field, i) => (
                    <motion.div key={field.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.35 + i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{field.label}</label>
                      <input type={field.type} value={formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder} required
                        className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white/80 focus:border-[hsl(var(--accent-orange))] outline-none transition-colors duration-300 placeholder:text-white/20" />
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }} className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Message</label>
                  <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about your project..." required rows={4}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white/80 focus:border-[hsl(var(--accent-orange))] outline-none transition-colors duration-300 resize-none placeholder:text-white/20" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }} className="pt-2">
                  <MagneticWrapper>
                    <button type="submit" disabled={isSubmitting}
                      className="group relative inline-flex items-center gap-3 bg-[hsl(var(--accent-orange))] text-black px-8 py-4 rounded-full overflow-hidden text-xs font-medium tracking-[0.1em] uppercase shadow-[0_0_20px_hsl(var(--accent-orange)/0.3)] transition-all duration-300 hover:shadow-[0_0_36px_hsl(var(--accent-orange)/0.55)] disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out bg-gradient-to-r from-white/0 via-white/25 to-white/0 rotate-12" />
                      <AnimatePresence mode="wait">
                        <motion.span key={isSubmitting ? "sending" : "send"}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }} className="relative z-10 font-medium tracking-tight">
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </motion.span>
                      </AnimatePresence>
                      <div className="relative z-10 w-5 h-5 flex items-center justify-center overflow-hidden">
                        <ArrowRight className="w-full h-full transition-transform duration-300 group-hover:translate-x-full" />
                        <ArrowRight className="absolute w-full h-full -translate-x-full transition-transform duration-300 group-hover:translate-x-0" />
                      </div>
                    </button>
                  </MagneticWrapper>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Contact;
