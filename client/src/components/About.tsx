import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import FlowingMenu from "./FlowingMenu"

gsap.registerPlugin(ScrollTrigger)

type BadgeRef = HTMLSpanElement & {
  __setProgress?: (progress: number) => void
}

// Tipo esteso per i char del drop
type DropCharRef = HTMLSpanElement & {
  __setProgress?: (progress: number) => void
}

const skillItems = [
  { link: "#", text: "React" },
  { link: "#", text: "TypeScript" },
  { link: "#", text: "Tailwind CSS" },
  { link: "#", text: "Framer Motion" },
  { link: "#", text: "Node.js" },
  { link: "#", text: "Figma" },
  { link: "#", text: "GSAP" },
  { link: "#", text: "Next.js" },
]

const SEG1 = "I design and build digital "
const SEG2 = " that are "
const SEG3 = " and intentional."
const LABEL_MUTED = "text-foreground/50"
const FONT_SIZE = "clamp(1.7rem, 3.8vw, 4.2rem)"

/* ─── ScrollDropChar ─────────────────────────────────────────────────────────
   Singolo carattere che cade dall'alto seguendo lo scroll progress GSAP.
   - startProgress: quando il char inizia a scendere (0–1)
   - endProgress:   quando il char è completamente a posto
────────────────────────────────────────────────────────────────────────────── */
function ScrollDropChar({
  char,
  startProgress,
  endProgress,
  progressRef,
}: {
  char: string
  startProgress: number
  endProgress: number
  progressRef: React.MutableRefObject<number>
}) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    // Stato iniziale: fuori dall'alto
    el.style.transform = "translateY(-110%)"
    el.style.opacity = "0"
    el.style.transition = "none"

    // Funzione di aggiornamento chiamata da GSAP ScrollTrigger
    const update = (progress: number) => {
      const rawT = (progress - startProgress) / (endProgress - startProgress)
      const t = Math.max(0, Math.min(1, rawT))

      // Easing elastico (spring-like) — identico a quello dei badge
      const e =
        t === 0 ? 0
        : t === 1 ? 1
        : Math.pow(2, -10 * t) *
          Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1

      el.style.transform = `translateY(${(1 - e) * -110}%)`
      el.style.opacity = String(Math.min(1, e * 1.5))
    }

    // Registra la funzione update sull'elemento
    ;(el as DropCharRef).__setProgress = update

    return () => {
      ;(el as DropCharRef).__setProgress = undefined
    }
  }, [startProgress, endProgress])

  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "top",
      }}
    >
      <span
        ref={spanRef}
        style={{
          display: "inline-block",
          willChange: "transform, opacity",
        }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    </span>
  )
}

/* ─── ScrollDropText ─────────────────────────────────────────────────────────
   Wrappa un testo e restituisce un array di ScrollDropChar con
   timing scaglionati. Accumula i ref per aggiornamento da GSAP.
────────────────────────────────────────────────────────────────────────────── */
function ScrollDropText({
  text,
  globalStart,   // progress globale in cui il primo char inizia
  globalEnd,     // progress globale in cui l'ultimo char finisce
  charRefsCollector, // array condiviso dove depositare i ref
}: {
  text: string
  globalStart: number
  globalEnd: number
  charRefsCollector: React.MutableRefObject<Array<DropCharRef | null>>
}) {
  const chars = text.split("")
  const n = chars.length
  const span = globalEnd - globalStart
  const charWindow = span * 0.18 // finestra di animazione per ogni char

  return (
    <>
      {chars.map((char, i) => {
        const start = globalStart + (i / n) * span * 0.82
        const end = start + charWindow

        return (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}
          >
            <span
              ref={(el) => {
                charRefsCollector.current.push(el as DropCharRef | null)
                if (el) {
                  // Stato iniziale
                  ;(el as HTMLSpanElement).style.transform = "translateY(-110%)"
                  ;(el as HTMLSpanElement).style.opacity = "0"

                  // Attacca la funzione di update
                  ;(el as DropCharRef).__setProgress = (progress: number) => {
                    const rawT = (progress - start) / (end - start)
                    const t = Math.max(0, Math.min(1, rawT))

                    // Easing elastico
                    const e =
                      t === 0 ? 0
                      : t === 1 ? 1
                      : Math.pow(2, -10 * t) *
                        Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1

                    ;(el as HTMLSpanElement).style.transform = `translateY(${(1 - e) * -110}%)`
                    ;(el as HTMLSpanElement).style.opacity = String(Math.min(1, e * 1.5))

                    // Colore oro identico all'originale: parte trasparente, diventa oro caldo
                    ;(el as HTMLSpanElement).style.color =
                      e > 0.3
                        ? `hsl(38 28% ${(35 + ((e - 0.3) / 0.7) * 22).toFixed(1)}%)`
                        : `rgba(255,255,255,${e * 0.5})`
                  }
                }
              }}
              style={{
                display: "inline-block",
                willChange: "transform, opacity",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        )
      })}
    </>
  )
}

/* ─── AnimatedBadge ──────────────────────────────────────────────────────────
   (invariato rispetto all'originale)
────────────────────────────────────────────────────────────────────────────── */
function AnimatedBadge({
  rotateTexts,
  triggerRef,
  triggerProgress,
}: {
  rotateTexts: string[]
  triggerRef: React.RefObject<BadgeRef>
  triggerProgress: number
}) {
  const [index, setIndex]       = useState(0)
  const [revealed, setRevealed] = useState(false)
  const spanRef                 = useRef<HTMLSpanElement>(null)
  const triggered               = useRef(false)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)

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
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [triggerRef, triggerProgress])

  useEffect(() => {
    if (!revealed) return
    intervalRef.current = setInterval(
      () => setIndex(i => (i + 1) % rotateTexts.length),
      2500
    )
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [revealed, rotateTexts.length])

  return (
    <motion.span
      ref={spanRef}
      animate={revealed ? { backgroundSize: "100% 100%" } : { backgroundSize: "0% 100%" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundImage: "linear-gradient(hsl(var(--accent-orange)), hsl(var(--accent-orange)))",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        backgroundSize: "0% 100%",
        display: "inline-block",
        verticalAlign: "middle",
        borderRadius: "0.5rem",
        margin: "0 2px",
        position: "relative",
      }}
    >
      <motion.span
        layout
        transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        className="font-orange uppercase tracking-tight rounded-lg inline-flex items-center overflow-hidden select-none"
        style={{
          fontSize: FONT_SIZE,
          padding: "2px 10px",
          background: "transparent",
          color: "transparent",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${revealed ? "r" : "h"}-${index}`}
            initial={{ y: -40, filter: "blur(10px)", opacity: 1 }}
            animate={{ y: 0,   filter: "blur(0px)",  opacity: 1 }}
            exit={{   y: 50,   filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block whitespace-nowrap"
            style={{
              color: revealed ? "#000" : "transparent",
              transition: "color 0.1s ease",
            }}
          >
            {rotateTexts[index]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.span>
  )
}

/* ─── About ──────────────────────────────────────────────────────────────── */
const About = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const badge1Ref    = useRef<BadgeRef>(null)
  const badge2Ref    = useRef<BadgeRef>(null)

  // Ref array per raccogliere tutti i char del drop text
  const dropCharRefs = useRef<Array<DropCharRef | null>>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const pinned = containerRef.current?.querySelector(".pinned-statement")
      if (!pinned) return

      const aboutLabel = pinned.querySelector<HTMLElement>(".about-label")
      if (aboutLabel) {
        aboutLabel.style.opacity   = "0"
        aboutLabel.style.transform = "translateY(20px)"
      }

      ScrollTrigger.create({
        trigger: pinned,
        start: "top 90%",
        end: "bottom 20%",
        scrub: true,
        onUpdate(self) {
          // About label fade-in
          if (aboutLabel) {
            const le = 1 - Math.pow(1 - Math.min(1, self.progress / 0.12), 3)
            aboutLabel.style.opacity   = String(le)
            aboutLabel.style.transform = `translateY(${(1 - le) * 20}px)`
          }

          // Aggiorna tutti i drop chars (SEG1, SEG2, SEG3)
          dropCharRefs.current.forEach((el) => {
            if (el?.__setProgress) el.__setProgress(self.progress)
          })

          // Aggiorna i badge
          badge1Ref.current?.__setProgress?.(self.progress)
          badge2Ref.current?.__setProgress?.(self.progress)
        },
      })

      ScrollTrigger.refresh()
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <section id="about" className="relative z-10 bg-black">
        <motion.section
          initial={{ scale: 0.92, rotate: 4, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="pinned-statement relative min-h-[70vh] flex items-center justify-center px-8 lg:px-24 bg-black origin-top overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none z-20"
            style={{ background: "linear-gradient(to bottom, #000000, transparent)" }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(235,89,57,0.04) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-[1100px] w-full relative z-10 py-12">
            <div className="overflow-hidden mb-10">
              <div className="about-label flex items-center gap-6">
                <span className="font-button text-[9px] uppercase tracking-[0.6em] text-primary/40">
                  — About
                </span>
                <div className="h-[1px] w-16 bg-primary/20" />
                <span className="font-button text-[9px] uppercase tracking-[0.4em] text-white/15">
                  Me
                </span>
              </div>
            </div>

            <p
              className="font-white uppercase leading-[1.35] tracking-tight"
              style={{ fontSize: FONT_SIZE }}
              data-cursor="big"
            >
              {/* SEG1: drop chars 0.03 → 0.30 */}
              <ScrollDropText
                text={SEG1}
                globalStart={0.03}
                globalEnd={0.30}
                charRefsCollector={dropCharRefs}
              />

              <AnimatedBadge
                rotateTexts={["EXPERIENCES", "INTERFACES", "PRODUCTS", "STORIES"]}
                triggerRef={badge1Ref}
                triggerProgress={0.34}
              />

              {/* SEG2: drop chars 0.30 → 0.44 */}
              <ScrollDropText
                text={SEG2}
                globalStart={0.30}
                globalEnd={0.44}
                charRefsCollector={dropCharRefs}
              />

              <AnimatedBadge
                rotateTexts={["SMOOTH", "CLEAN", "MINIMAL", "REFINED"]}
                triggerRef={badge2Ref}
                triggerProgress={0.47}
              />

              {/* SEG3: drop chars 0.47 → 0.72 */}
              <ScrollDropText
                text={SEG3}
                globalStart={0.47}
                globalEnd={0.72}
                charRefsCollector={dropCharRefs}
              />
            </p>

            <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2">
              <div className="w-[1px] h-14 bg-white/[0.06]" />
              <span
                className="font-button text-[8px] tracking-[0.4em] text-white/10"
                style={{ writingMode: "vertical-rl" }}
              >
                scroll to read
              </span>
            </div>
          </div>

          <div
            className="absolute right-4 bottom-4 font-white uppercase leading-none select-none pointer-events-none"
            style={{ fontSize: "22vw", color: "rgba(235,89,57,0.035)" }}
          >
            01
          </div>
        </motion.section>

        {/* STACK & TOOLS */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          data-cursor="hide"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 mb-6 pt-8">
            <motion.p
              className={`font-white text-xs md:text-sm tracking-[0.25em] uppercase ${LABEL_MUTED}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5 }}
              data-cursor="big"
            >
              Stack & Tools
            </motion.p>
          </div>
          <div style={{ height: "560px" }}>
            <FlowingMenu
              items={skillItems}
              speed={14}
              textColor="hsl(var(--scroll-indicator))"
              bgColor="#000000"
              marqueeBgColor="hsl(var(--accent-orange))"
              marqueeTextColor="#000000"
              borderColor="transparent"
            />
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default About
