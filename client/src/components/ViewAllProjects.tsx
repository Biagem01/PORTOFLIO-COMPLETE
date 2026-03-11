import { motion } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { InlineTrueFocus } from "./TrueFocus";

interface NeuBrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

function NeuBrutalButton({ children, className, ...props }: NeuBrutalButtonProps) {
  return (
    <button
      {...props}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      className={cn(
        "group/button rounded-[0.75em]",
        "bg-[hsl(38,28%,57%)]",
        className
      )}
    >
      <span
        className={cn(
          "block rounded-[0.75em]",
          "border-2 border-[hsl(38,28%,45%)]",
          "bg-[hsl(11,80%,57%)]",
          "px-10 py-4",
          "text-sm font-bold tracking-[0.12em] uppercase text-black",
          "-translate-x-[3px] -translate-y-[3px]",
          "transition-transform duration-150 ease-out",
          "group-hover/button:-translate-x-[5px] group-hover/button:-translate-y-[5px]",
          "group-active/button:translate-x-0 group-active/button:translate-y-0"
        )}
      >
        {children}
      </span>
    </button>
  );
}

export default function ViewAllProjects() {
  return (
    <section className="relative bg-black overflow-hidden py-32">
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent"
        initial={{ opacity: 0, x: -150 }}
        whileInView={{ opacity: 0.15, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
        <motion.p
          data-cursor="big"
          className="text-sm uppercase tracking-[0.3em] text-foreground/50"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Explore more
        </motion.p>

        <motion.h3
          data-cursor="big"
          className="relative text-[2.55rem] md:text-[3.57rem] tracking-tight leading-[1.3] mt-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <InlineTrueFocus
            words={["VUOI", "VEDERE", "TUTTI I", "PROGETTI"]}
            lineBreakAfter={1}
            fontSize="inherit"
            animationDuration={0.9}
            focusPause={3500}
            borderColor="rgb(235, 89, 57)"
            glowColor="rgba(235, 89, 57, 0.55)"
            blurAmount={4}
          />
          <span className="font-white" style={{ color: 'hsl(38 28% 57%)' }}>?</span>
        </motion.h3>

        <motion.p
          data-cursor="big"
          className="text-sm md:text-base font-light text-foreground/50 max-w-2xl mt-8 leading-relaxed font-button"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Immergiti nella mia collezione completa di progetti, casi studio
          e concept personali sviluppati con passione.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mt-16"
          data-cursor="hide"
        >
          <Link
            to="/projects"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              if (window.history.scrollRestoration) {
                window.history.scrollRestoration = "manual";
              }
            }}
          >
            <NeuBrutalButton>
              VEDI TUTTI I PROGETTI
            </NeuBrutalButton>
          </Link>

          <motion.div
            className="absolute -z-10 top-1/2 left-1/2 w-56 h-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: "hsl(11 80% 57% / 0.08)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
