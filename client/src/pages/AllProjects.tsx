import { useLayoutEffect, useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { PROJECTS } from '../lib/constants';
import Footer from '../components/Footer';
import { HeroParallax } from '../components/HeroParallax';
import { MorphingSvgFilters } from '@/components/MorphingLine';
import { TwoWordFocus } from '@/components/TrueFocus';

function Counter({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / (duration * 60));
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(id); }
      else setCount(start);
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [to, duration]);
  return <>{count}</>;
}

function Marquee() {
  const items = ["Video Production", "Motion Design", "Direction", "Cinematography", "Post\u2011Production", "Color Grading"];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid hsl(38 33% 57% / 0.08)", borderBottom: "1px solid hsl(38 33% 57% / 0.08)", padding: "14px 0" }}>
      <motion.div style={{ display: "flex", gap: 64, width: "max-content" }}
        animate={{ x: ["0%", "-50%"] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
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

function HoverVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { videoRef.current?.play().catch(() => {}); }, []);
  return (
    <video ref={videoRef} muted loop playsInline preload="none"
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
      src={src} />
  );
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  return <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "hsl(11 80% 57%)", zIndex: 9998 }} />;
}

// ✅ ProjectListItem — ottimizzato:
// - rimosso staggerChildren lettera per lettera (costoso)
// - mouse tracking con rAF throttle invece di ogni evento
// - useSpring solo per il video preview, non per il testo
function ProjectListItem({ project, index }: { project: (typeof PROJECTS)[0]; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Spring solo per il video preview — unico elemento che ne ha davvero bisogno
  const mx = useSpring(0, { stiffness: 200, damping: 25 });
  const my = useSpring(0, { stiffness: 200, damping: 25 });
  const videoTop  = useTransform(my, [-0.5, 0.5], ["40%", "60%"]);
  const videoLeft = useTransform(mx, [-0.5, 0.5], ["60%", "70%"]);

  // ✅ rAF throttle per mousemove — max 1 aggiornamento per frame
  const rafId = useRef<number | null>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (rafId.current) return; // skip se già schedulato
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const rect = linkRef.current?.getBoundingClientRect();
      if (!rect) return;
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    });
  };

  // ✅ IntersectionObserver — zero overhead durante lo scroll
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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 * (index % 5) }}
      style={{ position: "relative" }}
    >
      {/* Linea separatore */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 * (index % 5) }}
        style={{ transformOrigin: "left", position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "hsl(38 33% 57% / 0.12)" }}
      />

      <motion.a
        ref={linkRef}
        href={`/project/${project.id}`}
        onClick={() => sessionStorage.setItem('project_back', '/projects')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); mx.set(0); my.set(0); }}
        onMouseMove={handleMouseMove}
        className="group"
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 0", textDecoration: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32, position: "relative", zIndex: 10 }}>
          {/* ✅ Numero semplice — nessuna animazione AnimatePresence/popLayout */}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "hsl(38 33% 57%)", opacity: isHovered ? 0 : 0.2, letterSpacing: "0.1em", transition: "opacity 0.2s", minWidth: "2.2rem", display: "block" }}>
            {String(index + 1).padStart(2, "0")}
          </span>

          <div>
            {/* ✅ Titolo come blocco unico — niente stagger lettera per lettera */}
            <span
              style={{
                display: "block",
                fontFamily: "'Riking', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.3rem, 3.5vw, 2.1rem)",
                lineHeight: 1,
                color: isHovered ? "hsl(11 80% 57%)" : "hsl(38 33% 72%)",
                transform: isHovered ? "translateX(12px)" : "translateX(0px)",
                transition: "color 0.25s ease, transform 0.25s ease",
                position: "relative",
                zIndex: 10,
              }}
            >
              {project.title}
            </span>
            <span style={{ display: "block", marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.35 }}>
              {project.category}
            </span>
          </div>
        </div>

        {/* ✅ Video preview — spring solo qui dove serve morbidezza */}
        <motion.div
          style={{
            position: "absolute",
            top: videoTop,
            left: videoLeft,
            translateX: "-50%",
            translateY: "-50%",
            width: 256,
            height: 160,
            zIndex: 0,
            pointerEvents: "none",
            scale: isHovered ? 1 : 0,
            rotate: isHovered ? "12.5deg" : "-12.5deg",
            opacity: isHovered ? 1 : 0,
            transition: "scale 0.3s, rotate 0.3s, opacity 0.3s",
          }}
        >
          {isHovered && <HoverVideo src={project.video} />}
        </motion.div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 10 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "hsl(38 33% 57%)",
            letterSpacing: "0.15em",
            opacity: isHovered ? 1 : 0.25,
            transform: isHovered ? "translateX(0px)" : "translateX(6px)",
            transition: "opacity 0.25s, transform 0.25s",
          }}>
            {project.year}
          </span>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "hsl(11 80% 57%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateX(0%)" : "translateX(25%)",
            transition: "opacity 0.25s, transform 0.25s",
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </motion.a>
    </motion.li>
  );
}

const AllProjects = () => {
  const overlayRef   = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const listTitleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    gsap.set('body', { overflow: 'hidden' });
    const tl = gsap.timeline();
    tl.to(overlayRef.current, { y: '-100%', duration: 1.1, ease: 'power4.inOut' });
    tl.call(() => {
      gsap.set('body', { overflow: 'auto', clearProps: 'overflow' });
      window.scrollTo(0, 0);
    });
    return () => { tl.kill(); gsap.set('body', { overflow: 'auto', clearProps: 'all' }); };
  }, []);

  const headline = (
    <div>
      <MorphingSvgFilters />
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.45, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
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
      <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: "hsl(38 33% 57%)", opacity: 0.4, marginTop: 28, maxWidth: 340, lineHeight: 1.7 }}>
        A curated collection of projects spanning video production, motion design, and visual direction.
      </motion.p>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 10, background: "#000000", minHeight: "100vh" }}>
        <ScrollProgressBar />
        <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ background: "hsl(11 80% 57%)" }} />

        <motion.div className="fixed left-6 top-8 z-50 lg:left-12"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.5 }}>
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

        <div style={{ background: "#000000" }}>
          <div style={{ padding: "40px 48px 32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid hsl(38 33% 57% / 0.06)" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.3, marginBottom: 12 }}>Full archive</span>
              <h2 ref={listTitleRef} className="relative" style={{ lineHeight: 1, margin: 0 }} data-cursor="big">
                <TwoWordFocus word0="All" word1="Works."
                  fontSize="clamp(1.3rem, 3.2vw, 2.4rem)" animationDuration={0.9} focusPause={2800}
                  borderColor="rgb(235, 89, 57)" glowColor="rgba(235, 89, 57, 0.55)"
                  blurAmount={4} frameAnchorRef={listTitleRef} />
              </h2>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 4rem)", color: "hsl(11 80% 57%)", lineHeight: 1, opacity: 0.25 }}>
                <Counter to={PROJECTS.length} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: "hsl(38 33% 57%)", opacity: 0.25 }}>works</span>
            </motion.div>
          </div>

          <ul style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 120px", listStyle: "none" }}>
            {PROJECTS.map((project, index) => (
              <ProjectListItem key={project.id} project={project} index={index} />
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AllProjects;
