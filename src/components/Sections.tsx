import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { CubeScene, type ProgressRef } from "./CubeScene";

import "./Community.css";
import "./Join.css";
import "./Footer.css";
import { SectionHeader } from "./SectionHeader";
import { SectionBackdrop } from "./SectionBackdrop";
import { ExperienceVideo, requestExperiencePlay } from "./ExperienceVideo";
import { PageFlipBook } from "./PageFlipBook";

export { PageFlipBook } from "./PageFlipBook";
export { Arena as Hackathons } from "./Arena";

function updateExperienceScrollPadding() {
  let offset = 0;
  for (const el of document.querySelectorAll<HTMLElement>("[data-scroll-padding-for]")) {
    if (el.offsetParent !== null) {
      offset = Math.max(offset, el.getBoundingClientRect().height);
    }
  }
  const section = document.getElementById("experience");
  if (!section) return;
  section.style.scrollMarginTop = `${offset}px`;
}

if (typeof window !== "undefined") {
  updateExperienceScrollPadding();
  window.addEventListener("load", updateExperienceScrollPadding, { once: true });
  window.addEventListener("resize", updateExperienceScrollPadding);
}

function updateScrollPaddingTop() {
  let offset = 0;
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-marquee-for]"
  )) {
    if (el.offsetParent !== null) {
      offset = Math.max(offset, el.getBoundingClientRect().height);
    }
  }
  const section = document.getElementById("experience");
  if (!section) return;
  section.style.scrollMarginTop = `${offset}px`;
}

if (typeof window !== "undefined") {
  updateScrollPaddingTop();
  window.addEventListener("load", updateScrollPaddingTop, { once: true });
  window.addEventListener("resize", updateScrollPaddingTop);
}

export function Marquee() {
  const MARQUEE_ITEMS = ["IDEAS", "PEOPLE", "PRODUCTS", "INNOVATION", "COMMUNITY"];
  const track = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <section className="landing-marquee" aria-label="CampusCode values">
      <div className="marquee-track" aria-hidden="true">
        {track.map((item, index) => (
          <span key={`${item}-${index}`} className="marquee-unit">
            <span>{item}</span>
            <b>✦</b>
          </span>
        ))}
      </div>
    </section>
  );
}

export function AboutStage({
  progress,
  reducedMotion,
  inStage = false,
}: {
  progress: ProgressRef;
  reducedMotion: boolean;
  /** Renders inside the cinematic stage, where the intro timeline owns the reveal. */
  inStage?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inside the stage the intro timeline scrubs the same reveal, so the section
    // must not create its own ScrollTriggers (it is pinned at the viewport top).
    const section = sectionRef.current;
    if (!section) return;
    if (inStage) return;
    const card = cardRef.current;
    const logo = logoRef.current;
    const badge = badgeRef.current;
    if (!card || !logo || !badge) return;

    const ctx = gsap.context(() => {
      const leadRef = section.querySelector(".about-lead");

      const markers = gsap.utils.toArray<HTMLElement>(".about-marker", section);
      const cornerTop = section.querySelector(".about-cc-corner-top") as HTMLElement | null;
      const cornerBot = section.querySelector(".about-cc-corner-bot") as HTMLElement | null;

      // Headline: WHERE, STUDENTS, BUILD. reveal in sequence
      const lines = gsap.utils.toArray<HTMLElement>(".about-headline-line", section);

      lines.forEach((line, i) => {
        line.style.display = "block";
        line.style.opacity = "0";
        line.style.transform = "translateY(40px)";
        gsap.fromTo(line, { opacity: 0, y: 40 }, {
          opacity: 1,
          y: 0,
          duration: 0.55 + i * 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Lead text appears after the headline
      if (leadRef) {
        gsap.fromTo(leadRef, { opacity: 0, y: 30 }, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Information card smooth scroll-triggered reveal
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      // Badge / CC square fade in
      gsap.fromTo(badge, { scale: 0.6, opacity: 0 }, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      // 3D logo y fade in
      gsap.fromTo(logo, { opacity: 0, y: 18 }, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 84%",
          toggleActions: "play none none reverse",
        },
      });

      // Border pulse + marker movement
      gsap.to(".about-right-card", {
        borderColor: "rgba(0,0,0,0.55)",
        duration: 1.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 80%",
          toggleActions: "play none none none",
        },
      });

      markers.forEach((marker) => {
        gsap.to(marker, {
          opacity: 0.5,
          duration: 1.4,
          ease: "sine.inOut",
          repeat: 1,
          yoyo: true,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      });

      [cornerTop, cornerBot].forEach((el) => {
        if (!el) return;
        gsap.to(el, {
          borderColor: "rgba(0,0,0,0.4)",
          duration: 1.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom 80%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.to(".about-marker--lime", {
        opacity: 0.5,
        duration: 1.4,
        ease: "sine.inOut",
        repeat: 1,
        yoyo: true,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 80%",
          toggleActions: "play none none none",
        },
      });

      gsap.to(".about-cc-logo", {
        opacity: 0.5,
        duration: 1.4,
        ease: "sine.inOut",
        repeat: 1,
        yoyo: true,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 80%",
          toggleActions: "play none none none",
        },
      });
    }, section);

    return () => ctx.revert();
  }, [inStage]);

  return (
    <section
      id="about"
      className={`landing-about${inStage ? " is-stage" : ""}`}
      ref={sectionRef}
    >
      <div className="about-left">
        <div className="section-number">01 — WHAT IS CAMPUSCODE?</div>
        <div className="small-label">
          <i aria-hidden="true" />
          WHAT IS CAMPUSCODE?
        </div>
        <h2 className="about-headline">
          <span className="about-headline-line">WHERE</span>
          <span className="about-headline-line">STUDENTS</span>
          <span className="about-headline-em about-headline-line">BUILD.</span>
        </h2>
        <p className="about-lead">
          CampusCode brings students, teams, organizers, and hackathons into one
          connected ecosystem.
        </p>
      </div>
      <div className="about-right">
        <div className="about-right-card" ref={cardRef}>
          <span className="about-cc-corner-top" aria-hidden="true" />
          <span className="about-cc-corner-bot" aria-hidden="true" />
          <span className="about-marker about-marker--lime" aria-hidden="true" />
          <span className="about-marker--lime about-marker--vr" aria-hidden="true" />
          <div className="about-cc-icon" ref={badgeRef} aria-hidden="true">
            <span className="about-cc-inner">CC</span>
          </div>
          <div className="about-cc-logo" ref={logoRef} aria-hidden="true">
            <CubeScene progress={progress} reducedMotion={reducedMotion} />
          </div>
          <p className="about-right-label">—</p>
          <h3 className="about-right-title">IDEAS BECOME REALITY.</h3>
          <p className="about-right-text">
            A connected space to discover hackathons, find teams, and turn ideas
            into shipped projects.
          </p>
        </div>
      </div>
    </section>
  );
}


export function Experience() {
  return (
    <section className="ar-experience landing-experience" id="experience">
      <div className="ar-experience__bg" aria-hidden="true">
        <div className="ar-experience__grid" />
        <span className="ar-experience__corner ar-experience__corner--tl" aria-hidden="true" />
        <span className="ar-experience__corner ar-experience__corner--bl" aria-hidden="true" />
        <span className="ar-experience__chip ar-experience__chip--1" aria-hidden="true">1000+ STUDENTS</span>
        <span className="ar-experience__chip ar-experience__chip--2" aria-hidden="true">REAL PRODUCTS SHIPPED</span>
      </div>

      <div className="ar-experience__header">
        <SectionHeader
          number="02"
          label="THE CAMPUSCODE EXPERIENCE"
          title="THE EXPERIENCE"
          variant="full"
          as="h2"
        />
      </div>

      <div className="ar-experience__body">
        <ExperienceVideo />

        <div className="ar-experience__side">
          <span className="experience-chip">
            <span className="experience-chip__dot" aria-hidden="true" />
            <span className="experience-chip__text">REAL STUDENT STORIES</span>
          </span>

          <p className="experience-desc">
            Every semester, thousands of students build, compete, and ship
            real products inside CampusCode's connected arena.
          </p>

          <div className="experience-links">
            <button
              type="button"
              className="experience-watch-link"
              onClick={requestExperiencePlay}
            >
              Watch full story
              <span className="link-arrow" aria-hidden="true">▶</span>
            </button>
            <a href="#howitworks" className="experience-scroll-link">
              How it works
              <span className="link-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <ExperienceSweepHint />
    </section>
  );
}

function ExperienceSweepHint() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: PointerEvent) => {
    const target = targetRef.current;
    if (!target) return;
    if (event.pointerType === "touch") return;

    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      target.style.transform = "";
      return;
    }

    const nx = Math.min(1, Math.max(0, x / rect.width)) * 2 - 1;
    const ny = Math.min(1, Math.max(0, y / rect.height)) * 2 - 1;
    target.style.transform = `perspective(1000px) rotateY(${nx * -3}deg) rotateX(${ny * 3}deg)`;
  };

  const handlePointerLeave = () => {
    const target = targetRef.current;
    if (!target) return;
    target.style.transform = "";
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.addEventListener("pointermove", handlePointerMove);
    wrapper.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      wrapper.removeEventListener("pointermove", handlePointerMove);
      wrapper.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const section = wrapperRef.current;
    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }

    const timer = window.setTimeout(() => setEntered(true), 60);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          clearTimeout(timer);
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`ar-experience__sweep${entered ? " is-entered" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="ar-experience__sweep-svg"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        focusable="false"
        aria-hidden="true"
      >
        <path
          className="ar-experience__sweep-curve"
          d="M90 200 C 420 172, 780 92, 1110 26"
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle className="ar-experience__sweep-anchor" cx="1110" cy="26" r="4" />
        <circle className="ar-experience__sweep-anchor" cx="780" cy="102" r="2.4" />
        <circle className="ar-experience__sweep-anchor" cx="420" cy="182" r="2.4" />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`landing-how${entered ? " is-how-entered" : ""}${
        step > 0 ? " is-how-open" : ""
      }`}
      id="howitworks"
    >
      <SectionBackdrop variant="folio" />

      <div className="how-headline-block">
        <span className="section-number how-num">03 / 05</span>
        <SectionHeader
          number="03"
          label="HOW IT WORKS"
          title="HOW IT WORKS"
          subtitle="INSIDE THE CAMPUSCODE FOLIO."
        />
      </div>

      <div className="how-stage-grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`v-${i}`} className="how-grid-line how-grid-v" style={{ left: `${(i + 1) * 8}%` }} />
        ))}
      </div>
      <div className="how-stage-grid" aria-hidden="true">
        <div className="how-folio">
          <div className="how-folio-line how-folio-h" style={{ top: "48px", left: "88px", width: "clamp(220px, 16vw, 360px)" }} />
          <div className="how-folio-line how-folio-h" style={{ top: "132px", left: "96px", width: "clamp(320px, 24vw, 520px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "128px", right: "96px", height: "clamp(40px, 3vh, 64px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "120px", left: "96px", height: "clamp(60px, 4vh, 90px)" }} />
          <div className="how-folio-block" style={{ bottom: "64px", left: "76px", width: "clamp(200px, 14vw, 280px)", height: "clamp(96px, 7vh, 130px)" }}>
            <span className="how-folio-text" style={{ top: "12px", left: "14px" }}>STEP 01</span>
            <span className="how-folio-text" style={{ bottom: "12px", right: "14px" }}><small>PRINT 04 · 2026</small></span>
          </div>
        </div>
        <div className="how-folio">
          <div className="how-folio-line how-folio-h" style={{ top: "120px", left: "96px", width: "clamp(320px, 24vw, 520px)" }} />
          <div className="how-folio-line how-folio-h" style={{ top: "132px", left: "96px", width: "clamp(220px, 16vw, 360px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "120px", right: "96px", height: "clamp(60px, 4vh, 90px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "120px", left: "96px", height: "clamp(40px, 3vh, 64px)" }} />
          <div className="how-folio-block" style={{ bottom: "64px", left: "76px", width: "clamp(200px, 14vw, 280px)", height: "clamp(96px, 7vh, 130px)" }}>
            <span className="how-folio-text" style={{ top: "12px", left: "14px" }}>STEP 01</span>
            <span className="how-folio-text" style={{ bottom: "12px", right: "14px" }}><small>PRINT 04 · 2026</small></span>
          </div>
        </div>
        <div className="how-folio">
          <div className="how-folio-line how-folio-h" style={{ top: "48px", left: "88px", width: "clamp(220px, 16vw, 360px)" }} />
          <div className="how-folio-line how-folio-h" style={{ top: "132px", left: "96px", width: "clamp(320px, 24vw, 520px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "128px", right: "96px", height: "clamp(40px, 3vh, 64px)" }} />
          <div className="how-folio-line how-folio-v" style={{ top: "120px", left: "96px", height: "clamp(60px, 4vh, 90px)" }} />
          <div className="how-folio-block" style={{ bottom: "64px", left: "76px", width: "clamp(200px, 14vw, 280px)", height: "clamp(96px, 7vh, 130px)" }}>
            <span className="how-folio-text" style={{ top: "12px", left: "14px" }}>STEP 01</span>
            <span className="how-folio-text" style={{ bottom: "12px", right: "14px" }}><small>PRINT 04 · 2026</small></span>
          </div>
        </div>
      </div>

      <div className="book-stage" id="howitworks-stage">
        <PageFlipBook onStepChange={setStep} />
      </div>

      <div className="section-cta" style={{ position: "relative", zIndex: 4, maxWidth: "1180px", margin: "0 auto", padding: "0 8vw", marginTop: "28px" }}>
        <a href="#hackathons" className="section-link">
          Jump to Hackathons <span>&rsaquo;</span>
        </a>
      </div>
    </section>
  );
}

// Section 05: THE MISSION — reused from the gateway-wrapped component that
// already owns the editorial overlay, the Three.js architectural gateway,
// the blur-to-focus reveal, and the reduced-motion fallback.
export { Mission } from "./Mission";

const NET_LEFT = [
  {
    label: "STUDENTS",
    tone: "violet",
    caption: ["LEARN", "BUILD", "COLLABORATE", "GROW"],
  },
  {
    label: "TEAMS",
    tone: "lime",
    caption: ["FIND", "CO-FOUNDERS", "BUILD TEAMS", "SHIP IDEAS"],
  },
  {
    label: "MENTORS",
    tone: "violet",
    caption: ["GET GUIDANCE", "LEARN FROM", "EXPERIENCE", "GO FURTHER"],
  },
] as const;

const NET_RIGHT = [
  {
    label: "HACKATHONS",
    tone: "lime",
    caption: ["REAL PROBLEMS", "REAL PEOPLE", "REAL IMPACT"],
  },
  {
    label: "PROJECTS",
    tone: "violet",
    caption: ["TURN IDEAS", "INTO PRODUCTS", "CREATE IMPACT"],
  },
  {
    label: "ORGANIZERS",
    tone: "green",
    caption: ["UNIVERSITIES", "COMMUNITIES", "PARTNERSHIPS", "OPPORTUNITIES"],
  },
] as const;

const NET_STATS = [
  { value: "10K+", label: "STUDENTS" },
  { value: "120+", label: "MENTORS" },
  { value: "500+", label: "PROJECTS" },
  { value: "∞", label: "POSSIBILITIES" },
] as const;

/** Inline icons only — no image files, no icon package. */
function NetIcon({ name, className }: { name: string; className: string }) {
  const shared = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": "true" as const,
  };

  switch (name) {
    case "STUDENTS":
      return (
        <svg {...shared}>
          <path d="M2.6 9.2 12 5l9.4 4.2L12 13.4 2.6 9.2Z" />
          <path d="M6.6 11.1v4.4c0 1.5 2.4 2.8 5.4 2.8s5.4-1.3 5.4-2.8v-4.4" />
          <path d="M21.4 9.2v5.1" />
        </svg>
      );
    case "TEAMS":
      return (
        <svg {...shared}>
          <circle cx="9" cy="8.2" r="3" />
          <path d="M3.2 19.2c0-3 2.6-5.2 5.8-5.2s5.8 2.2 5.8 5.2" />
          <circle cx="17.4" cy="9.6" r="2.2" />
          <path d="M15.6 14.5c2.9-.5 5.3 1.4 5.3 4.4" />
        </svg>
      );
    case "MENTORS":
      return (
        <svg {...shared}>
          <circle cx="9.6" cy="8" r="3.2" />
          <path d="M3.6 19.6c0-3.2 2.7-5.5 6-5.5 1.1 0 2.1.3 3 .8" />
          <circle cx="17.6" cy="16.4" r="3.6" />
          <path d="m17.6 14.6.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2Z" />
        </svg>
      );
    case "HACKATHONS":
      return (
        <svg {...shared}>
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3Z" />
          <path d="M9.4 18.4h5.2" />
          <path d="M10.2 21h3.6" />
        </svg>
      );
    case "PROJECTS":
      return (
        <svg {...shared}>
          <path d="M12 3 21 7.5v9L12 21 3 16.5v-9L12 3Z" />
          <path d="M3 7.5 12 12l9-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
    case "ORGANIZERS":
      return (
        <svg {...shared}>
          <path d="M3 21h18" />
          <path d="M5.2 21V8.2L12 4.2l6.8 4V21" />
          <path d="M9.4 21v-5.2h5.2V21" />
          <path d="M9.4 10.4h.01M14.6 10.4h.01M9.4 13.4h.01M14.6 13.4h.01" />
        </svg>
      );
    default:
      return null;
  }
}

export function Community() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const coreTileRef = useRef<HTMLDivElement>(null);
  const leftTileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rightTileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(false);
  const [beams, setBeams] = useState<{ w: number; h: number; d: string[] }>({
    w: 0,
    h: 0,
    d: [],
  });

  // Animations are only allowed to run while the section is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setActive(entry.isIntersecting);
      },
      { threshold: 0.12 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Connection beams are measured from the real tiles, so they stay attached
  // at every viewport width instead of being guessed in a fixed viewBox.
  useEffect(() => {
    const map = mapRef.current;
    const core = coreTileRef.current;
    if (!map || !core) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const base = map.getBoundingClientRect();
      const coreRect = core.getBoundingClientRect();
      const w = Math.round(base.width);
      const h = Math.round(base.height);
      if (!w || !h || !coreRect.width) return;

      const paths: string[] = [];
      const centreY = coreRect.top - base.top + coreRect.height / 2;

      const build = (
        tile: HTMLDivElement | null,
        side: -1 | 1,
        index: number,
      ) => {
        if (!tile) return;
        const r = tile.getBoundingClientRect();
        const x1 = (side === -1 ? r.right : r.left) - base.left;
        const y1 = r.top - base.top + r.height / 2;
        const x2 = (side === -1 ? coreRect.left : coreRect.right) - base.left;
        const y2 = centreY + (index - 1) * 18;
        const dx = (x2 - x1) * 0.52;
        const bend = index === 0 ? -1 : index === 2 ? 1 : 0;
        const cy1 = y1 + bend * 34;
        const cy2 = y2 + bend * 16;
        paths.push(
          `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + dx).toFixed(1)} ${cy1.toFixed(1)}, ${(x2 - dx).toFixed(1)} ${cy2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        );
      };

      leftTileRefs.current.forEach((tile, i) => build(tile, -1, i));
      rightTileRefs.current.forEach((tile, i) => build(tile, 1, i));

      setBeams((prev) =>
        prev.w === w && prev.h === h && prev.d.join("|") === paths.join("|")
          ? prev
          : { w, h, d: paths },
      );
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(map);
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="net-section"
      id="community"
      aria-labelledby="net-title"
      data-active={active ? "1" : "0"}
    >
      <span className="net-float net-float--1" aria-hidden="true" />
      <span className="net-float net-float--2" aria-hidden="true" />
      <span className="net-float net-float--3" aria-hidden="true" />
      <span className="net-float net-float--4" aria-hidden="true" />
      <span className="net-float net-float--5" aria-hidden="true" />

      <header className="net-header">
        <div>
          <SectionHeader number="06" label="THE NETWORK" variant="eyebrow" />
          <h2 id="net-title" className="net-heading" aria-label="STUDENT COMMUNITY">
            <span>STUDENT</span>
            <span>
              COMMUNITY
              <i className="net-heading__stop" aria-hidden="true" />
            </span>
          </h2>
        </div>

        <p className="net-lede">
          A connected space where every student, team, mentor and idea finds the
          right people, tools and opportunities to grow.
        </p>

        <ul className="net-stats">
          {NET_STATS.map((stat) => (
            <li key={stat.label} className="net-stats__item">
              <span className="net-stats__value">{stat.value}</span>
              <span className="net-stats__label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className="net-map" ref={mapRef}>
        <svg
          className="net-beams"
          viewBox={`0 0 ${beams.w || 100} ${beams.h || 100}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {beams.d.map((d, i) => (
            <path
              key={`${i}-${d.slice(0, 12)}`}
              d={d}
              className={
                "net-beam" +
                (i === 1 || i === 4 ? " net-beam--lime" : "") +
                (i === 0 || i === 5 ? " net-beam--slow" : "")
              }
            />
          ))}
        </svg>

        <div className="net-side net-side--left">
          {NET_LEFT.map((node, i) => (
            <div className="net-node" key={node.label}>
              <div
                className={
                  "net-caption" +
                  (node.tone === "lime" ? " net-caption--lime" : "")
                }
              >
                {node.caption.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div
                className={"net-tile" + (node.tone === "lime" ? " net-tile--lime" : "")}
                ref={(el) => {
                  leftTileRefs.current[i] = el;
                }}
              >
                <NetIcon name={node.label} className="net-tile__icon" />
                <span className="net-tile__label">{node.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="net-core">
          <div className="net-core__rings" aria-hidden="true">
            <span className="net-ring" />
            <span className="net-ring net-ring--inner" />
            <span className="net-dot net-dot--1" />
            <span className="net-dot net-dot--2" />
            <span className="net-dot net-dot--3" />
            <span className="net-dot net-dot--4" />
          </div>

          <div className="net-core__tile" ref={coreTileRef}>
            <svg
              className="net-core__mark"
              viewBox="0 0 46 40"
              fill="none"
              aria-hidden="true"
            >
              <g transform="skewX(-17)">
                <rect width="9" height="40" rx="2.5" fill="#7c5cff" />
                <rect x="16" width="9" height="40" rx="2.5" fill="#a08cff" />
                <rect x="32" width="9" height="40" rx="2.5" fill="#b6e83a" />
              </g>
            </svg>
            <span className="net-core__word">CampusCode</span>
          </div>

          <p className="net-core__pill">
            <span className="net-core__dot" aria-hidden="true" />
            COMMUNITY ONLINE
          </p>
        </div>

        <div className="net-side net-side--right">
          {NET_RIGHT.map((node, i) => (
            <div className="net-node" key={node.label}>
              <div
                className={
                  "net-tile" +
                  (node.tone === "lime" ? " net-tile--lime" : "") +
                  (node.tone === "green" ? " net-tile--green" : "")
                }
                ref={(el) => {
                  rightTileRefs.current[i] = el;
                }}
              >
                <NetIcon name={node.label} className="net-tile__icon" />
                <span className="net-tile__label">{node.label}</span>
              </div>
              <div
                className={
                  "net-caption" +
                  (node.tone === "lime" ? " net-caption--lime" : "") +
                  (node.tone === "green" ? " net-caption--green" : "")
                }
              >
                {node.caption.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <a
        className="net-explore"
        href="#joincampuscode"
        aria-label="Explore the network — scroll to Join CampusCode"
      >
        <span className="net-explore__btn" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </span>
        EXPLORE THE NETWORK
      </a>
    </section>
  );
}

const JOIN_CORNERS = [
  {
    index: "01",
    tone: "violet",
    corner: "tl",
    items: ["STUDENTS", "IDEAS", "COMMUNITY", "IMPACT"],
  },
  {
    index: "02",
    tone: "lime",
    corner: "bl",
    items: ["LEARN", "BUILD", "COLLABORATE", "GROW"],
  },
  {
    index: "03",
    tone: "lime",
    corner: "tr",
    items: ["HACKATHONS", "PROJECTS", "MENTORS", "OPPORTUNITIES"],
  },
  {
    index: "04",
    tone: "violet",
    corner: "br",
    items: ["REAL PROBLEMS", "REAL PEOPLE", "REAL PRODUCTS"],
  },
] as const;

export function JoinCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Entrance plays once; continuous motion only runs while the section is seen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting);
          if (entry.isIntersecting) setRevealed(true);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="join-section"
      id="joincampuscode"
      aria-labelledby="join-title"
      data-active={active ? "1" : "0"}
      data-revealed={revealed ? "1" : "0"}
    >
      <svg className="join-grid" aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id="joinGridPattern"
            width="96"
            height="96"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M96 0H0v96"
              fill="none"
              stroke="#111111"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#joinGridPattern)" />
      </svg>

      <div className="join-ring" aria-hidden="true">
        <svg className="join-ring__svg" viewBox="0 0 600 600" focusable="false">
          <circle
            cx="300"
            cy="300"
            r="286"
            fill="none"
            stroke="#7c5cff"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="300"
            r="274"
            fill="none"
            stroke="#7c5cff"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <path
            d="M300 26 A274 274 0 0 1 437 63"
            fill="none"
            stroke="#7c5cff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M437 537 A274 274 0 0 1 300 574"
            fill="none"
            stroke="#7c5cff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M300 6v20M300 574v20M6 300h20M574 300h20"
            stroke="#111111"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
        </svg>

        <div className="join-ring__orbit">
          <span className="join-orbit__halo" />
          <span className="join-orbit__dot" />
        </div>

        <div className="join-ring__orbit join-ring__orbit--reverse join-orbit--bottom">
          <span className="join-orbit__halo join-orbit__halo--lime" />
          <span className="join-orbit__dot join-orbit__dot--lime" />
        </div>
      </div>

      <span className="join-plus join-plus--1" aria-hidden="true" />
      <span className="join-plus join-plus--2" aria-hidden="true" />
      <span className="join-plus join-plus--3" aria-hidden="true" />
      <span className="join-plus join-plus--4" aria-hidden="true" />
      <span className="join-square join-square--1" aria-hidden="true" />
      <span className="join-square join-square--2" aria-hidden="true" />
      <span className="join-square join-square--3" aria-hidden="true" />
      <span className="join-square join-square--4" aria-hidden="true" />

      {JOIN_CORNERS.map((corner) => (
        <div
          key={corner.index}
          className={
            `join-corner join-corner--${corner.corner} join-corner--${corner.tone}`
          }
        >
          <span className="join-corner__bar" aria-hidden="true" />
          <div className="join-corner__body">
            <span className="join-corner__index">{corner.index}</span>
            {corner.items.map((item) => (
              <span className="join-corner__item" key={item}>
                {item}
              </span>
            ))}
          </div>
          <svg
            className="join-corner__link"
            viewBox="0 0 64 8"
            aria-hidden="true"
            focusable="false"
          >
            <line x1="2" y1="4" x2="54" y2="4" />
            <circle cx="58" cy="4" r="2.5" />
          </svg>
        </div>
      ))}

      <div className="join-content">
        <SectionHeader number="07" label="JOIN US TODAY" variant="eyebrow" />

        <h2 id="join-title" className="join-headline" aria-label="JOIN CAMPUSCODE">
          <span className="join-line join-line--one">
            <span className="join-line__inner">
              JOIN
              <i className="join-stop" aria-hidden="true" />
            </span>
          </span>
          <span className="join-line join-line--two">
            <span className="join-line__inner join-outline">CAMPUSCODE</span>
          </span>
        </h2>

        <p className="join-sub">The arena is open. Build something real.</p>

        <a
          className="join-cta"
          href="/register"
        >
          GET STARTED
          <span className="join-cta__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </section>
  );
}

const FT_COLUMNS = [
  {
    title: "PRODUCT",
    links: [
      { label: "About", href: "#about" },
      { label: "Hackathons", href: "#hackathons" },
      { label: "How it works", href: "#howitworks" },
      { label: "Community", href: "#community" },
    ],
  },
  {
    title: "BUILDERS",
    links: [
      { label: "Students", href: "#community" },
      { label: "Teams", href: "#community" },
      { label: "Organizers", href: "#community" },
      { label: "Developers", href: "#community" },
    ],
  },
  {
    title: "GUIDES",
    links: [
      { label: "Hackathon Rules", href: "#howitworks" },
      { label: "FAQ", href: "#howitworks" },
      { label: "Support", href: "#community" },
      { label: "Contact", href: "#community" },
    ],
  },
] as const;

const FT_SOCIALS = [
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "X", href: "#" },
] as const;

function FtSocialIcon({ name }: { name: string }) {
  const shared = {
    className: "ft-social__icon",
    viewBox: "0 0 24 24",
    "aria-hidden": "true" as const,
    focusable: "false" as const,
  };

  switch (name) {
    case "GitHub":
      return (
        <svg {...shared} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.88 1.55 2.32 1.1 2.88.84.09-.66.35-1.1.63-1.36-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.28 10.28 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...shared} fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg {...shared} fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...shared} fill="currentColor">
          <path d="M4 4h3.4l4.4 5.9L16.7 4H20l-6.4 7.1L20.6 20H17l-4.7-6.2L6.6 20H3.3l6.7-7.4L4 4Z" />
        </svg>
      );
  }
}

export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [clock, setClock] = useState("--:--");

  // Reveal once, and pause the continuous decoration when the footer is away.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting);
          if (entry.isIntersecting) setRevealed(true);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // The watermark is measured and scaled so the whole word always fits.
  useEffect(() => {
    const wrap = markRef.current;
    const word = wordRef.current;
    if (!wrap || !word) return;

    let disposed = false;
    let frame = 0;

    const fit = () => {
      frame = 0;
      if (disposed) return;
      word.style.fontSize = "100px";
      const natural = word.scrollWidth;
      const target = wrap.clientWidth;
      if (!natural || !target) return;
      word.style.fontSize = `${((100 * target) / natural).toFixed(2)}px`;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(fit);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(wrap);
    window.addEventListener("resize", schedule);

    if (document.fonts?.ready) {
      document.fonts.ready.then(schedule).catch(() => {});
    }

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Live local time in Chennai.
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const tick = () => setClock(formatter.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <footer
      ref={sectionRef}
      className="ft-section ft-footer"
      id="footer"
      data-active={active ? "1" : "0"}
      data-revealed={revealed ? "1" : "0"}
    >
      <svg className="ft-grid" aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id="ftGridPattern"
            width="88"
            height="88"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M88 0H0v88"
              fill="none"
              stroke="#111111"
              strokeOpacity="0.045"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ftGridPattern)" />
      </svg>

      <div className="ft-arc ft-arc--tr" aria-hidden="true">
        <div className="ft-arc__spin">
          <svg className="ft-arc__svg" viewBox="0 0 300 300" focusable="false">
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="#7c5cff"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="26 14"
            />
          </svg>
          <span className="ft-arc__dot" />
        </div>
      </div>

      <div className="ft-arc ft-arc--bl" aria-hidden="true">
        <div className="ft-arc__spin">
          <svg className="ft-arc__svg" viewBox="0 0 300 300" focusable="false">
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="#7c5cff"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="18 22"
            />
          </svg>
          <span className="ft-arc__dot" />
        </div>
      </div>

      <span className="ft-plus ft-plus--1" aria-hidden="true" />
      <span className="ft-plus ft-plus--2" aria-hidden="true" />
      <span className="ft-plus ft-plus--3" aria-hidden="true" />
      <span className="ft-square ft-square--1" aria-hidden="true" />
      <span className="ft-square ft-square--2" aria-hidden="true" />

      <div className="ft-inner">
        <div className="ft-top">
          <div className="ft-brand">
            <a className="ft-logo" href="#top" aria-label="CampusCode home">
              <span className="ft-logo__mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="ft-logo__type">
                <span className="ft-logo__name">CAMPUSCODE</span>
                <span className="ft-logo__sub">HACKATHON ARENA</span>
              </span>
            </a>

            <p className="ft-tagline">
              The student hackathon arena.
              <br />
              You build the idea,
              <br />
              we run the competition.
            </p>

            <ul className="ft-socials">
              {FT_SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    className="ft-social"
                    href={social.href}
                    aria-label={social.label}
                    {...(social.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <FtSocialIcon name={social.label} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FT_COLUMNS.map((column) => (
            <div className="ft-col" key={column.title}>
              <h4 className="ft-col__title">{column.title}</h4>
              <ul className="ft-col__list">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a className="ft-link" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ft-status">
          <span className="ft-status__signal">
            <span className="ft-status__dot">
              <span className="ft-status__ring" />
            </span>
            ALL SYSTEMS OPERATIONAL
          </span>

          <span className="ft-status__divider" aria-hidden="true" />

          <ul className="ft-status__legal">
            <li>
              <a href="#footer">TERMS</a>
            </li>
            <li>
              <a href="#footer">PRIVACY</a>
            </li>
            <li>
              <a href="#footer">CONTACT</a>
            </li>
          </ul>
        </div>

        <div className="ft-mark" ref={markRef} aria-hidden="true">
          <span className="ft-mark__chip ft-mark__chip--violet" />
          <span className="ft-mark__chip ft-mark__chip--lime" />
          <div className="ft-mark__word" ref={wordRef}>
            {"CampusCode".split("").map((letter, index) => (
              <span
                className="ft-letter"
                key={`${letter}-${index}`}
                style={{ transitionDelay: `${120 + index * 55}ms` }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="ft-bottom">
        <span className="ft-bottom__copy">© 2026 CAMPUSCODE</span>
        <span className="ft-bottom__motto">LEARN · BUILD · COMPETE · SHIP</span>
        <div className="ft-bottom__right">
          <span className="ft-time">CHENNAI · INDIA · {clock} IST</span>
          <a className="ft-top-link" href="#top" aria-label="Back to top">
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="m6 11 6-6 6 6" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
