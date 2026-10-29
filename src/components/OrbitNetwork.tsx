export function OrbitNetwork() {
  return (
    <div className="hero-network" aria-hidden="true">
      <svg viewBox="0 0 1400 800" preserveAspectRatio="none">
        <path d="M0 600 C180 450 250 620 420 430 S680 80 900 270 S1150 500 1400 180" />
        <path d="M80 130 C280 300 380 80 570 270 S800 620 1080 500 S1250 400 1400 620" />
        <path d="M250 800 C400 600 570 650 720 460 S970 180 1160 80" />
        <circle cx="420" cy="430" r="4" />
        <circle cx="900" cy="270" r="4" />
        <circle cx="1080" cy="500" r="4" />
        <circle cx="570" cy="270" r="4" />
        <circle cx="1160" cy="80" r="4" />
      </svg>
    </div>
  );
}

export function HeroOrbits() {
  return (
    <div className="hero-orbits" aria-hidden="true">
      <div className="hero-orbit hero-orbit-a" />
      <div className="hero-orbit hero-orbit-b" />
      <span className="hero-orbit-node node-a" />
      <span className="hero-orbit-node node-b" />
      <span className="hero-orbit-node node-c" />
    </div>
  );
}
