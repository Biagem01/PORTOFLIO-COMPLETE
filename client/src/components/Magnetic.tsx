import { motion, useMotionValue, useSpring } from "framer-motion";

export function MagneticWrapper({
  children,
  strength = 0.35,
  rotateStrength = 0.04,
}: {
  children: React.ReactNode;
  strength?: number;
  rotateStrength?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 180, damping: 14 });
  const springY = useSpring(y, { stiffness: 180, damping: 14 });
  const springRotate = useSpring(rotate, { stiffness: 120, damping: 16 });

  return (
    <motion.div
      className="cursor-none inline-block"
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);

        x.set(offsetX * strength);
        y.set(offsetY * strength);
        rotate.set(offsetX * rotateStrength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        rotate.set(0);
      }}
      style={{
        x: springX,
        y: springY,
        rotate: springRotate,
      }}
    >
      {children}
    </motion.div>
  );
}