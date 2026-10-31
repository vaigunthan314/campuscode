import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { AmbienceAPI } from "./Ambience";

type LoadingPrimerProps = {
  ambience: AmbienceAPI;
  onReady: () => void;
  reducedMotion?: boolean;
  /** False when the entry gate already started the loading cue in its gesture. */
  autoPlay?: boolean;
};

type SliceSpec = {
  /** Top edge of the slice, as a percentage of the word box. */
  y: number;
  /** Slice height, as a percentage of the word box. */
  h: number;
  /** How far this slice travels during a burst. */
  strength: number;
  /** Filled white, or outline only. */
  solid: boolean;
};

const WORD = "LOADING";

/** Six slices: top edge, ~20%, ~35%, centre, ~65%, bottom edge. */
const SLICES: SliceSpec[] = [
  { y: 5, h: 7, strength: 1, solid: false },
  { y: 21, h: 5, strength: 1.7, solid: true },
  { y: 36, h: 8, strength: 0.9, solid: false },
  { y: 47, h: 6, strength: 2.1, solid: true },
  { y: 64, h: 5, strength: 1.3, solid: false },
  { y: 86, h: 7, strength: 1.8, solid: true },
];

const SCRATCHES = [
  { top: "33%", left: "16%", width: "44%" },
  { top: "61%", left: "39%", width: "37%" },
];

const LOAD_MS = 3500;
const GLITCH_CYCLE = 3.5;

/**
 * Staged travel so the bar reads like a machine reporting progress, not a
 * metronome. Pairs of [time, progress] with short plateaus between them.
 */
const PROGRESS_STAGES: Array<[number, number]> = [
  [0, 0],
  [0.1, 0.14],
  [0.16, 0.16],
  [0.33, 0.36],
  [0.4, 0.4],
  [0.56, 0.58],
  [0.63, 0.62],
  [0.79, 0.84],
  [0.86, 0.86],
  [1, 1],
];

function stagedProgress(time: number) {
  for (let index = 1; index < PROGRESS_STAGES.length; index += 1) {
    const [endT, endP] = PROGRESS_STAGES[index];
    const [startT, startP] = PROGRESS_STAGES[index - 1];
    if (time <= endT) {
      const span = endT - startT || 1;
      const local = Math.min(1, Math.max(0, (time - startT) / span));
      return startP + (endP - startP) * local;
    }
  }
  return 1;
}

function Crosshair({ top, left, size }: { top: string; left: string; size: number }) {
  return (
    <span
      aria-hidden="true"
      className="cine-primer-crosshair"
      style={{ top, left, width: size, height: size }}
    >
      <span className="cine-primer-crosshair-line-h" />
      <span className="cine-primer-crosshair-line-v" />
      <span className="cine-primer-crosshair-center" />
    </span>
  );
}

export function LoadingPrimer({
  ambience,
  onReady,
  reducedMotion = false,
  autoPlay = true,
}: LoadingPrimerProps) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  const shellRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const hudLeftRef = useRef<HTMLDivElement | null>(null);
  const hudRightRef = useRef<HTMLDivElement | null>(null);
  const grainRef = useRef<HTMLSpanElement | null>(null);
  const wordRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLSpanElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const echoARef = useRef<HTMLSpanElement | null>(null);
  const echoBRef = useRef<HTMLSpanElement | null>(null);
  const sliceRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const onReadyRef = useRef(onReady);
  const ambienceRef = useRef(ambience);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // The audio API object changes identity when mute toggles; keeping it in a
  // ref stops the progress run from restarting on that rerender.
  useEffect(() => {
    ambienceRef.current = ambience;
  });

  // The cue belongs to this screen only. When it leaves, a later gesture must
  // not resurrect the loading sound over the site.
  useEffect(() => () => ambienceRef.current.stopLoading(), []);

  const writeProgress = useCallback((progress: number) => {
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
    }
    if (tagRef.current) {
      tagRef.current.textContent =
        progress >= 1 ? "READY" : `LOADING ${Math.round(progress * 100)}%`;
    }
  }, []);

  // Procedural grain: one 128px noise tile, generated once, moved by CSS.
  useEffect(() => {
    if (reducedMotion) return;
    const node = grainRef.current;
    if (!node) return;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = context.createImageData(size, size);
    const data = image.data;
    for (let index = 0; index < data.length; index += 4) {
      const speck = Math.random();
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = speck > 0.93 ? 26 + Math.random() * 34 : 0;
    }
    context.putImageData(image, 0, 0);
    node.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
  }, [reducedMotion]);

  // Opening: the word eases up from slightly small and almost transparent,
  // with the HUD, crosshairs and progress settling in behind it.
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const shell = shellRef.current;
    if (!shell) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

      timeline.fromTo(
        ".cine-primer-word",
        { scale: 0.88, opacity: 0.06 },
        { scale: 1, opacity: 1, duration: 0.8 },
        0,
      );
      timeline.fromTo(
        ".cine-primer-hud-left",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.1,
      );
      timeline.fromTo(
        ".cine-primer-hud-right",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.15,
      );
      timeline.fromTo(
        ".cine-primer-crosshair",
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        0.2,
      );
      timeline.fromTo(
        ".cine-primer-progress",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.25,
      );
    }, shell);

    return () => {
      context.revert();
    };
  }, [reducedMotion]);

  // One timeline drives every glitch: instant jumps on transform only.
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const word = wordRef.current;
    if (!word) return;

    const slices = sliceRefs.current.filter(
      (node): node is HTMLSpanElement => node !== null,
    );
    if (slices.length === 0) return;

    const echoes = [echoARef.current, echoBRef.current].filter(
      (node): node is HTMLSpanElement => node !== null,
    );
    const fill = fillRef.current;
    const hud = [hudLeftRef.current, hudRightRef.current].filter(
      (node): node is HTMLDivElement => node !== null,
    );

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
      // Fixed cycle length keeps the loop and the bar in the same rhythm.
      timeline.to({}, { duration: GLITCH_CYCLE }, 0);

      const burst = (at: number, power: number) => {
        // Deterministic pseudo-random based on timestamp to keep it stable across renders
        const seed = Math.floor(at * 1000);
        const pseudoRandom = (offset: number) => {
          const x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
        };

        slices.forEach((element, index) => {
          const spec = SLICES[index];
          const direction = index % 2 === 0 ? 1 : -1;
          const travel = Math.round(spec.strength * power * direction * 14);
          // More frequent vertical movement for visible jerkiness
          const vertical = pseudoRandom(index * 7 + 1) < 0.4 ? (pseudoRandom(index * 7 + 2) < 0.5 ? 8 : -8) : 0;

          // First jump
          timeline.set(element, { x: travel, y: vertical }, at);
          // Second position (opposite direction, smaller)
          timeline.set(element, { x: -Math.round(travel * 0.5), y: 0 }, at + 0.04);
          // Return to zero
          timeline.set(element, { x: 0, y: 0 }, at + 0.1);
        });

        if (echoes.length > 0) {
          timeline.set(echoes, { x: 3 + power * 2.5, y: -2 }, at);
          timeline.set(echoes, { x: -2, y: 1 }, at + 0.05);
          timeline.set(echoes, { x: 0, y: 0 }, at + 0.1);
        }
        if (fill) {
          timeline.set(fill, { x: -3 - power * 2 }, at + 0.01);
          timeline.set(fill, { x: 2 + power }, at + 0.06);
          timeline.set(fill, { x: 0 }, at + 0.1);
        }

        // More aggressive skew and opacity flickers on the main word
        const skewAmount = power > 1.2 ? (pseudoRandom(10) < 0.5 ? 2.5 : -2.2) : (pseudoRandom(20) < 0.5 ? 1.2 : -1.0);
        timeline.set(
          word,
          { skewX: skewAmount, opacity: 0.75 + pseudoRandom(30) * 0.1 },
          at + 0.01,
        );
        // Brief opacity dip
        timeline.set(word, { opacity: 0.82 }, at + 0.05);
        // Return to normal
        timeline.set(word, { skewX: 0, opacity: 1 }, at + 0.1);

        // HUD flicker
        if (hud.length > 0) {
          timeline.set(hud, { opacity: 0.2 }, at);
          timeline.set(hud, { opacity: 0.6 }, at + 0.03);
          timeline.set(hud, { opacity: 1 }, at + 0.08);
        }
      };

      // Frequent, varied glitch bursts throughout the loading sequence.
      // Each burst: horizontal slice displacement, brief jumps, outline/fill misalignment,
      // short skew effects, and opacity flickers.
      burst(0.3, 1.4);
      burst(0.9, 1.0);
      burst(1.5, 1.8);
      burst(2.1, 1.2);
      burst(2.7, 1.6);
      burst(3.1, 0.9);

      // Small low-intensity drift on single slices during quieter moments.
      const idle: Array<[number, number, number]> = [
        [0.5, 0, 2],
        [1.2, 2, 1.5],
        [1.8, 4, 2.2],
        [2.4, 1, 1.8],
        [3.0, 3, 1.5],
      ];
      idle.forEach(([at, sliceIndex, amount]) => {
        const element = slices[sliceIndex];
        if (!element) return;
        timeline.set(element, { x: amount }, at);
        timeline.set(element, { x: 0 }, at + 0.08);
      });
    }, word);

    return () => {
      context.revert();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      writeProgress(0.62);
      setPhase("ready");
      onReadyRef.current();
      return;
    }

    const total = LOAD_MS;
    const startedAt = performance.now();
    let frame = 0;
    let lastWrite = 0;
    let finished = false;

    writeProgress(0);

    // Play the loading audio once, from the beginning — unless the entry gate
    // already started it inside its own user gesture.
    if (autoPlay) ambienceRef.current.playLoading();

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / total);
      const progress = stagedProgress(elapsed);

      if (now - lastWrite > 45) {
        writeProgress(progress);
        lastWrite = now;
      }

      if (elapsed < 1) {
        frame = requestAnimationFrame(step);
        return;
      }

      if (finished) return;
      finished = true;
      // The cue belongs to the loading sequence, so it ends with it.
      ambienceRef.current.stopLoading();
      writeProgress(1);
      setPhase("ready");
      onReadyRef.current();
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoPlay, reducedMotion, writeProgress]);

  return (
    <div className="cine-primer-shell" ref={shellRef}>
      <span ref={grainRef} aria-hidden="true" className="cine-primer-grain" />

      <div ref={hudLeftRef} aria-hidden="true" className="cine-primer-hud-left">
        <div className="cine-primer-hud-file">[ FILE_001 ]</div>
      </div>

      <div ref={hudRightRef} aria-hidden="true" className="cine-primer-hud-right">
        <div>SYS/0046.2216</div>
        <div>VID: 00.04.01</div>
        <div>MEM: 4096K</div>
      </div>

      <Crosshair top="50%" left="3vw" size={26} />
      <Crosshair top="50%" left="calc(100% - 3vw)" size={26} />

      <div aria-hidden="true" className="cine-primer-word" ref={wordRef}>
        <span ref={echoARef} className="cine-primer-echo cine-primer-echo-a">
          {WORD}
        </span>
        <span ref={echoBRef} className="cine-primer-echo cine-primer-echo-b">
          {WORD}
        </span>
        <span ref={outlineRef} className="cine-primer-word-outline">
          {WORD}
        </span>
        <span ref={fillRef} className="cine-primer-word-fill">
          {WORD}
        </span>

        {SLICES.map((slice, index) => (
          <span
            key={`slice-${index}`}
            ref={(node) => {
              sliceRefs.current[index] = node;
            }}
            className={`cine-primer-slice ${slice.solid ? "is-solid" : "is-outline"}`}
            style={{
              clipPath: `inset(${slice.y}% 0% ${100 - slice.y - slice.h}% 0%)`,
            }}
          >
            {WORD}
          </span>
        ))}

        {SCRATCHES.map((scratch, index) => (
          <span
            key={`scratch-${index}`}
            className="cine-primer-scratch"
            style={{
              top: scratch.top,
              left: scratch.left,
              width: scratch.width,
              animationDelay: `${index * 1.7}s`,
            }}
          />
        ))}
      </div>

      <div className="cine-primer-progress">
        <div ref={tagRef} className="cine-primer-progress-tag">
          LOADING 0%
        </div>
        <div aria-hidden="true" className="cine-primer-progress-track">
          <div ref={barRef} className="cine-primer-progress-fill" />
        </div>
      </div>

      <div className={`cine-primer-cue ${phase === "ready" ? "visible" : ""}`}>
        <span className="cine-primer-cue-label">SCROLL TO ENTER</span>
        <div aria-hidden="true" className="cine-primer-cue-line">
          <span className="cine-primer-cue-arrow" />
        </div>
      </div>

      <div className="cine-primer-status">
        <span className="cine-primer-status-label">PLEASE WAIT...</span>
        <button
          type="button"
          className="cine-primer-mute"
          data-sound-control=""
          onClick={() => {
            // While autoplay is refused, this press is the gesture that starts
            // the cue; once sound is live it is the usual mute toggle.
            if (ambience.autoplayBlocked) {
              ambience.unlock();
              return;
            }
            ambience.setMuted(!ambience.muted);
          }}
          aria-pressed={ambience.muted}
          aria-label={ambience.muted ? "Turn loading sound on" : "Turn loading sound off"}
        >
          {ambience.muted ? "SOUND OFF" : "SOUND ON"}
        </button>
      </div>
    </div>
  );
}
