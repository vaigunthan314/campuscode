import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CubeScene, type ProgressRef } from "./CubeScene";
import { Logo } from "./Logo";
import { PageFlipBook } from "./PageFlipBook";

export { PageFlipBook } from "./PageFlipBook";
export { AboutStage as About } from "./Sections";
export { Arena as Hackathons } from "./Arena";

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
      <div className="how-headline-block">
        <span className="section-number how-num">03 / 05</span>
        <h2 className="how-headline">03 — HOW IT WORKS</h2>
        <span className="how-sub">Inside the CampusCode folio.</span>
      </div>

      <div className="how-stage-grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`v-${i}`} className="how-grid-line how-grid-v" style={{ left: `${(i + 1) * 8}%` }} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`h-${i}`} className="how-grid-line how-grid-h" style={{ top: `${(i + 1) * 14}%` }} />
        ))}
      </div>

      <div className="how-register" style={{ top: "62px", left: "72px" }} aria-hidden="true" />
      <div className="how-register" style={{ top: "62px", right: "72px" }} aria-hidden="true" />
      <div className="how-register" style={{ bottom: "62px", left: "72px" }} aria-hidden="true" />
      <div className="how-register" style={{ bottom: "62px", right: "72px" }} aria-hidden="true" />

      <div className="how-corner tl" aria-hidden="true" />
      <div className="how-corner tr" aria-hidden="true" />
      <div className="how-corner bl" aria-hidden="true" />
      <div className="how-corner br" aria-hidden="true" />

      <div className="how-folio" aria-hidden="true">
        <div className="how-folio-block" style={{ top: "76px", right: "76px", width: "clamp(220px, 16vw, 320px)", height: "clamp(150px, 11vh, 220px)" }}>
          <span className="how-folio-text" style={{ top: "18px", left: "18px" }}>FOLIO 03 · SUB</span>
          <span className="how-folio-text" style={{ bottom: "18px", right: "18px" }}><small>PRINT 04 · 2026</small></span>
        </div>
        <div className="how-folio-line how-folio-h" style={{ top: "120px", left: "96px", width: "clamp(320px, 24vw, 520px)" }} />
        <div className="how-folio-line how-folio-h" style={{ top: "132px", left: "96px", width: "clamp(220px, 16vw, 360px)" }} />
        <div className="how-folio-line how-folio-v" style={{ top: "120px", right: "96px", height: "clamp(60px, 4vh, 90px)" }} />
        <div className="how-folio-line how-folio-v" style={{ top: "120px", left: "calc(96px + clamp(320px, 24vw, 520px))", height: "clamp(40px, 3vh, 64px)" }} />
        <div className="how-folio-block" style={{ bottom: "64px", left: "76px", width: "clamp(200px, 14vw, 280px)", height: "clamp(96px, 7vh, 130px)" }}>
          <span className="how-folio-text" style={{ top: "12px", left: "14px" }}>STEP 01</span>
          <span className="how-folio-text" style={{ bottom: "12px", right: "14px" }}><small>CAMPUSCODE · 2026</small></span>
        </div>
      </div>

      <div className="how-book-shadow" aria-hidden="true" />

      <div className="book-stage" id="howitworks-stage">
        <PageFlipBook />
      </div>

      <span className="how-state-marker" aria-hidden="true">
        <span className="how-state-num">01 — DISCOVER</span>
      </span>

      <span className="how-release-hint" aria-hidden="true">Scroll to open —</span>

      <div className="section-cta" style={{ position: "relative", zIndex: 4, maxWidth: "1180px", margin: "0 auto", padding: "0 8vw", marginTop: "28px" }}>
        <a href="#hackathons" className="section-link">
          Jump to Hackathons <span>&rsaquo;</span>
        </a>
      </div>
    </section>
  );
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
