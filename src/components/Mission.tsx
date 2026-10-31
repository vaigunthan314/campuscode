import { useEffect, useRef, useState } from "react";
import "./Mission.css";
import { SectionHeader } from "./SectionHeader";
import { scrollToSection } from "./scrollToSection";
import { requestExperiencePlay } from "./ExperienceVideo";

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

const STATS = [
  { value: "10K+", label: "STUDENTS" },
  { value: "120+", label: "HACKATHONS" },
  { value: "500+", label: "PROJECTS" },
  { value: "∞", label: "POSSIBILITIES" },
];

/** Numeric targets for the count-up (the ∞ keeps its glyph). */
const COUNT_TARGETS = [10, 120, 500];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * 05 / THE MISSION.
 *
 * Editorial column on the left, architectural gateway image on the right.
 * Layout, type, colours and crop are unchanged; this file only adds motion.
 */
export function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statRefs = useRef<Array<HTMLElement | null>>([]);
  const countRef = useRef({ start: 0, done: false });
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Entrance plays once at 30% visibility; `active` pauses the ambient loops.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) {
      setRevealed(true);
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting);
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setRevealed(true);
          }
        }
      },
      { threshold: [0, 0.3, 0.6] },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Counters: one run of 1.4s, driven by the single motion loop below.
  useEffect(() => {
    if (!revealed) return;

    if (reducedMotion) {
      STATS.forEach((stat, i) => {
        const node = statRefs.current[i];
        if (node) node.textContent = stat.value;
      });
      countRef.current = { start: 0, done: true };
      return;
    }

    countRef.current = { start: performance.now(), done: false };
  }, [revealed, reducedMotion]);

  // The only rAF loop: parallax, pointer tilt and the stat count-up.
  useEffect(() => {
    if (!active) return;

    const section = sectionRef.current;
    const art = artRef.current;
    const heading = headingRef.current;
    if (!section || !art || !heading || reducedMotion) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const paintStats = (value: number) => {
      COUNT_TARGETS.forEach((target, i) => {
        const node = statRefs.current[i];
        if (!node) return;
        const suffix = STATS[i].value.replace(String(target), "");
        node.textContent = `${Math.round(value * target)}${suffix}`;
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!fine || window.innerWidth < 900 || event.pointerType !== "mouse") return;
      const rect = section.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetY = Math.max(-1, Math.min(1, nx)) * 2;
      targetX = Math.max(-1, Math.min(1, ny)) * -2;
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const render = () => {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.max(
        -1,
        Math.min(1, (viewport / 2 - (rect.top + rect.height / 2)) / viewport),
      );

      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      const shift = window.innerWidth >= 900 ? progress : 0;
      art.style.transform =
        `translate3d(0, ${(shift * -24).toFixed(2)}px, 0)` +
        ` perspective(1200px) rotateX(${curX.toFixed(2)}deg) rotateY(${curY.toFixed(2)}deg)`;
      heading.style.transform = `translate3d(0, ${(shift * 8).toFixed(2)}px, 0)`;

      const count = countRef.current;
      if (count.start && !count.done) {
        const t = Math.min(1, (performance.now() - count.start) / 1400);
        paintStats(easeOutCubic(t));
        if (t >= 1) count.done = true;
      }

      raf = window.requestAnimationFrame(render);
    };

    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);
    raf = window.requestAnimationFrame(render);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      art.style.transform = "";
      heading.style.transform = "";
    };
  }, [active, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="mission-section"
      id="mission"
      aria-labelledby="mission-title"
      data-revealed={revealed ? "1" : "0"}
      data-active={active ? "1" : "0"}
      data-reduced={reducedMotion ? "1" : "0"}
      data-image={imageFailed ? "missing" : "ready"}
    >
      <div className="mission-section__grid" aria-hidden="true" />

      <span
        className="mission-section__cross"
        style={{ top: "13%", left: "6.5%" }}
        aria-hidden="true"
      />
      <span
        className="mission-section__cross"
        style={{ top: "26%", left: "23%" }}
        aria-hidden="true"
      />
      <span
        className="mission-section__cross"
        style={{ top: "8%", left: "34%" }}
        aria-hidden="true"
      />
      <span
        className="mission-section__outline"
        style={{ top: "16%", left: "12%", width: "92px", height: "54px" }}
        aria-hidden="true"
      />
      <span
        className="mission-section__outline"
        style={{ top: "31%", left: "36%", width: "44px", height: "44px" }}
        aria-hidden="true"
      />

      <div className="mission-copy">
        <SectionHeader number="05" label="THE MISSION" variant="eyebrow" />

        <h2
          id="mission-title"
          ref={headingRef}
          className="mission-heading"
          aria-label="CAMPUS CODE"
        >
          <span className="ms-line">
            <span className="ms-line__in">CAMPUS</span>
          </span>
          <span className="ms-line">
            <span className="ms-line__in" style={{ transitionDelay: "120ms" }}>
              CODE
              <i className="mission-heading__stop ms-stop" aria-hidden="true" />
            </span>
          </span>
        </h2>

        <p className="mission-desc ms-rise" style={{ transitionDelay: "320ms" }}>
          Connecting students to real-world problems through organized
          hackathons, shared tools, and a community that turns ideas into shipped
          products.
        </p>

        <p className="mission-pledge ms-rise" style={{ transitionDelay: "400ms" }}>
          BUILT BY STUDENTS. FOR STUDENTS. FOR BUILDERS.
        </p>

        <div className="mission-actions ms-rise" style={{ transitionDelay: "480ms" }}>
          <a className="mission-cta" href="#hackathons">
            <span className="mission-cta__inner">
              EXPLORE HACKATHONS <span aria-hidden="true">↗</span>
            </span>
          </a>
          <button
            type="button"
            className="mission-story"
            aria-label="Watch the CampusCode story"
            onClick={() => {
              scrollToSection("experience");
              requestExperiencePlay();
            }}
          >
            <span className="mission-story__play" aria-hidden="true" />
            WATCH STORY
          </button>
        </div>

        <ul className="mission-stats ms-rise" style={{ transitionDelay: "560ms" }}>
          {STATS.map((stat, i) => (
            <li key={stat.label}>
              <strong
                ref={(el) => {
                  statRefs.current[i] = el;
                }}
                className={i === 3 ? "ms-inf" : "ms-count"}
              >
                {i === 3 ? stat.value : stat.value.replace(/[0-9]+/, "0")}
              </strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mission-art"
        data-revealed={revealed ? "1" : "0"}
        aria-hidden={imageFailed ? "true" : undefined}
      >
        {!imageFailed && (
          <div className="ms-art" ref={artRef}>
            <div className="ms-art__zoom">
              <img
                className="mission-art__image"
                src="/images/mission-arch.png"
                alt="CampusCode entrance arch"
                loading="lazy"
                decoding="async"
                onError={() => setImageFailed(true)}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Mission;
