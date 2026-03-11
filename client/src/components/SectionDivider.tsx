import { motion } from "framer-motion";

const SectionDivider = () => {
  return (
    <div className="bg-black w-full py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 flex items-center gap-6"
      >
        <motion.div
          className="flex-1 h-px bg-white/10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: "left" }}
        />
        <p
          className="text-xs tracking-[0.35em] uppercase text-foreground/30 whitespace-nowrap"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Selected Works
        </p>
        <motion.div
          className="flex-1 h-px bg-white/10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: "right" }}
        />
      </motion.div>
    </div>
  );
};

export default SectionDivider;
