import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MagneticWrapper } from "./Magnetic";
import "../PillNav.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PillNavItem {
  label: string;
  href: string;
}

// ─── NavAnimated ──────────────────────────────────────────────────────────────

function NavAnimated({
  children,
  delay = 0,
  distance = 30,
  scale = 0.85,
  duration = 0.55,
  ease = "power3.out",
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  scale?: number;
  duration?: number;
  ease?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { opacity: 0, y: distance, scale, visibility: "visible" });
    const tl = gsap.timeline({ delay });
    tl.to(el, { opacity: 1, y: 0, scale: 1, duration, ease });
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={ref} style={{ visibility: "hidden" }}>
      {children}
    </div>
  );
}

const NAV_ITEMS: PillNavItem[] = [
  { label: "About",     href: "#about" },
  { label: "Work",      href: "#projects" },
  { label: "Projects",  href: "#viewallprojects" },
  { label: "Education", href: "#education" },
  { label: "Contact",   href: "#contact" },
];

// ─── PillNav ──────────────────────────────────────────────────────────────────

function PillNav({ items, activeHref }: { items: PillNavItem[]; activeHref?: string }) {
  const circleRefs    = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs        = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweens  = useRef<(gsap.core.Tween | null)[]>([]);
  const hamburgerRef  = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navItemsRef   = useRef<HTMLDivElement>(null);
  const logoImgRef    = useRef<HTMLImageElement>(null);
  const ease          = "power3.out";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── hover-circle layout ───────────────────────────────────────────────────
  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle) return;
        const pill = circle.closest("button.pill") as HTMLElement | null;
        if (!pill) return;
        const { width: w, height: h } = pill.getBoundingClientRect();
        if (w === 0 || h === 0) return;
        const R       = ((w * w) / 4 + h * h) / (2 * h);
        const D       = Math.ceil(2 * R) + 2;
        const delta   = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width  = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector(".pill-label");
        const hover = pill.querySelector(".pill-label-hover");
        if (label) gsap.set(label, { y: 0 });
        if (hover) gsap.set(hover, { y: h + 12, opacity: 0 });

        const idx = circleRefs.current.indexOf(circle);
        if (idx === -1) return;

        tlRefs.current[idx]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        if (hover) {
          gsap.set(hover, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(hover, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0);
        }
        tlRefs.current[idx] = tl;
      });
    };

    const initTimer = window.setTimeout(layout, 1150);
    window.addEventListener("resize", layout);
    document.fonts?.ready.then(() => window.setTimeout(layout, 1150)).catch(() => {});

    const menu = mobileMenuRef.current;
    if (menu) gsap.set(menu, { visibility: "hidden", opacity: 0 });

    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener("resize", layout);
    };
  }, [items]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweens.current[i]?.kill();
    activeTweens.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: "auto" });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweens.current[i]?.kill();
    activeTweens.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: "auto" });
  };

  const scrollTo = (href: string) => {
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogoHover = () => {
    const img = logoImgRef.current;
    if (!img) return;
    gsap.set(img, { rotate: 0 });
    gsap.to(img, { rotate: 360, duration: 0.45, ease, overwrite: "auto" });
  };

  const toggleMobileMenu = () => {
    const next      = !isMobileMenuOpen;
    const hamburger = hamburgerRef.current;
    const menu      = mobileMenuRef.current;
    setIsMobileMenuOpen(next);

    if (hamburger) {
      const lines = hamburger.querySelectorAll<HTMLSpanElement>(".hamburger-line");
      if (next) {
        gsap.to(lines[0], { rotation: 45,  y:  3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (next) {
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(menu, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease });
      } else {
        gsap.to(menu, {
          opacity: 0, y: 10, duration: 0.2, ease,
          onComplete: () => gsap.set(menu, { visibility: "hidden" }),
        });
      }
    }
  };

  const cssVars = {
    "--base":       "transparent",
    "--pill-bg":    "transparent",
    "--hover-text": "hsl(240 10% 5%)",
    "--pill-text":  "hsl(38 33% 57%)",
  } as React.CSSProperties;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="pill-nav-container">
      <nav className="pill-nav" aria-label="Primary" style={cssVars}>

        {/* Logo magnetico */}
        <NavAnimated delay={0.1} distance={40} scale={0.6} duration={0.7} ease="back.out(1.8)">
          <MagneticWrapper strength={0.3} rotateStrength={0.04}>
            <button
              className="pill-logo"
              onClick={() => scrollTo("#hero")}
              onMouseEnter={handleLogoHover}
              aria-label="Home"
              data-cursor="medium"
            >
              <img ref={logoImgRef} src="/logo/favicon.webp" alt="Logo" />
            </button>
          </MagneticWrapper>
        </NavAnimated>

        {/* Desktop pills */}
        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => (
              <li key={item.href} role="none">
                <NavAnimated delay={0.2 + i * 0.08} distance={30} scale={0.85}>
                  <button
                    role="menuitem"
                    onClick={() => scrollTo(item.href)}
                    className={`pill${activeHref === item.href ? " is-active" : ""}`}
                    data-cursor="hide"
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={(el) => { circleRefs.current[i] = el; }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
                    </span>
                  </button>
                </NavAnimated>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
          data-cursor="hide"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

      </nav>

      {/* Mobile popover */}
      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item) => (
            <li key={item.href}>
              <button
                className={`mobile-menu-link w-full text-left${activeHref === item.href ? " is-active" : ""}`}
                onClick={() => { scrollTo(item.href); setIsMobileMenuOpen(false); }}
                data-cursor="hide"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [activeHref, setActiveHref] = useState<string>("#about");

  useEffect(() => {
    const onScroll = () => {
      let current = "#about";
      NAV_ITEMS.forEach(({ href }) => {
        const el = document.getElementById(href.slice(1));
        if (el && window.scrollY >= el.offsetTop - window.innerHeight / 3) {
          current = href;
        }
      });
      setActiveHref(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <PillNav items={NAV_ITEMS} activeHref={activeHref} />;
};

export default Navbar;
