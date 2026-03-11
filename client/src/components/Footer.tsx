import { MagneticWrapper } from './Magnetic';
import { motion } from 'framer-motion';

const SOCIALS = [
  { label: 'LinkedIn',  href: '#' },
  { label: 'Twitter',   href: '#' },
  { label: 'Dribbble',  href: '#' },
  { label: 'Instagram', href: '#' },
];

export const Footer = () => {
  return (
    <footer
      style={{
        position: 'relative',
        width: '100%',
        height: '22rem',
        backgroundColor: '#000000',
      }}
    >
      <div style={{ width: '100%', height: '1px', backgroundColor: 'hsl(38 33% 57% / 0.08)' }} />
      <div
        style={{
          position: 'relative', width: '100%', height: '100%',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '2.5rem 3.5rem 2rem',
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-8" style={{ position: 'relative', zIndex: 10 }}>
          <MagneticWrapper>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative px-4 py-2 cursor-pointer flex flex-col items-start"
              data-cursor="hide"
            >
              <span className="relative z-10 font-button text-[9px] uppercase tracking-[0.45em] text-white/30 mb-2">Portfolio</span>
              <span className="relative z-10 tracking-tight transition-colors duration-500 group-hover:text-black"
                style={{ fontFamily: "'Riking', sans-serif", fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', color: 'hsl(38 33% 72%)' }}>
                Biagio Cubisino
              </span>
              <span className="relative z-10 font-button text-[9px] uppercase tracking-[0.3em] mt-1 transition-colors duration-500 group-hover:text-black"
                style={{ color: 'hsl(38 33% 57% / 0.5)' }}>
                Visual Director
              </span>
              <div className="absolute inset-0 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom rounded-sm"
                style={{ backgroundColor: 'hsl(11,80%,57%)' }} />
            </motion.div>
          </MagneticWrapper>

          <div className="flex gap-2 flex-wrap">
            {SOCIALS.map((s, i) => (
              <MagneticWrapper key={s.label}>
                <motion.a href={s.href} data-cursor="hide"
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group relative px-5 py-3"
                >
                  <span className="relative z-10 font-button text-[9px] uppercase tracking-[0.3em] transition-colors duration-500 group-hover:text-black"
                    style={{ color: 'hsl(38 33% 57% / 0.6)' }}>
                    {s.label}
                  </span>
                  <div className="absolute inset-0 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom rounded-sm"
                    style={{ backgroundColor: 'hsl(11,80%,57%)' }} />
                </motion.a>
              </MagneticWrapper>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4"
          style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
          <span className="font-button text-[8px] uppercase tracking-[0.35em]" style={{ color: 'hsl(38 33% 57% / 0.3)' }}>
            © {new Date().getFullYear()} Biagio Cubisino — All rights reserved
          </span>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms'].map((link) => (
              <a key={link} href="#"
                className="font-button text-[8px] uppercase tracking-[0.3em] transition-colors duration-300 hover:text-white"
                style={{ color: 'hsl(38 33% 57% / 0.3)' }}>
                {link}
              </a>
            ))}
          </div>
        </div>

        <span className="select-none pointer-events-none leading-none uppercase"
          style={{
            position: 'absolute', bottom: 0, left: 0, transform: 'translateY(28%)',
            fontFamily: "'Riking', sans-serif", fontSize: 'clamp(4rem, 14vw, 12rem)',
            color: 'hsl(11,80%,57%)', opacity: 0.07, whiteSpace: 'nowrap', zIndex: 0,
          }}>
          biagio cubisino
        </span>
      </div>
    </footer>
  );
};

export default Footer;
