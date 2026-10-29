import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "./Hero";
import { AboutStage } from "./Sections";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type CinematicIntroProps = {
  reducedMotion: boolean;
  /** The loading primer reports ready only when its sequence has finished. */
  ready: boolean;
  /** Once true the loading screen is retired for the rest of the visit. */
  entered?: boolean;
  /** Fires once, when the hero has been fully revealed by scrolling. */
  onEntered?: () => void;
  primer?: ReactNode;
};

/** Scroll progress at which the hero is fully revealed and the visitor is "in". */
const ENTER_PROGRESS = 0.55;

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

export function CinematicIntro({
  reducedMotion,
  ready,
  entered = false,
  onEntered,
  primer,
}: CinematicIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const heroWindowRef = useRef<HTMLDivElement>(null);
  const diagonalRef = useRef<HTMLDivElement>(null);
  const primerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  // panelsRef removed: the IDEAS NEED BUILDERS editorial panels were removed;
  // the hero-window now expands directly into the full page below it.
  const internalReducedMotion = useReducedMotion();
  const isReduced = reducedMotion || internalReducedMotion;

  const onEnteredRef = useRef(onEntered);
  const enteredOnceRef = useRef(false);

  useEffect(() => {
    onEnteredRef.current = onEntered;
  }, [onEntered]);

  useLayoutEffect(() => {
    if (isReduced || !ready) return;

    const root = rootRef.current;
    const blackout = blackoutRef.current;
    const heroWindow = heroWindowRef.current;
    const diagonal = diagonalRef.current;
    const primer = primerRef.current;

    if (!root || !blackout || !heroWindow || !diagonal || !primer) return;

    const ctx = gsap.context(() => {
      const nav = root.querySelector<HTMLElement>(".landing-nav");
      const topLine = root.querySelector<HTMLElement>(".hero-top-line");
      const heroLabel = root.querySelector<HTMLElement>(".hero-label");
      const description = root.querySelector<HTMLElement>(".hero-description");
      const bottom = root.querySelector<HTMLElement>(".hero-bottom");
      const object = root.querySelector<HTMLElement>(".hero-object");
      const heroInner = root.querySelector<HTMLElement>(".hero-inner");
      const lines = gsap.utils.toArray<HTMLElement>(".hero-line-inner", root);

      // The About page sits behind the hero window and is revealed by the same
      // timeline once the hero retires into the lime diagonal.
      const aboutLines = gsap.utils.toArray<HTMLElement>(".about-headline-line", root);
      const aboutLabel = root.querySelector<HTMLElement>(".about-left .section-number");
      const aboutSmall = root.querySelector<HTMLElement>(".about-left .small-label");
      const aboutLead = root.querySelector<HTMLElement>(".about-lead");
      const aboutCard = root.querySelector<HTMLElement>(".about-right-card");
      const aboutBadge = root.querySelector<HTMLElement>(".about-cc-icon");
      const aboutLogo = root.querySelector<HTMLElement>(".about-cc-logo");
      const aboutMarkers = gsap.utils.toArray<HTMLElement>(
        ".about-marker, .about-marker--vr",
        root,
      );

      const reveal = { gap: 0 };
      const setGap = () => {
        blackout.style.setProperty("--slit-gap", `${reveal.gap}%`);
      };
      setGap();

      gsap.set(heroWindow, { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1 });
      gsap.set(primer, { autoAlpha: 1 });
      gsap.set(lines, { y: 0, yPercent: 118, rotate: 2.4, transformOrigin: "0% 100%" });
      gsap.set(nav, { y: -18, autoAlpha: 0 });
      gsap.set([heroLabel, description], { y: 24, autoAlpha: 0 });
      gsap.set(bottom, { autoAlpha: 0 });
      gsap.set(object, { scale: 0.82, transformOrigin: "50% 50%" });
      gsap.set(diagonal, { autoAlpha: 0, rotate: 0, scaleY: 1 });

      gsap.set(aboutLines, { yPercent: 118, opacity: 0, rotate: 2.4, transformOrigin: "0% 100%" });
      gsap.set([aboutLabel, aboutSmall], { autoAlpha: 0, y: 16 });
      gsap.set(aboutLead, { autoAlpha: 0, y: 26 });
      gsap.set(aboutCard, { autoAlpha: 0, y: 46 });
      gsap.set(aboutBadge, { autoAlpha: 0, scale: 0.6 });
      gsap.set(aboutLogo, { autoAlpha: 0, y: 18 });
      gsap.set(aboutMarkers, { autoAlpha: 0 });

      const distance = window.innerWidth < 700 ? 4.4 : 5;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * distance}`,
          pin: root,
          pinSpacing: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            if (enteredOnceRef.current) return;
            if (self.progress < ENTER_PROGRESS) return;
            enteredOnceRef.current = true;
            onEnteredRef.current?.();
          },
        },
      });

      tl
        // Stage 1 — the completed CODING screen holds.
        .to({}, { duration: 0.045 })
        .to(primer, { autoAlpha: 0, duration: 0.045, ease: "power2.inOut" }, 0.03)
        // Stage 2 — a two-pixel vertical slit appears.
        .to(reveal, { gap: 0.14, duration: 0.055, ease: "power2.out", onUpdate: setGap }, 0.045)
        // Stage 3 — the slit opens into the full hero.
        .to(reveal, { gap: 56, duration: 0.31, ease: "power3.inOut", onUpdate: setGap }, 0.11)
        .to(nav, { y: 0, autoAlpha: 1, duration: 0.12, ease: "power2.out" }, 0.15)
        .to(topLine, { y: 0, autoAlpha: 1, duration: 0.14, ease: "power2.out" }, 0.17)
        .to(lines, {
          y: 0,
          yPercent: 0,
          rotate: 0,
          duration: 0.3,
          stagger: 0.045,
          ease: "power4.out",
        }, 0.17)
        .to(heroLabel, { y: 0, autoAlpha: 1, duration: 0.12, ease: "power2.out" }, 0.21)
        .to(object, { scale: 1, duration: 0.34, ease: "power3.out" }, 0.22)
        .to(description, { y: 0, autoAlpha: 1, duration: 0.16, ease: "power2.out" }, 0.27)
        .to(bottom, { autoAlpha: 1, duration: 0.12 }, 0.35)
        // Stage 4 — the full hero, alive but restrained.
        .to(heroInner, { scale: 1.012, duration: 0.2, ease: "sine.inOut" }, 0.42)
        .to(object, { y: -12, x: 10, duration: 0.2, ease: "sine.inOut" }, 0.42)
        .to(".hero-object-halo", { opacity: 0.9, duration: 0.2 }, 0.42)
        // Stage 5 — the hero closes back into a central slit.
        .to(heroInner, { scale: 0.985, opacity: 0.7, duration: 0.17, ease: "power2.inOut" }, 0.59)
        .to(
          heroWindow,
          {
            clipPath: "inset(0% 49.93% 0% 49.93%)",
            duration: 0.19,
            ease: "power3.inOut",
          },
          0.59,
        )
        // Stage 6 — the slit becomes a lime diagonal, flashes, then disappears.
        .set(diagonal, { autoAlpha: 1 }, 0.79)
        .to(diagonal, { rotate: -28, duration: 0.07, ease: "power2.inOut" }, 0.79)
        .to(heroWindow, { autoAlpha: 0, duration: 0.02 }, 0.8)
        .to(diagonal, { opacity: 1, duration: 0.03 }, 0.8)
        .to(diagonal, { scaleY: 0.022, opacity: 0, duration: 0.105, ease: "power3.in" }, 0.845)
        // Stage 7 — the About page is what the contracting hero opens onto, so
        // the headline rises while the slit wipes the hero away.
        .to(aboutLabel, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.57)
        .to(aboutSmall, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.575)
        .to(
          aboutLines,
          {
            yPercent: 0,
            opacity: 1,
            rotate: 0,
            duration: 0.12,
            stagger: 0.022,
            ease: "power4.out",
          },
          0.575,
        )
        // Stage 8 — the rest of the section settles once the hero is gone.
        .to(aboutCard, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power3.out" }, 0.8)
        .to(aboutLead, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.82)
        .to(aboutBadge, { autoAlpha: 1, scale: 1, duration: 0.055, ease: "back.out(1.7)" }, 0.825)
        .to(aboutLogo, { autoAlpha: 1, y: 0, duration: 0.055, ease: "power2.out" }, 0.83)
        .to(aboutMarkers, { autoAlpha: 1, duration: 0.055, stagger: 0.02 }, 0.83);
    }, root);

    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

    const onFontsReady = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(onFontsReady).catch(() => undefined);

    return () => {
      cancelAnimationFrame(refreshFrame);
      ctx.revert();
    };
  }, [isReduced, ready]);

  return (
    <div
      ref={rootRef}
      className={`cine ${isReduced ? "is-reduced" : ""} ${entered ? "is-entered" : ""}`}
    >
      <div className="cine-stage">
        {/*
          The animated page that used to sit empty after the hero now holds the
          whole About section. Reduced motion drops the pin, so the section is
          rendered in normal flow by App instead.
        */}
        {!isReduced && (
          <div className="cine-about">
            <AboutStage progress={progressRef} reducedMotion={false} />
          </div>
        )}

        <div className="hero-window" ref={heroWindowRef}>
          <div className="hero-inner">
            <Hero progress={progressRef} reducedMotion={isReduced} />
          </div>
        </div>

        <div className="cine-blackout" ref={blackoutRef} aria-hidden="true" />

        <div className="cine-primer" ref={primerRef}>
          {primer}
        </div>

        <div className="diagonal-bar" ref={diagonalRef} aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
