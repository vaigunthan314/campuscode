import { useEffect, useRef, useState } from "react";
import "./SectionBackdrop.css";

type BackdropVariant = "folio" | "arena";

/**
 * Decorative background layer for a single section.
 *
 * Purely presentational: it is the first child of the section wrapper, sits
 * behind the content (z-index 0, pointer-events none, clipped to itself) and is
 * hidden from assistive technology. Everything is flat colour + CSS motion, and
 * all animation is paused whenever the section is off-screen.
 */
export function SectionBackdrop({ variant }: { variant: BackdropVariant }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setActive(entry.isIntersecting);
      },
      { rootMargin: "8% 0px 8% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const gridId = `bg-grid-${variant}`;

  return (
    <div
      ref={rootRef}
      className={`bg-layer bg-layer--${variant}`}
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      <svg className="bg-grid" focusable="false">
        <defs>
          <pattern id={gridId} width="256" height="256" patternUnits="userSpaceOnUse">
            <path
              className="bg-grid-line"
              d="M64 0V256M128 0V256M192 0V256M0 64H256M0 128H256M0 192H256"
            />
            <path className="bg-grid-strong" d="M0 0H256M0 0V256" />
          </pattern>
        </defs>
        <rect
          className="bg-grid-drift"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          fill={`url(#${gridId})`}
        />
      </svg>

      <div className="bg-ruler bg-ruler--left">
        <span>00</span>
        <i />
        <span>10</span>
        <i />
        <span>20</span>
      </div>
      <div className="bg-ruler bg-ruler--right">
        <span>00</span>
        <i />
        <span>10</span>
        <i />
        <span>20</span>
      </div>

      <span className="bg-cross bg-cross--1" />
      <span className="bg-cross bg-cross--2" />
      <span className="bg-cross bg-cross--3" />

      {variant === "folio" ? (
        <>
          <div className="bg-rings">
            <span className="bg-ring bg-ring--a" />
            <span className="bg-ring bg-ring--b">
              <i className="bg-ring-dot bg-ring-dot--v" />
              <i className="bg-ring-dot bg-ring-dot--l" />
              <i className="bg-ring-dot bg-ring-dot--v" />
              <i className="bg-ring-dot bg-ring-dot--l" />
            </span>
          </div>

          <div className="bg-sheets">
            <span className="bg-sheet bg-sheet--1" />
            <span className="bg-sheet bg-sheet--2" />
            <span className="bg-sheet bg-sheet--3" />
            <span className="bg-sheet bg-sheet--4" />
          </div>

          <div className="bg-slashset">
            <i className="bg-slash bg-slash--v" />
            <i className="bg-slash bg-slash--k" />
            <i className="bg-slash bg-slash--l" />
          </div>

          <span className="bg-tag bg-tag--1">STEP 01</span>
          <span className="bg-tag bg-tag--2">STEP 02</span>
          <span className="bg-tag bg-tag--3">STEP 03</span>
        </>
      ) : (
        <>
          <div className="bg-stage">
            <span className="bg-stage-fill" />
            <span className="bg-stage-line" />
          </div>

          <span className="bg-shape bg-shape--ring bg-shape--1" />
          <span className="bg-shape bg-shape--ring bg-shape--2" />
          <span className="bg-shape bg-shape--box bg-shape--3" />
          <span className="bg-shape bg-shape--box bg-shape--4" />

          <div className="bg-speeds">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

          <svg className="bg-word" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMid meet" focusable="false">
            <text x="500" y="152" textAnchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs">
              ARENA
            </text>
          </svg>

          <div className="bg-confetti">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </>
      )}
    </div>
  );
}
