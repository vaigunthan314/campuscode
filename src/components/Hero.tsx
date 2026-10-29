import { useEffect, useState } from "react";
import { CubeScene, type ProgressRef } from "./CubeScene";
import { Logo } from "./Logo";
import { HeroOrbits, OrbitNetwork } from "./OrbitNetwork";
import { scrollToSection } from "./scrollToSection";

type HeroProps = {
  progress: ProgressRef;
  reducedMotion?: boolean;
};

const NAV_ITEMS = [
  { label: "ABOUT", target: "about" },
  { label: "HOW IT WORKS", target: "how" },
  { label: "HACKATHONS", target: "hackathons" },
  { label: "COMMUNITY", target: "community" },
] as const;

const LOGIN_URL = "https://campus-code-ten.vercel.app/login";
const JOIN_URL = "https://campus-code-ten.vercel.app/register";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Hero({ progress, reducedMotion = false }: HeroProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <section className="landing-hero">
      <div className="landing-hero-grid" aria-hidden="true" />
      <div className="hero-glow glow-one" aria-hidden="true" />
      <div className="hero-glow glow-two" aria-hidden="true" />
      <div className="hero-glow glow-three" aria-hidden="true" />
      <OrbitNetwork />

      <div className="hero-object" aria-hidden="true">
        <div className="hero-object-halo" />
        <HeroOrbits />
        <CubeScene progress={progress} reducedMotion={reducedMotion} />
      </div>

      <header className="landing-nav">
        <Logo onClick={scrollToTop} />
        <nav className="landing-links" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button key={item.target} type="button" onClick={() => goTo(item.target)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="landing-nav-actions">
          <a className="landing-login" href={LOGIN_URL} rel="noreferrer">
            LOGIN
          </a>
          <a className="landing-join" href={JOIN_URL} rel="noreferrer">
            JOIN CAMPUSCODE <span aria-hidden="true">↗</span>
          </a>
        </div>
        <button
          type="button"
          className="landing-menu"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} id="mobile-navigation" aria-hidden={!menuOpen}>
        <div className="mobile-menu-head">
          <span>MENU / 01</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav aria-label="Mobile primary">
          {NAV_ITEMS.map((item, index) => (
            <button key={item.target} type="button" onClick={() => goTo(item.target)}>
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mobile-menu-actions">
          <a href={LOGIN_URL} rel="noreferrer">
            LOGIN
          </a>
          <a href={JOIN_URL} rel="noreferrer">
            JOIN CAMPUSCODE ↗
          </a>
        </div>
        <p className="mobile-menu-foot">CHENNAI · INDIA — BUILD / COMPETE / SHIP</p>
      </div>

      <div className="hero-top-line">
        <span>
          <i aria-hidden="true" />
          THE DIGITAL HOME FOR STUDENT INNOVATION
        </span>
        <span>CHENNAI · INDIA</span>
      </div>

      <div className="hero-content">
        <div className="hero-label">CAMPUSCODE / 001</div>
        <h1 aria-label="Build. Compete. Ship.">
          <span className="hero-line">
            <span className="hero-line-inner">BUILD</span>
          </span>
          <span className="hero-line">
            <span className="hero-line-inner hero-outline">COMPETE</span>
          </span>
          <span className="hero-line">
            <span className="hero-line-inner">SHIP.</span>
          </span>
        </h1>
        <div className="hero-description">
          <p>
            A digital arena for students
            <br />
            who don't just have ideas.
            <br />
            They build them.
          </p>
          <a className="hero-explore" href="/hackathons">
            EXPLORE HACKATHONS
            <b aria-hidden="true">↗</b>
          </a>
        </div>
      </div>

      <div className="hero-bottom" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <div className="hero-scroll-line">
          <i />
        </div>
        <span>01 / 05</span>
      </div>
    </section>
  );
}
