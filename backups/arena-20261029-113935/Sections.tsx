import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { CubeScene, type ProgressRef } from "./CubeScene";
import { Logo } from "./Logo";
import { PageFlipBook } from "./PageFlipBook";

export { PageFlipBook } from "./PageFlipBook";
export { AboutStage as About } from "./Sections";




const ARENA_CARDS = [
  {
    id: "ai",
    number: "01",
    title: "AI INNOVATION",
    description: "Build intelligent solutions for problems that matter.",
    image: "/images/arena-ai.svg",
    alt: "A modern AI workspace and product interface.",
  },
  {
    id: "web",
    number: "02",
    title: "FUTURE WEB",
    description: "Design and ship the next generation of digital experiences.",
    image: "/images/arena-web.svg",
    alt: "A clean web development workspace with a code editor.",
  },
  {
    id: "campus",
    number: "03",
    title: "CAMPUS TECH",
    description: "Create technology that makes student life better.",
    image: "/images/arena-campus.svg",
    alt: "A CampusCode innovation event and technology showcase.",
  },
];

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

export function Experience() {
  return (
    <section className="landing-experience" id="experience">
      <Marquee />
      <div className="experience-header">
        <div className="experience-label">
          <span className="section-number-label">02 / THE CAMPUSCODE EXPERIENCE</span>
        </div>
        <h2 className="experience-headline">THE EXPERIENCE.</h2>
      </div>
      <div className="experience-body">
        <div className="experience-visual-wrap">
          {/* Video placeholder — original video asset not included in this project */}
          <div className="experience-video-placeholder" aria-label="CampusCode experience video">
            <div className="experience-video-inner">
              <div className="experience-video-scanlines" aria-hidden="true" />
              <div className="experience-video-text" aria-hidden="true">
                <span>02</span>
                <span className="experience-video-dash">—</span>
                <span>CAMPUSCODE EXPERIENCE</span>
              </div>
              <button className="experience-play" aria-label="Play experience video">
                <span className="experience-play-icon" aria-hidden="true">▶</span>
              </button>
              <div className="experience-video-meta" aria-hidden="true">
                <span>02:34</span>
                <span className="experience-video-dot">·</span>
                <span>FULL STORY</span>
              </div>
            </div>
          </div>
        </div>
        <div className="experience-side">
          <p className="experience-desc">
            Every semester, thousands of students build, compete, and ship
            real products inside CampusCode's connected arena.
          </p>
          <div className="experience-links">
            <a href="#" className="experience-watch-link">Watch full story &rsaquo;</a>
            <a href="#howitworks" className="experience-scroll-link">How it works &rsaquo;</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="landing-how" id="howitworks">
      <div className="section-heading">
        <div>
          <h2>03 — HOW IT WORKS</h2>
          <span className="section-sub">Inside the CampusCode folio.</span>
        </div>
        <span className="section-number-label">03 / 05</span>
      </div>
      <div className="book-stage">
        <PageFlipBook />
      </div>
      <div className="section-cta">
        <a href="#hackathons" className="section-link">
          Jump to Hackathons <span>&rsaquo;</span>
        </a>
      </div>
    </section>
  );
}

export function Hackathons() {
  const reducedMotion = useReducedMotionLocal();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const spreadRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef({ down: false, startX: 0, startSpread: 0, moved: 0, dragging: false });
  const suppressClickRef = useRef(false);
  const sepRef = useRef(230);

  const applyTransforms = useCallback(() => {
    const s = spreadRef.current;
    const a = activeRef.current;
    const sep = sepRef.current;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const compactY = -i * 14;
      const compactZ = -i * 38;
      const compactScale = 1 - i * 0.035;

      const expandedX = (i - 1) * sep;
      const expandedZ = a === i ? 40 : -18;
      const expandedScale = a === i ? 1.055 : 0.97;

      const x = expandedX * s;
      let y = compactY * (1 - s);
      let z = compactZ * (1 - s) + expandedZ * s;
      let scale = compactScale * (1 - s) + expandedScale * s;

      if (a === i) {
        y += -12 * s;
      }

      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
      if (s < 0.5) {
        card.style.zIndex = String(10 - i);
      } else {
        card.style.zIndex = a === i ? "20" : String(5 - i);
      }
      card.classList.toggle("is-active", a === i && s > 0.5);
    });
  }, []);

  const animateTo = useCallback((target: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (reducedMotion) {
      spreadRef.current = target;
      applyTransforms();
      if (target === 0) {
        activeRef.current = null;
        setActive(null);
      }
      return;
    }
    let velocity = 0;
    const step = () => {
      const diff = target - spreadRef.current;
      const force = diff * 0.12;
      velocity = (velocity + force) * 0.78;
      spreadRef.current += velocity;
      applyTransforms();
      if (Math.abs(velocity) > 0.001 || Math.abs(target - spreadRef.current) > 0.001) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        spreadRef.current = target;
        applyTransforms();
        rafRef.current = null;
        if (target === 0) {
          activeRef.current = null;
          setActive(null);
        }
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [reducedMotion, applyTransforms]);

  useEffect(() => {
    activeRef.current = active;
    applyTransforms();
  }, [active, applyTransforms]);

  useEffect(() => {
    const updateSep = () => {
      const stage = stageRef.current;
      if (!stage) return;
      sepRef.current = Math.max(150, Math.min(260, stage.clientWidth * 0.3));
      applyTransforms();
    };
    updateSep();
    window.addEventListener("resize", updateSep);
    return () => window.removeEventListener("resize", updateSep);
  }, [applyTransforms]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragRef.current.down = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startSpread = spreadRef.current;
    dragRef.current.moved = 0;
    dragRef.current.dragging = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.down) return;
      const dx = e.clientX - dragRef.current.startX;
      dragRef.current.moved = Math.max(dragRef.current.moved, Math.abs(dx));
      if (dragRef.current.moved > 12) dragRef.current.dragging = true;
      const next = dragRef.current.startSpread + dx / 220;
      spreadRef.current = Math.min(1, Math.max(0, next));
      applyTransforms();
    };
    const onUp = () => {
      if (!dragRef.current.down) return;
      const wasDragging = dragRef.current.dragging;
      dragRef.current.down = false;
      dragRef.current.dragging = false;
      if (wasDragging) suppressClickRef.current = true;
      if (wasDragging) {
        const target = spreadRef.current > 0.5 ? 1 : 0;
        animateTo(target);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyTransforms, animateTo]);

  const handleCardClick = useCallback((i: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const expanded = spreadRef.current > 0.5;
    if (expanded && activeRef.current === i) {
      animateTo(0);
    } else {
      activeRef.current = i;
      setActive(i);
      animateTo(1);
    }
  }, [animateTo]);

  // Collapse when clicking outside the stage.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dragRef.current.down) return;
      if (suppressClickRef.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (stage.contains(e.target as Node)) return;
      if (spreadRef.current > 0.5) animateTo(0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [animateTo]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="landing-hackathons" id="hackathons">
      <div className="section-heading">
        <h2>ENTER THE ARENA</h2>
        <p>Active challenges right now.</p>
      </div>
      <div ref={stageRef} className="arena-stage" onPointerDown={handlePointerDown}>
        {ARENA_CARDS.map((card, i) => (
          <button
            key={card.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            type="button"
            className={`arena-card ${active === i ? "is-active" : ""}`}
            onClick={() => handleCardClick(i)}
            aria-pressed={active === i}
            aria-label={`${card.number} ${card.title}`}
          >
            <div className="arena-card-media">
              <img src={card.image} alt={card.alt} loading="lazy" />
            </div>
            <div className="arena-card-body">
              <span className="arena-card-number">{card.number}</span>
              <h3 className="arena-card-title">{card.title}</h3>
              <div className="arena-card-explanation">
                <p>{card.description}</p>
              </div>
              <span className="arena-card-arrow" aria-hidden="true">→</span>
            </div>
          </button>
        ))}
      </div>
      <div className="section-cta">
        <span className="section-link">Drag or click to explore</span>
      </div>
    </section>
  );
}

function useReducedMotionLocal() {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function Mission() {
  return (
    <section className="landing-statement" id="mission">
      <div className="statement-watermark" aria-hidden="true">CC</div>
      <div className="statement-content">
        <span>05 / THE MISSION</span>
        <h2>CAMPUS<em>CODE</em></h2>
        <p>
          Connecting students to real-world problems through organized hackathons,
          shared tools, and a community that turns ideas into shipped products.
        </p>
        <p className="statement-sub">
          Built by students. For students. For builders.
        </p>
      </div>
    </section>
  );
}

export function Community() {
  return (
    <section className="landing-community">
      <div className="community-left">
        <span>THE NETWORK</span>
        <h2>STUDENT COMMUNITY</h2>
        <div className="community-meta">
          <span>&rsaquo; Events</span>
          <span>&rsaquo; Mentors</span>
          <span>&rsaquo; Teams</span>
          <span>&rsaquo; Prizes</span>
        </div>
      </div>
      <div className="community-right">
        <div className="community-orbit">
          <strong>CC</strong>
          <span /><span /><span /><span /><span />
        </div>
        <p>A connected space where every idea starts to matter.</p>
      </div>
    </section>
  );
}

export function JoinCTA() {
  return (
    <section className="landing-cta" id="joincampuscode">
      <div className="cta-grid" aria-hidden="true" />
      <div className="cta-orb" aria-hidden="true" />
      <div className="cta-content">
        <small>JOIN US TODAY</small>
        <h2>JOIN<br /><span>CAMPUSCODE</span></h2>
        <p className="cta-sub">The arena is open. Build something real.</p>
        <a href="https://campus-code-ten.vercel.app/register" className="cta-button" rel="noreferrer">
          GET STARTED <span>&rsaquo;</span>
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  const columns = [
    {
      title: "Platform",
      links: [
        { label: "About", href: "#about" },
        { label: "How It Works", href: "#howitworks" },
        { label: "Hackathons", href: "#hackathons" },
        { label: "Community", href: "#community" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Our Story", href: "#" },
        { label: "Press", href: "#" },
        { label: "Privacy", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "#" },
        { label: "Forum", href: "#" },
        { label: "Docs", href: "#" },
      ],
    },
  ];

  return (
    <footer className="landing-footer" id="footer">
      <div className="footer-watermark" aria-hidden="true">CampusCode</div>
      <div className="footer-main">
        <div className="footer-brand-col">
          <Logo href="#top" className="footer-logo" />
          <p className="footer-brand-text">Building the future of student tech, together.</p>
        </div>
        {columns.map((col) => (
          <div className="footer-column" key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((link) => (
              <a key={link.label} href={link.href}>{link.label}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-status">
        <div><i aria-hidden="true" /> Active projects</div>
        <a href="https://campus-code-ten.vercel.app/" rel="noreferrer">Join the community &rsaquo;</a>
      </div>
      <div className="footer-bottom">
        <span>&copy; CampusCode 2026</span>
        <span>All rights reserved</span>
      </div>
    </footer>
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
    }, section);

    return () => ctx.revert();
  }, [inStage]);

  return (
    <section
      id={inStage ? "about" : "about-stage"}
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
