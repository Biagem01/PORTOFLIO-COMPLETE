import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import { Projects } from "@/components/Projects";
import SectionDivider from "@/components/SectionDivider";
import ViewAllProjects from "@/components/ViewAllProjects";
import Education from "@/components/Education";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingSocials from "@/components/FloatingSocials";

/*
 * Hero ha h-[200vh].
 * heroOpacity inizia a sparire a scrollYProgress 0.55 = 110vh dal top.
 * marginTop: "-90vh" → l'About sale fino a quota 110vh,
 * esattamente dove la Hero comincia il fade out.
 * La Hero sticky con bg-black copre l'About finché è opaca —
 * zero spazio nero visibile tra le due sezioni.
 *
 * STICKY FOOTER PATTERN (Fancy Components):
 * Tutto il contenuto è in un div z-10.
 * Il Footer è FUORI da quel div, con sticky + bottom:0 + z-0.
 * Mentre scrolli oltre il Contact, il contenuto sale e il Footer
 * emerge da sotto — come nel pattern originale.
 */

const Index = () => {
  const [location] = useLocation();

  return (
    <div className="relative">

      {/* ── Tutto il contenuto sopra il footer ── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <FloatingSocials />

        <div id="hero">
          <Hero />
        </div>

        <div id="about" style={{ marginTop: "-90vh" }}>
          <About />
        </div>

        <SectionDivider />

        <div id="projects">
          <Projects />
        </div>
        <div id="viewallprojects">
          <ViewAllProjects />
        </div>
        <div id="education">
          <Education key={location} />
        </div>
        <div id="contact">
          <Contact />
        </div>
      </div>

      {/* ── Footer sticky z-0: rimane sotto, emerge quando il contenuto finisce ── */}
      <Footer />

    </div>
  );
};

export default Index;
