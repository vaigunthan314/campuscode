import { useEffect, useRef, useState } from "react";
import { GatewayScene } from "./GatewayScene";

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

/**
 * Scroll progress for the section itself (0 when its top meets the bottom of
 * the viewport, 1 once it has travelled ~72% of its own height into view).
 * Quantised so React never re-renders the canvas for every scrolled pixel.
 */
function useSectionProgress(ref: { current: HTMLElement | null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const travelled = viewport - rect.top;
      const span = Math.max(1, rect.height * 0.72);
      const next = Math.max(0, Math.min(1, travelled / span));
      setProgress((prev) => (Math.abs(prev - next) >= 0.02 ? next : prev));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return progress;
}

/**
 * 05 - THE MISSION.
 *
 * One editorial composition: the CampusCode mission on the left, the real
 * Three.js campus gateway on the right. Everything is driven by the section's
 * own scroll progress, so the entrance plays in order and reverses naturally.
 */
export function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const measured = useSectionProgress(sectionRef);
  const progress = reducedMotion ? 1 : measured;

  const labelVisible = progress > 0.06;
  const titleVisible = progress > 0.16;
  const gateFocused = progress > 0.3;
  const statementVisible = progress > 0.46;
  const taglineVisible = progress > 0.6;

  return (
    <section
      ref={sectionRef}
      className="mission"
      id="mission"
      aria-labelledby="mission-title"
      data-reduced={reducedMotion ? "1" : "0"}
    >
      <div className="mission-grid" aria-hidden="true" />

      <div className="mission-editorial">
        <p className={"mission-label" + (labelVisible ? " is-visible" : "")}>
          <span className="mission-label__rule" aria-hidden="true" />
          05 / THE MISSION
          <span className="mission-accent" aria-hidden="true" />
        </p>

        <h2
          id="mission-title"
          className={"mission-title" + (titleVisible ? " is-visible" : "")}
          aria-label="CAMPUS CODE"
        >
          <span>CAMPUS</span>
          <span>CODE</span>
        </h2>

        <p
          className={
            "mission-statement" + (statementVisible ? " is-visible" : "")
          }
        >
          Connecting students to real-world problems through organized
          hackathons, shared tools, and a community that turns ideas into
          shipped products.
        </p>

        <p
          className={"mission-tagline" + (taglineVisible ? " is-visible" : "")}
        >
          BUILT BY STUDENTS. FOR STUDENTS. FOR BUILDERS.
        </p>
      </div>

      <div className="mission-visual">
        <div className={"mission-frame" + (gateFocused ? " is-focused" : "")}>
          <GatewayScene progress={progress} reducedMotion={reducedMotion} />
        </div>
        <div className="mission-visual__meta" aria-hidden="true">
          <span>ENTRANCE / 01</span>
          <span>CAMPUSCODE ARCHITECTURE</span>
        </div>
      </div>
    </section>
  );
}

export default Mission;
