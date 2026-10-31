import { useRef } from "react";
import { GatewayScene } from "./GatewayScene";

export type GatewaySceneProps = {
  progress?: number;
  reducedMotion?: boolean;
};

/**
 * MissionScene — Section 05: THE MISSION.
 *
 * Single source of truth for the scroll-driven mission frame. It owns:
 *  - viewport-relative entrance: label, headline, manifesto, tagline reveal
 *  - the architectural gateway mount (3D), scrubbed by the same progress
 *  - the blur-to-focus reveal overlay, which naturally runs in reverse
 *    when the user scrolls back up
 *  - the reduced-motion fallback
 *
 * It does NOT listen to the window scroll itself. App.tsx owns that listener
 * (shared with all the other pinned sections) and drives this component
 * through the `progress` prop, keeping every section on one clock.
 */
export function MissionScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="mission-scene-frame"
      aria-hidden="true"
    >
      {/* The 3D architectural gateway mount. */}
      <div className="mission-scene">
        <GatewayScene />
      </div>

      {/* Blur-to-focus reveal overlay (GSAP-driven). */}
      <div className="mission-gate-reveal" aria-hidden="true" />
    </div>
  );
}
