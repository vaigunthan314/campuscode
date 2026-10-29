import { useState, useEffect, useRef, useMemo } from 'react';
import { MissionScene } from './MissionScene';

type Stage = 0 | 1 | 2 | 3;

const STAGES = ['DISCOVER', 'TEAM UP', 'BUILD', 'SHIP'] as const;

export function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [orbit, setOrbit] = useState(false);
  const [wordLit, setWordLit] = useState(false);

  const reducedMotion = useMemo(
    () =>
      typeof window === 'undefined'
        ? false
        : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + rect.height * 0.05;
      const bottom = rect.bottom - rect.height * 0.15;
      const total = bottom - top;
      if (total <= 0) return;
      const p = clamp((clamp(window.scrollY, top, bottom) - top) / total, 0, 1);
      const idx = clamp(Math.round(p * (STAGES.length - 1)), 0, STAGES.length - 1);
      setStage(idx as Stage);
      setWordLit(p > 0.32);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goToStage = (i: number) => {
    setStage(i as Stage);
  };

  return (
    <section
      className="landing-mission"
      ref={sectionRef}
      id="mission"
      aria-label="The Mission"
      data-reduced={reducedMotion ? '1' : '0'}
    >
      <div className="mission-frame-rules" aria-hidden="true" />

      {/* index marks */}
      <div className="mission-index" aria-hidden="true">
        <div className="mission-index__left">
          <div className="mission-index__label">
            <span className="mission-index__dot" />
            05 / THE MISSION
          </div>
        </div>
        <div className="mission-index__right">
          <p className="mission-index__caption">
            FROM IDEAS ON CAMPUS / TO SOLUTIONS IN THE REAL WORLD.
          </p>
        </div>
      </div>

      {/* headline */}
      <div className="mission-headline">
        <div className="mission-headline__stack">
          <span className="mission-word--solid">CAMPUS</span>
          <span
            className={`mission-word--wire${wordLit ? ' is-lit' : ''}`}
            data-word="CODE"
          >
            CODE
          </span>
        </div>
      </div>

      {/* manifesto */}
      <div className="mission-manifesto">
        <p className="mission-manifesto__lead">
          Connecting students to real-world problems through organized hackathons,
          shared tools, and a community that turns ideas into shipped products.
        </p>
        <p className="mission-manifesto__sub">
          BUILT BY STUDENTS. FOR STUDENTS. FOR BUILDERS.
        </p>
      </div>

      {/* metrics */}
      <div className="mission-metrics" role="list" aria-label="CampusCode impact metrics">
        {[
          { n: '50+', l: 'Hackathons' },
          { n: '1200+', l: 'Students' },
          { n: '100+', l: 'Projects' },
          { n: '20+', l: 'College Partners' },
        ].map(item => (
          <div key={item.l} className="mission-metric" role="listitem">
            <span className="mission-metric__number">{item.n}</span>
            <span className="mission-metric__label">{item.l}</span>
          </div>
        ))}
      </div>

      {/* 3D scene — renders its own scrubber pills, orbit toggle, and stage labels */}
      <div className="mission-scene" aria-hidden="true">
        <MissionScene stage={stage} reducedMotion={reducedMotion || orbit} />
      </div>

      {/* orbit toggle only when scene already handles scrubber internally */}
      <button
        type="button"
        className="mission-orbit-toggle"
        onClick={() => setOrbit((o) => !o)}
        aria-pressed={orbit}
        aria-label={orbit ? 'Exit 360° inspect orbit mode' : 'Enter 360° inspect orbit mode'}
      >
        {orbit ? 'Exit Orbit' : 'Orbit'}
        <kbd aria-hidden="true">⌘3</kbd>
      </button>

      {/* scroll-locked stage indicator, separate from interactive scrubber */}
      <div className="mission-scrubber__row" aria-hidden="true">
        <div className="mission-scrubber__stage">
          <span className="mission-scrubber__stage-dot" />
          <span>ACTIVE STAGE</span>
        </div>
        <div className="mission-scrubber__stage is-lit">
          <span className="mission-scrubber__stage-dot" />
          <span>LIME</span>
        </div>
        <div className="mission-scrubber__stage is-lit-purple">
          <span className="mission-scrubber__stage-dot" />
          <span>PURPLE</span>
        </div>
        <div className="mission-scrubber__hint">
          <span aria-hidden="true">SCROLL OR CLICK THE TIMELINE</span>
        </div>
      </div>

      {/* reduced-motion fallback hint */}
      <div className="mission-reduced-hint" aria-hidden="true">
        <span>PLAIN-HTML FALLBACK — SCROLL TO ADVANCE STAGES</span>
      </div>
    </section>
  );
}
