import { useRef } from "react";
import { type GatewaySceneProps } from "./MissionScene";
import { GatewayScene } from "./GatewayScene";

/**
 * Mission — Section 05: THE MISSION.
 *
 * App.tsx owns the window scroll listener (pinned-section model). This
 * component receives `progress` (0-1) and re-renders only on real scroll
 * events, which keeps entrance/exit animations smooth in both directions
 * and avoids a stale/oscillating `editorialVisible` flag.
 */
export function Mission({
  progress = 0,
  reducedMotion = false,
}: GatewaySceneProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));

  // Map scroll progress (0-1) to entrance phases, so editorial reveals
  // and the gateway focus settle in a controlled, reversible order.
  const labelVisible = progress > 0.08;
  const headlineVisible = progress > 0.22;
  const manifestoVisible = progress > 0.48;
  const taglineVisible = progress > 0.62;
  const gateSharp = progress > 0.35;

  return (
    <section
      ref={sectionRef}
      className="mission"
      id="mission"
      aria-label="The Mission"
      data-reduced={reducedMotion ? "1" : "0"}
    >
      {/* Architectural frame / watermark. */}
      <div className="mission-frame-rules" aria-hidden="true" />

      {/* --- editorial overlay ------------------------------------------- */}
      <div className="mission-editorial">
        <div className={"mission-editorial__label" + (labelVisible ? " is-visible" : "")}>
          <span>05 / THE MISSION</span>
        </div>

        <h2 className={"mission-editorial__headline" + (headlineVisible ? " is-visible" : "")}>
          A SPACE TO BUILD WHAT MATTERS.
        </h2>

        <div className={"mission-manifesto" + (manifestoVisible ? " is-visible" : "")}>
          <p className="mission-manifesto__lead">
            Connecting students to real-world problems through organized
            hackathons, shared tools, and a community that turns ideas into
            shipped products.
          </p>
          <p className={"mission-manifesto__tagline" + (taglineVisible ? " is-visible" : "")}>
            BUILT BY STUDENTS. FOR STUDENTS. FOR BUILDERS.
          </p>
        </div>
      </div>

      {/* --- 3D gateway mount -------------------------------------------- */}
      <div className="mission-scene" aria-hidden="true">
        <GatewayScene progress={clamp(progress, 0, 1)} reducedMotion={reducedMotion} />
      </div>

      {/* --- blur-to-focus reveal overlay -------------------------------- */}
      <div className="mission-gate-reveal" aria-hidden="true" style={gateSharp ? { filter: "blur(0px)" } : { filter: "blur(6px)" }} />

      {/* --- reduced-motion fallback ----------------------------------- */}
      <div className="mission-reduced-hint" aria-hidden="true">
        <span>PLAIN-HTML FALLBACK — SCROLL TO ADVANCE THE GATEWAY</span>
      </div>
    </section>
  );
}

export { GatewayScene };
