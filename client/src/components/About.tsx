/**
 * About.tsx — World-class edition
 *
 * Features:
 * • Scroll-velocity skew: text skews during fast scroll, snaps back with inertia
 * • 3-layer parallax: bg accent / statement text / sidebar label
 * • Vertical progress bar (Locomotive-style) fixed to left edge
 * • Animated counters that accelerate with scroll velocity
 * • Cursor-magnetic "ABOUT" letters (elastic follow → return)
 * • Badge reveal at mid-sentence, not end
 * • FlowingMenu rows fly in from below with GSAP stagger
 * • Grain texture overlay for depth
 */

import { useEffect, useRef, useState, useCallback } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useMotionValue,
  animate,
} from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import FlowingMenu from "./FlowingMenu"

gsap.registerPlugin(ScrollTrigger)

/* ─── types ──────────────────────────────────────────────────────────────── */
type BadgeRef = HTMLSpanElement & { __setProgress?: (p: number) => void }
type DropCharRef = HTMLSpanElement & { __setProgress?: (p: number) => void }

/* ─── constants ──────────────────────────────────────────────────────────── */
const skillItems = [
  { link: "#", text: "HTML" },
  { link: "#", text: "CSS" },
  { link: "#", text: "TypeScript" },
  { link: "#", text: "JavaScript" },
  { link: "#", text: "React" },
  { link: "#", text: "Node.js || Express.js" },
  { link: "#", text: "PHP" },
  { link: "#", text: "MySQL" },
  { link: "#", text: "Git" },
  { link: "#", text: "Responsive Design" },
]

const STATS = [
  { value: 2,   suffix: "+", label: "Years building" },
  { value: 15,  suffix: "",  label: "Projects shipped" },
  { value: 100, suffix: "%", label: "Design fidelity" },
]

const SEG1 = "I design and build digital "
const SEG2 = " that are "
const SEG3 = " and intentional."
const FONT_SIZE = "clamp(1.7rem, 3.8vw, 4.2rem)"

/* ─── ScrollDropText ─────────────────────────────────────────────────────── */
function ScrollDropText({
  text, globalStart, globalEnd, charRefsCollector,
}: {
  text: string
  globalStart: number
  globalEnd: number
  charRefsCollector: React.MutableRefObject<Array<DropCharRef | null>>
}) {
  const chars = text.split("")
  const n = chars.length
  const span = globalEnd - globalStart
  const charWindow = span * 0.18

  return (
    <>
      {chars.map((char, i) => {
        const start = globalStart + (i / n) * span * 0.82
        const end = start + charWindow
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <span
              ref={el => {
                charRefsCollector.current.push(el as DropCharRef | null)
                if (el) {
                  ;(el as HTMLSpanElement).style.transform = "translateY(-110%)"
                  ;(el as HTMLSpanElement).style.opacity = "0"
                  ;(el as DropCharRef).__setProgress = (progress: number) => {
                    const rawT = (progress - start) / (end - start)
                    const t = Math.max(0, Math.min(1, rawT))
                    const e =
                      t === 0 ? 0 : t === 1 ? 1
                        : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1
                    ;(el as HTMLSpanElement).style.transform = `translateY(${(1 - e) * -110}%)`
                    ;(el as HTMLSpanElement).style.opacity = String(Math.min(1, e * 1.5))
                    ;(el as HTMLSpanElement).style.color =
                      e > 0.3
                        ? `hsl(38 28% ${(35 + ((e - 0.3) / 0.7) * 22).toFixed(1)}%)`
                        : `rgba(255,255,255,${e * 0.5})`
                  }
                }
              }}
              style={{ display: "inline-block", willChange: "transform, opacity" }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        )
      })}
    </>
  )
}

/* ─── AnimatedBadge ──────────────────────────────────────────────────────── */
function AnimatedBadge({
  rotateTexts, triggerRef, triggerProgress,
}: {
  rotateTexts: string[]
  triggerRef: React.RefObject<BadgeRef>
  triggerProgress: number
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const triggered = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return
    const badgeEl = el as BadgeRef
    ;(triggerRef as React.MutableRefObject<BadgeRef | null>).current = badgeEl
    badgeEl.__setProgress = (progress: number) => {
      if (progress >= triggerProgress && !triggered.current) {
        triggered.current = true
        setRevealed(true)
      }
      if (progress < triggerProgress - 0.04 && triggered.current) {
        triggered.current = false
        setRevealed(false)
        setIndex(0)
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      }
    }
  }, [triggerRef, triggerProgress])

  useEffect(() => {
    if (!revealed) return
    intervalRef.current = setInterval(() => setIndex(i => (i + 1) % rotateTexts.length), 2500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [revealed, rotateTexts.length])

  return (
    <motion.span
      ref={spanRef}
      animate={revealed ? { backgroundSize: "100% 100%" } : { backgroundSize: "0% 100%" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      style={{
        backgroundImage: "linear-gradient(hsl(var(--accent-orange)), hsl(var(--accent-orange)))",
        backgroundRepeat: "no-repeat", backgroundPosition: "left center", backgroundSize: "0% 100%",
        display: "inline-block", verticalAlign: "middle", borderRadius: "0.5rem", margin: "0 2px", position: "relative",
      }}
    >
      <motion.span
        layout
        transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }}
        className="font-orange uppercase tracking-tight rounded-lg inline-flex items-center overflow-hidden select-none"
        style={{ fontSize: FONT_SIZE, padding: "2px 10px", background: "transparent", color: "transparent" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${revealed ? "r" : "h"}-${index}`}
            initial={{ y: -40, filter: "blur(10px)", opacity: 1 }}
            animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block whitespace-nowrap"
            style={{ color: revealed ? "#000" : "transparent", transition: "color 0.1s ease" }}
          >
            {rotateTexts[index]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.span>
  )
}

/* ─── MagneticLetter ─────────────────────────────────────────────────────── */
function MagneticLetter({ char, index }: { char: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 180, damping: 18 })
  const springY = useSpring(y, { stiffness: 180, damping: 18 })

  const handleMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 80
    if (dist < maxDist) {
      const pull = (1 - dist / maxDist) * 22
      x.set(dx * pull / dist)
      y.set(dy * pull / dist)
    } else {
      x.set(0)
      y.set(0)
    }
  }, [x, y])

  useEffect(() => {
    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [handleMove])

  return (
    <motion.span
      ref={ref}
      style={{ x: springX, y: springY, display: "inline-block" }}
      className="font-button text-[9px] uppercase tracking-[0.55em]"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      {char}
    </motion.span>
  )
}

/* ─── AnimatedCounter ────────────────────────────────────────────────────── */
function AnimatedCounter({
  value, suffix, scrollVelocity,
}: {
  value: number
  suffix: string
  scrollVelocity: ReturnType<typeof useSpring>
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)
  const currentVal = useRef(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasStarted.current) {
          hasStarted.current = true
          const ctrl = animate(0, value, {
            duration: 1.8,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: v => {
              // Speed up counter when scrolling fast
              const vel = Math.abs(scrollVelocity.get())
              const boost = 1 + vel * 0.002
              currentVal.current = v * boost
              setDisplay(Math.min(Math.round(currentVal.current), value))
            },
            onComplete: () => setDisplay(value),
          })
          return () => ctrl.stop()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, scrollVelocity])

  return <div ref={ref}>{display}{suffix}</div>
}

/* ─── ScrollSkewWrapper ──────────────────────────────────────────────────── */
// Wraps children and applies skewY proportional to scroll velocity
function ScrollSkewWrapper({ children, className, style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const skewVel = useSpring(velocity, { stiffness: 400, damping: 90 })
  const skewY = useTransform(skewVel, [-3000, 0, 3000], ["-3deg", "0deg", "3deg"])

  return (
    <motion.div className={className} style={{ ...style, skewY }}>
      {children}
    </motion.div>
  )
}

/* ─── VerticalProgressBar ────────────────────────────────────────────────── */
function VerticalProgressBar({ sectionRef }: { sectionRef: React.RefObject<HTMLElement> }) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "end 20%"],
  })
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return (
    <div
      className="hidden lg:block"
      style={{
        position: "absolute",
        left: "1.5rem",
        top: "3rem",
        bottom: "3rem",
        width: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        zIndex: 20,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          scaleY,
          transformOrigin: "top",
          backgroundColor: "hsl(11 80% 57% / 0.7)",
          height: "100%",
        }}
      />
      {/* Section number */}
      <motion.span
        className="font-button text-[8px] uppercase tracking-[0.4em]"
        style={{
          position: "absolute",
          top: "50%",
          left: "1rem",
          color: "hsl(11 80% 57% / 0.5)",
          transform: "translateY(-50%) rotate(90deg)",
          transformOrigin: "center",
          whiteSpace: "nowrap",
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        01 — About
      </motion.span>
    </div>
  )
}

/* ─── About (main) ───────────────────────────────────────────────────────── */
const About = () => {
  const containerRef  = useRef<HTMLDivElement>(null)
  const sectionRef    = useRef<HTMLElement>(null)
  const badge1Ref     = useRef<BadgeRef>(null)
  const badge2Ref     = useRef<BadgeRef>(null)
  const dropCharRefs  = useRef<Array<DropCharRef | null>>([])
  const innerRefs     = useRef<Array<HTMLDivElement | null>>([])
  const stackGroupRef = useRef<HTMLDivElement>(null)

  // Scroll velocity for skew + counter boost
  const { scrollY } = useScroll()
  const rawVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(rawVelocity, { stiffness: 400, damping: 90 })

  // Parallax layers
  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const bgParallax   = useTransform(sectionProgress, [0, 1], ["0%", "-18%"])
  const textParallax = useTransform(sectionProgress, [0, 1], ["0%", "-6%"])

  // GSAP
  useEffect(() => {
    const init = () => {
      const ctx = gsap.context(() => {
        const pinned = containerRef.current?.querySelector(".pinned-statement")
        if (pinned) {
          const aboutLabel = pinned.querySelector<HTMLElement>(".about-label")
          if (aboutLabel) {
            aboutLabel.style.opacity   = "0"
            aboutLabel.style.transform = "translateY(20px)"
          }
          ScrollTrigger.create({
            trigger: pinned,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
            onUpdate(self) {
              if (aboutLabel) {
                const le = 1 - Math.pow(1 - Math.min(1, self.progress / 0.12), 3)
                aboutLabel.style.opacity   = String(le)
                aboutLabel.style.transform = `translateY(${(1 - le) * 20}px)`
              }
              dropCharRefs.current.forEach(el => el?.__setProgress?.(self.progress))
              badge1Ref.current?.__setProgress?.(self.progress)
              badge2Ref.current?.__setProgress?.(self.progress)
            },
          })
        }

        const inners = innerRefs.current.filter(Boolean) as HTMLDivElement[]
        const group  = stackGroupRef.current
        if (!group || inners.length === 0) return

        const vh = window.innerHeight
        gsap.set(inners, { y: vh, willChange: "transform" })
        gsap.to(inners, {
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: { each: 0.1, ease: "power2.out" },
          scrollTrigger: {
            trigger: group,
            start: "top 85%",
            end: "top 20%",
            toggleActions: "play none none reverse",
          },
        })

        ScrollTrigger.refresh()
      }, containerRef)
      return ctx
    }

    let ctx: gsap.Context
    const raf = requestAnimationFrame(() => { ctx = init() })
    return () => { cancelAnimationFrame(raf); ctx?.revert() }
  }, [])

  const titleChars = "[ About ]".split("")

  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* Grain texture */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <section
        ref={sectionRef}
        id="about"
        className="relative bg-black"
        style={{ zIndex: 10 }}
      >
        <VerticalProgressBar sectionRef={sectionRef} />

        {/* ── HERO STATEMENT ────────────────────────────────────────────── */}
        <div
          className="pinned-statement relative min-h-[90vh] flex flex-col justify-center overflow-hidden"
          style={{ paddingLeft: "clamp(3rem, 8vw, 8rem)", paddingRight: "clamp(1.5rem, 4vw, 4rem)", paddingTop: "7rem", paddingBottom: "7rem" }}
        >
          {/* Bg accent radial — parallaxed */}
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              y: bgParallax,
              background: "radial-gradient(ellipse 55% 45% at 70% 60%, rgba(235,89,57,0.035) 0%, transparent 68%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Horizontal rule top */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", top: "4rem", left: "clamp(3rem, 8vw, 8rem)", right: "2rem",
              height: 1, backgroundColor: "rgba(255,255,255,0.06)", transformOrigin: "left",
            }}
          />

          <div
            className="relative z-10 w-full"
            style={{ maxWidth: "min(1400px, 100%)" }}
          >

            {/* Magnetic title + sidebar label row */}
            <div className="flex items-end justify-between mb-10">
              <div className="flex" aria-label="[ About ]">
                {titleChars.map((c, i) => (
                  <MagneticLetter key={i} char={c === " " ? "\u00A0" : c} index={i} />
                ))}
              </div>

              {/* Asymmetric right label */}
              <motion.span
                className="hidden md:block font-button text-[8px] uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,255,255,0.12)" }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                Mindset — 2024
              </motion.span>
            </div>

            {/* Main grid: statement (9 cols) + sidebar (3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

              {/* Statement — scroll-skewed during fast scroll */}
              <div className="lg:col-span-9">
                <ScrollSkewWrapper>
                  <motion.p
                    style={{ fontSize: FONT_SIZE, y: textParallax }}
                    className="font-white uppercase leading-[1.1] tracking-tight"
                    data-cursor="big"
                  >
                    <ScrollDropText text={SEG1} globalStart={0.03} globalEnd={0.28} charRefsCollector={dropCharRefs} />
                    {/* Badge 1 fires at 0.22 — mid-sentence, not after */}
                    <AnimatedBadge
                      rotateTexts={["EXPERIENCES", "INTERFACES", "PRODUCTS", "STORIES"]}
                      triggerRef={badge1Ref}
                      triggerProgress={0.22}
                    />
                    <br className="hidden lg:block" />
                    <ScrollDropText text={SEG2} globalStart={0.28} globalEnd={0.42} charRefsCollector={dropCharRefs} />
                    {/* Badge 2 fires at 0.38 */}
                    <AnimatedBadge
                      rotateTexts={["SMOOTH", "CLEAN", "MINIMAL", "REFINED"]}
                      triggerRef={badge2Ref}
                      triggerProgress={0.38}
                    />
                    <ScrollDropText text={SEG3} globalStart={0.42} globalEnd={0.70} charRefsCollector={dropCharRefs} />
                  </motion.p>
                </ScrollSkewWrapper>
              </div>

              {/* Sidebar: label + counters */}
              <div className="lg:col-span-3 flex flex-col gap-8 lg:border-l lg:border-white/[0.06] lg:pl-8">

                <div className="about-label">
                  <span className="font-button text-[10px] uppercase tracking-[0.4em] text-primary block mb-1">
                    [ 01 — Overview ]
                  </span>
                  <span className="font-role text-lg text-white/30">The Mindset</span>
                </div>

                {/* Animated counters */}
                <div className="flex flex-col gap-6 mt-4">
                  {STATS.map((stat) => (
                    <div key={stat.label}>
                      <div
                        className="font-white text-white/90 leading-none"
                        style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                      >
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                          scrollVelocity={smoothVelocity}
                        />
                      </div>
                      <p className="font-button text-[8px] uppercase tracking-[0.35em] text-white/25 mt-1">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footnote */}
                <div
                  className="hidden lg:block mt-auto font-button text-[9px] uppercase tracking-[0.2em] leading-loose"
                  style={{ color: "rgba(255,255,255,0.14)" }}
                >
                  Engineering<br />fluid<br />experiences.
                </div>
              </div>
            </div>

            {/* Second row: bio text */}
            <div className="mt-16 lg:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="hidden lg:block lg:col-span-3" />
              <div className="lg:col-span-6 border-l border-white/[0.06] pl-6 md:pl-10 py-2">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ staggerChildren: 0.18, delayChildren: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {[
                    "I bridge the gap between aesthetics and functionality.",
                    "My focus is on writing clean, scalable code while delivering buttery-smooth micro-interactions that make users say \"wow\".",
                  ].map((line, i) => (
                    <div key={i} className="overflow-hidden">
                      <motion.p
                        variants={{
                          hidden: { y: "100%", opacity: 0 },
                          visible: { y: "0%", opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
                        }}
                        className="font-pencerio text-xs md:text-sm text-white/45 leading-[2] tracking-widest"
                      >
                        {line}
                      </motion.p>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="mt-10 flex items-center gap-4"
                >
                  <div className="h-[1px] w-8 bg-white/12" />
                  <span className="font-button text-[8px] uppercase tracking-[0.3em] text-white/18">
                    Explore Stack
                  </span>
                </motion.div>
              </div>

              {/* Right column: accent line + decorative text */}
              <div className="hidden lg:flex lg:col-span-3 flex-col items-end justify-end pb-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  style={{ textAlign: "right" }}
                >
                  <span
                    className="font-role block text-white/15"
                    style={{ fontSize: "clamp(3rem, 5vw, 5rem)", lineHeight: 1 }}
                  >
                    bc
                  </span>
                  <span className="font-button text-[7px] uppercase tracking-[0.5em] text-white/10 block mt-1">
                    biagio cubisino
                  </span>
                </motion.div>
              </div>
            </div>

          </div>
        </div>

        {/* ── STACK & TOOLS ────────────────────────────────────────────────── */}
        <div data-cursor="hide" className="bg-black">
          <div
            className="mx-auto px-6 md:px-10 mb-6 pt-12"
            style={{ maxWidth: "min(1400px, 100%)", paddingLeft: "clamp(3rem, 8vw, 8rem)" }}
          >
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: 24, height: 1, backgroundColor: "hsl(11 80% 57% / 0.5)", transformOrigin: "left" }}
              />
              <p className="font-button text-xs tracking-[0.35em] uppercase text-white/30">
                Stack & Tools
              </p>
            </div>
          </div>

          <div ref={stackGroupRef} style={{ overflow: "hidden" }}>
            {skillItems.map((item, i) => (
              <div key={item.text}>
                <div ref={el => { innerRefs.current[i] = el }}>
                  <FlowingMenu
                    items={[item]}
                    speed={14}
                    textColor="hsl(var(--scroll-indicator))"
                    bgColor="#000000"
                    marqueeBgColor="hsl(var(--accent-orange))"
                    marqueeTextColor="#000000"
                    borderColor="transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  )
}

export default About
