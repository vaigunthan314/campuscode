import { useState, useEffect } from "react";
import { IntroShell } from "./components/IntroShell";
import { scrollToSection } from "./components/scrollToSection";
import {
  Community,
  Experience,
  Footer,
  Hackathons,
  HowItWorks,
  JoinCTA,
  Marquee,
  Mission,
  AboutStage,
} from "./components/Sections";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export default function App() {
  const reducedMotion = useReducedMotion();

  // In-page anchors (skip link, footer) must resolve against pinned sections.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;

      const id = decodeURIComponent((link.getAttribute("href") ?? "").slice(1));
      if (!id || !document.getElementById(id)) return;

      event.preventDefault();
      scrollToSection(id);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="campus-landing" id="top">
      <a className="skip-link" href="#about">
        SKIP INTRO
      </a>
      {/*
        IntroShell renders CinematicIntro which internally renders Hero
        inside .hero-window. Do NOT render a standalone <Hero> here —
        that would create a duplicate hero outside the cinematic sequence.
      */}
      <IntroShell reducedMotion={reducedMotion} />
      <main>
        <Marquee />
        {/*
          Without the pin (reduced motion) the cinematic stage cannot reveal the
          About page, so it is rendered in normal flow instead. The stage is the
          only other place it renders — never both at once.
        */}
        <Experience />
        <HowItWorks />
        <Hackathons />
        <Mission />
        <Community />
        <JoinCTA />
      </main>
      <Footer />
    </div>
  );
}
