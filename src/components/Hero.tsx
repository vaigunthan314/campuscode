import { CubeScene, type ProgressRef } from "./CubeScene";
import { HeroOrbits, OrbitNetwork } from "./OrbitNetwork";
import { Navbar } from "./Navbar";

type HeroProps = {
  progress: ProgressRef;
  reducedMotion?: boolean;
};

export function Hero({ progress, reducedMotion = false }: HeroProps) {
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

      <Navbar />

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
          <a className="hero-explore" href="#hackathons">
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
