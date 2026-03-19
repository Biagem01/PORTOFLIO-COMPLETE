import { motion, useMotionValue, useSpring } from "framer-motion";
import { Linkedin, Instagram, Github } from "lucide-react";

const socials = [
  {
    icon: <Linkedin size={20} aria-hidden="true" />,
    href: "https://linkedin.com",
    label: "LinkedIn di Biagio Cubisino",
  },
  {
    icon: <Instagram size={20} aria-hidden="true" />,
    href: "https://instagram.com",
    label: "Instagram di Biagio Cubisino",
  },
  {
    icon: <Github size={20} aria-hidden="true" />,
    href: "https://github.com",
    label: "GitHub di Biagio Cubisino",
  },
];

export default function FloatingSocials() {
  return (
    <div className="fixed bottom-10 left-10 z-[2000] flex items-center gap-8">

      {/* LINEA */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "110px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-[1px] bg-[hsl(var(--scroll-indicator))]/40"
      />

      {/* ICONS */}
      <div className="flex flex-col gap-8">
        {socials.map((social, i) => (
          <MagneticIcon key={i} href={social.href} label={social.label}>
            {social.icon}
          </MagneticIcon>
        ))}
      </div>

    </div>
  );
}

/* ─── MagneticIcon ───────────────────────────────────────────────────────── */
function MagneticIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);

  const springX      = useSpring(x,      { stiffness: 180, damping: 12 });
  const springY      = useSpring(y,      { stiffness: 180, damping: 12 });
  const springRotate = useSpring(rotate, { stiffness: 120, damping: 14 });

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      /* ✅ aria-label descrive la destinazione per screen reader
         Risolve: "Links do not have a discernible name" (Lighthouse Accessibility) */
      aria-label={label}
      className="
        text-[hsl(var(--scroll-indicator))]
        cursor-none
        transition-opacity
        opacity-80
        hover:opacity-100
        relative block
        w-[28px] h-[28px]
      "
      onMouseMove={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);
        x.set(offsetX * 1.1);
        y.set(offsetY * 1.1);
        rotate.set(offsetX * 0.08);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        rotate.set(0);
      }}
      style={{ x: springX, y: springY, rotate: springRotate }}
    >
      {children}
    </motion.a>
  );
}
