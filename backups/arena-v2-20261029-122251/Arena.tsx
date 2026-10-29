import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

type ArenaCardDef = {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  status: "LIVE" | "OPEN" | "UPCOMING";
  image: string;
  alt: string;
};

const ARENA_CARDS: ArenaCardDef[] = [
  {
    id: "ai",
    number: "01",
    title: "AI INNOVATION",
    category: "INTELLIGENCE",
    description: "Build intelligent solutions for problems that matter.",
    status: "LIVE",
    image: "/images/arena-ai.svg",
    alt: "An AI workspace interface with a highlighted model panel.",
  },
  {
    id: "web",
    number: "02",
    title: "FUTURE WEB",
    category: "WEB PLATFORM",
    description: "Design and ship the next generation of digital experiences.",
    status: "OPEN",
    image: "/images/arena-web.svg",
    alt: "A code editor beside a browser frame.",
  },
  {
    id: "campus",
    number: "03",
    title: "CAMPUS TECH",
    category: "STUDENT LIFE",
    description: "Create technology that makes student life better.",
    status: "UPCOMING",
    image: "/images/arena-campus.svg",
    alt: "A CampusCode showcase screen with community details.",
  },
];

/* ------------------------------------------------------------------ */
/* Live smoke — canvas 2D, no textures, no video                       */
/* ------------------------------------------------------------------ */

type Puff = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  peak: number;
  rot: number;
  vrot: number;
  sprite: number;
  wobble: number;
  burst: boolean;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap tileable value noise, sampled with smooth interpolation. */
function makeNoise(rand: () => number, grid: number) {
  const g: number[] = [];
  for (let i = 0; i < grid * grid; i += 1) g.push(rand());
  return (u: number, v: number) => {
    const x = u * grid;
    const y = v * grid;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const x0 = ((ix % grid) + grid) % grid;
    const y0 = ((iy % grid) + grid) % grid;
    const x1 = (x0 + 1) % grid;
    const y1 = (y0 + 1) % grid;
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = g[y0 * grid + x0] + (g[y0 * grid + x1] - g[y0 * grid + x0]) * sx;
    const bottom = g[y1 * grid + x0] + (g[y1 * grid + x1] - g[y1 * grid + x0]) * sx;
    return top + (bottom - top) * sy;
  };
}

/**
 * A soft, irregular grey cloud baked once into an offscreen canvas. Layering
 * octaves of value noise under a radial falloff keeps the smoke from reading
 * as perfect circles or repeated blobs.
 */
function buildSprite(size: number, tone: number, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(size, size);
  const rand = mulberry32(seed);
  const coarse = makeNoise(rand, 5);
  const mid = makeNoise(rand, 9);
  const fine = makeNoise(rand, 17);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const noise = coarse(u, v) * 0.52 + mid(u, v) * 0.31 + fine(u, v) * 0.17;
      const dx = (u - 0.5) * 2;
      const dy = (v - 0.5) * 2;
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy * 0.82));
      const falloff = Math.pow(1 - dist, 1.55);
      const alpha = Math.max(0, Math.min(1, (noise * 1.62 - 0.36) * falloff));
      const i = (y * size + x) * 4;
      image.data[i] = tone;
      image.data[i + 1] = tone;
      image.data[i + 2] = tone;
      image.data[i + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

type SmokeController = {
  burst: (dir?: number) => void;
  nudge: (dir: number) => void;
  setRunning: (running: boolean) => void;
  destroy: () => void;
};

function createSmoke(
  canvas: HTMLCanvasElement,
  isReduced: () => boolean,
): SmokeController {
  const ctx = canvas.getContext("2d", { alpha: true });
  const sprites = [0, 1, 2, 3, 4].map((i) =>
    buildSprite(128, 102 + i * 13, 9173 + i * 733),
  );

  let width = 0;
  let height = 0;
  let puffs: Puff[] = [];
  let raf = 0;
  let running = false;
  let last = 0;
  let time = 0;
  let wind = 0;
  let rand = mulberry32(24680);

  const dpr = () =>
    Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);

  const baseRadius = () => Math.max(width, height) * 0.115;
  const floorY = () => height * 0.8;

  function spawn(age = 0): Puff {
    const r = baseRadius();
    const spread = width * 0.42;
    return {
      x: width * 0.5 + (rand() - 0.5) * spread * 2,
      y: floorY() + rand() * height * 0.16,
      r: r * (0.55 + rand() * 0.85),
      vx: (rand() - 0.5) * 7,
      vy: -(7 + rand() * 10),
      age,
      life: 10 + rand() * 9,
      peak: 0.055 + rand() * 0.05,
      rot: rand() * Math.PI * 2,
      vrot: (rand() - 0.5) * 0.05,
      sprite: Math.floor(rand() * sprites.length) % sprites.length,
      wobble: rand() * Math.PI * 2,
      burst: false,
    };
  }

  function spawnBurst(dir = 0): Puff {
    const r = baseRadius();
    return {
      x: width * 0.5 + (rand() - 0.5) * width * 0.34 + dir * width * 0.04,
      y: floorY() + rand() * height * 0.05,
      r: r * (1.0 + rand() * 1.0),
      vx: (rand() - 0.5) * 26 + dir * 20,
      vy: -(18 + rand() * 22),
      age: 0,
      life: 4.6 + rand() * 3.4,
      peak: 0.075 + rand() * 0.06,
      rot: rand() * Math.PI * 2,
      vrot: (rand() - 0.5) * 0.16,
      sprite: Math.floor(rand() * sprites.length) % sprites.length,
      wobble: rand() * Math.PI * 2,
      burst: true,
    };
  }

  function measure() {
    const nextW = canvas.clientWidth;
    const nextH = canvas.clientHeight;
    if (!nextW || !nextH) return false;

    const ratio = dpr();
    const resized = nextW !== width || nextH !== height;

    if (resized && width && height) {
      const sx = nextW / width;
      const sy = nextH / height;
      for (const puff of puffs) {
        puff.x *= sx;
        puff.y *= sy;
      }
    }

    width = nextW;
    height = nextH;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    return resized;
  }

  function count() {
    if (width < 560) return 18;
    if (width < 900) return 28;
    return 38;
  }

  function seed() {
    puffs = [];
    const total = count();
    for (let i = 0; i < total; i += 1) {
      const puff = spawn(rand() * 10);
      puff.age = rand() * puff.life * 0.85;
      puffs.push(puff);
    }
  }

  function draw(dt: number, advance: boolean) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const ambientTarget = count();
    let ambient = 0;

    for (let i = 0; i < puffs.length; i += 1) {
      const puff = puffs[i];

      if (advance) {
        puff.age += dt;
        if (puff.age >= puff.life) {
          if (puff.burst) {
            puffs.splice(i, 1);
            i -= 1;
            continue;
          }
          puffs[i] = spawn(0);
          continue;
        }
        const turbulence = Math.sin(time * 0.42 + puff.wobble) * 3.2;
        puff.vx += (turbulence + wind - puff.vx) * 0.5 * dt;
        puff.vy += Math.sin(time * 0.27 + puff.wobble * 1.7) * 1.6 * dt;
        puff.x += puff.vx * dt;
        puff.y += puff.vy * dt;
        puff.rot += puff.vrot * dt;
        wind *= 1 - 0.7 * dt;
      }

      if (!puff.burst) ambient += 1;

      const k = Math.min(1, puff.age / puff.life);
      const rise = k < (puff.burst ? 0.12 : 0.18)
        ? k / (puff.burst ? 0.12 : 0.18)
        : k > 0.62
          ? Math.max(0, 1 - (k - 0.62) / 0.38)
          : 1;
      const alpha = puff.peak * rise * rise;
      if (alpha <= 0.001) continue;

      const grow = 1 + k * 0.42;
      // Slightly taller than wide, so puffs read as rising vapour rather than fog discs.
      const rx = puff.r * grow * 0.82;
      const ry = puff.r * grow * 1.22;

      ctx.save();
      ctx.translate(puff.x, puff.y);
      ctx.rotate(puff.rot);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprites[puff.sprite], -rx, -ry, rx * 2, ry * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (advance && ambient < ambientTarget) {
      puffs.push(spawn(0));
    }
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    time += dt;
    draw(dt, true);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    if (measure()) {
      if (!puffs.length) seed();
    } else if (!puffs.length) {
      return;
    }
    if (isReduced()) {
      // A single still frame: no continuous motion at all.
      draw(0, false);
      return;
    }
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  start();

  return {
    burst(dir = 0) {
      measure();
      if (!puffs.length) seed();
      if (isReduced()) {
        draw(0, false);
        return;
      }
      const total = width < 560 ? 6 : 9;
      for (let i = 0; i < total; i += 1) puffs.push(spawnBurst(dir));
      if (puffs.length > 64) puffs.splice(0, puffs.length - 64);
      wind += dir * 3;
      if (!running) start();
    },
    nudge(dir) {
      if (isReduced()) return;
      const total = 3;
      for (let i = 0; i < total; i += 1) {
        const puff = spawnBurst(dir);
        puff.peak *= 0.6;
        puff.r *= 0.8;
        puff.vy *= 0.6;
        puffs.push(puff);
      }
      wind += dir * 6;
      if (puffs.length > 64) puffs.splice(0, puffs.length - 64);
      if (!running) start();
    },
    setRunning(next: boolean) {
      if (next) {
        measure();
        if (!puffs.length) seed();
        start();
      } else {
        stop();
      }
    },
    destroy() {
      stop();
      puffs = [];
      sprites.length = 0;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

const COMPACT_OFFSET_Y = [8, -6, -20];
const COMPACT_DEPTH = [0, -46, -92];
const COMPACT_SCALE = [1, 0.965, 0.93];

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function Arena() {
  const reducedMotion = useReducedMotion();
  const [finePointer, setFinePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [entered, setEntered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);

  const smokeRef = useRef<SmokeController | null>(null);
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const spreadRef = useRef(0);
  const focusRef = useRef<number[]>([1, 0, 0]);
  const targetSpreadRef = useRef(0);
  const targetFocusRef = useRef<number[]>([1, 0, 0]);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const expandedRef = useRef(false);
  const activeRef = useRef(0);
  const pinnedRef = useRef(false);
  // State at the moment of the press, so a hover that already focused a card
  // is not mistaken for a second click on a pinned card.
  const pressRef = useRef<{ index: number; active: number; pinned: boolean } | null>(null);

  /* --- layout ------------------------------------------------------ */

  const applyTransforms = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.clientWidth;
    const shadows = stage.querySelector<HTMLElement>(".arena-floor");

    const first = slotRefs.current[0];
    const cardWidth = first?.offsetWidth ?? 280;
    const sep = Math.min(
      cardWidth + 26,
      Math.max(cardWidth * 0.34, (stageWidth - 40 - cardWidth) / 2),
    );

    const spread = spreadRef.current;

    slotRefs.current.forEach((slot, i) => {
      const card = slot?.querySelector<HTMLElement>(".arena-card");
      if (!slot || !card) return;

      const focus = focusRef.current[i] ?? 0;
      const s = spread;

      const x = (i - 1) * sep * s;
      const y = COMPACT_OFFSET_Y[i] * (1 - s) + focus * -15 * s;
      const z = COMPACT_DEPTH[i] * (1 - s) + (focus * 74 - (1 - focus) * 34) * s;
      const scale =
        COMPACT_SCALE[i] * (1 - s) + (1 + 0.042 * focus - 0.028 * (1 - focus)) * s;
      const rotateY = (1 - i) * 3.4 * s * (1 - focus * 0.7);
      const rotateX = (1 - s) * 4 + s * 1.2;

      card.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) ` +
        `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      slot.style.zIndex = String(10 - i + Math.round(focus * 22));
      card.classList.toggle("is-active", focus > 0.5);
      card.style.setProperty("--arena-focus", focus.toFixed(3));
    });

    if (shadows) {
      shadows.style.opacity = String(0.45 + spread * 0.55);
      shadows.style.transform = `translate3d(0,0,0) scaleX(${0.72 + spread * 0.4})`;
    }
  }, []);

  /* --- motion loop ------------------------------------------------- */

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(0.034, Math.max(0.001, (now - lastFrameRef.current) / 1000));
    lastFrameRef.current = now;

    const steps = 3;
    const h = dt / steps;
    let moving = false;

    for (let step = 0; step < steps; step += 1) {
      // Damped spring: restrained overshoot, quick natural settle.
      const ds = targetSpreadRef.current - spreadRef.current;
      spreadRef.current += ds * Math.min(1, h * 11);
      if (Math.abs(ds) > 0.0008) moving = true;

      for (let i = 0; i < focusRef.current.length; i += 1) {
        const df = targetFocusRef.current[i] - focusRef.current[i];
        focusRef.current[i] += df * Math.min(1, h * 12);
        if (Math.abs(df) > 0.0008) moving = true;
      }
    }

    if (Math.abs(targetSpreadRef.current - spreadRef.current) < 0.0008) {
      spreadRef.current = targetSpreadRef.current;
    }
    for (let i = 0; i < focusRef.current.length; i += 1) {
      if (Math.abs(targetFocusRef.current[i] - focusRef.current[i]) < 0.0008) {
        focusRef.current[i] = targetFocusRef.current[i];
      }
    }

    applyTransforms();

    if (moving) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
    }
  }, [applyTransforms]);

  const ensureLoop = useCallback(() => {
    if (reducedMotion) {
      spreadRef.current = targetSpreadRef.current;
      focusRef.current = [...targetFocusRef.current];
      applyTransforms();
      return;
    }
    if (rafRef.current) return;
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransforms, reducedMotion, tick]);

  const setLayout = useCallback(
    (nextActive: number, nextExpanded: boolean, burst: boolean, dir = 0) => {
      const wasExpanded = expandedRef.current;
      expandedRef.current = nextExpanded;
      activeRef.current = nextActive;
      targetSpreadRef.current = nextExpanded ? 1 : 0;
      targetFocusRef.current = nextExpanded
        ? [0, 1, 2].map((i) => (i === nextActive ? 1 : 0))
        : [1, 0, 0];

      setExpanded(nextExpanded);
      setActive(nextActive);
      ensureLoop();

      if (nextExpanded && !wasExpanded && burst) {
        smokeRef.current?.burst(dir);
      } else if (nextExpanded && wasExpanded && burst) {
        smokeRef.current?.nudge(dir);
      }
    },
    [ensureLoop],
  );

  /* --- entrance ---------------------------------------------------- */

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
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  /* --- smoke lifecycle --------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const controller = createSmoke(canvas, () => reducedRef.current);
    smokeRef.current = controller;

    let visible = false;
    const visibility = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        controller.setRunning(visible && document.visibilityState === "visible");
      },
      { rootMargin: "80px 0px" },
    );
    visibility.observe(stage);

    const onVisibility = () => controller.setRunning(visible && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    const resize = new ResizeObserver(() => {
      controller.setRunning(visible && document.visibilityState === "visible");
      applyTransforms();
    });
    resize.observe(stage);

    return () => {
      visibility.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      controller.destroy();
      smokeRef.current = null;
    };
  }, [applyTransforms]);

  // Reduced motion: no spring, no scrolling hijack, instant states.
  useEffect(() => {
    if (!reducedMotion) return;
    spreadRef.current = targetSpreadRef.current;
    focusRef.current = [...targetFocusRef.current];
    applyTransforms();
  }, [reducedMotion, applyTransforms]);

  useEffect(() => {
    applyTransforms();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [applyTransforms]);

  /* --- interaction ------------------------------------------------- */

  const expandTo = useCallback(
    (index: number) => {
      const dir = index - activeRef.current;
      setLayout(index, true, true, dir);
    },
    [setLayout],
  );

  const collapse = useCallback(() => {
    setLayout(activeRef.current, false, false);
  }, [setLayout]);

  const handleCardClick = useCallback(
    (index: number, fromKeyboard: boolean) => {
      const press = pressRef.current;
      const alreadyPinned = fromKeyboard
        ? pinnedRef.current && activeRef.current === index
        : Boolean(press && press.pinned && press.active === index);

      if (expandedRef.current && alreadyPinned) {
        pinnedRef.current = false;
        collapse();
        return;
      }
      pinnedRef.current = true;
      expandTo(index);
    },
    [collapse, expandTo],
  );

  const handleCardFocus = useCallback(
    (index: number) => {
      if (!expandedRef.current) {
        expandTo(index);
      } else if (activeRef.current !== index) {
        setLayout(index, true, true, index - activeRef.current);
      }
    },
    [expandTo, setLayout],
  );

  useEffect(() => {
    const canHover = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canHover()) return;
      if (expandedRef.current) return;
      expandTo(activeRef.current);
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canHover()) return;
      if (pinnedRef.current) return;
      if (expandedRef.current) collapse();
    };

    const onPointerDown = (event: PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      // Inside the stage, the stage's own handler decides: a press on a card
      // selects it, a press on the studio floor collapses the row.
      if (event.target instanceof Node && stage.contains(event.target)) return;
      pinnedRef.current = false;
      if (expandedRef.current) collapse();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      pinnedRef.current = false;
      if (expandedRef.current) collapse();
    };

    const stage = stageRef.current;
    stage?.addEventListener("pointerenter", onPointerEnter);
    stage?.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      stage?.removeEventListener("pointerenter", onPointerEnter);
      stage?.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [collapse, expandTo]);

  /* --- render ------------------------------------------------------ */

  return (
    <section
      className={`landing-hackathons arena ${entered ? "is-entered" : ""}`}
      id="hackathons"
      ref={sectionRef}
      data-expanded={expanded ? "true" : "false"}
    >
      <div className="section-heading arena-heading">
        <div className="arena-heading-left">
          <h2 className="arena-title" aria-label="04 — Enter the arena">
            <span className="arena-num">04</span>
            <span className="arena-dash" aria-hidden="true">
              —
            </span>
            <span className="arena-title-text">ENTER THE ARENA</span>
          </h2>
        </div>
        <p className="arena-heading-support">ACTIVE CHALLENGES RIGHT NOW.</p>
      </div>

      <div className="arena-rule" aria-hidden="true" />

      <div
        className="arena-stage"
        ref={stageRef}
        onPointerDown={(event) => {
          if (event.target instanceof Element && event.target.closest(".arena-card")) return;
          if (expandedRef.current) {
            pinnedRef.current = false;
            collapse();
            return;
          }
          // Touch has no hover, so the first tap on the deck opens it.
          if (event.pointerType !== "mouse") expandTo(activeRef.current);
        }}
      >
        <canvas className="arena-smoke" ref={canvasRef} aria-hidden="true" />
        <div className="arena-floor" aria-hidden="true" />

        <div
          className="arena-deck"
          role="group"
          aria-label="CampusCode challenge tracks"
        >
          {ARENA_CARDS.map((card, i) => (
            <div
              key={card.id}
              className="arena-slot"
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              style={{ ["--arena-index" as string]: i }}
            >
              <button
                type="button"
                className="arena-card"
                onClick={(event) => handleCardClick(i, event.detail === 0)}
                onPointerDown={() => {
                  pressRef.current = {
                    index: i,
                    active: activeRef.current,
                    pinned: pinnedRef.current,
                  };
                }}
                onFocus={() => handleCardFocus(i)}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  if (!expandedRef.current) return;
                  if (activeRef.current === i) return;
                  setLayout(i, true, true, i - activeRef.current);
                }}
                aria-pressed={expanded && active === i}
                aria-label={`${card.number} ${card.title} — ${card.description} Status ${card.status.toLowerCase()}`}
              >
                <div className="arena-card-media">
                  <img src={card.image} alt={card.alt} loading="lazy" draggable={false} />
                </div>
                <div className="arena-card-body">
                  <div className="arena-card-meta">
                    <span className="arena-card-number">{card.number}</span>
                    <span className="arena-card-category">{card.category}</span>
                  </div>
                  <h3 className="arena-card-title">{card.title}</h3>
                  <p className="arena-card-desc">{card.description}</p>
                  <div className="arena-card-foot">
                    <span className={`arena-status arena-status--${card.status.toLowerCase()}`}>
                      <i aria-hidden="true" />
                      {card.status}
                    </span>
                    <span className="arena-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="arena-foot">
        <span className="arena-hint">
          {reducedMotion ? "SELECT A TRACK" : finePointer ? "HOVER OR SELECT A TRACK" : "TAP A TRACK"}
        </span>
        <span className="arena-note">3 TRACKS · CHENNAI · 2026</span>
      </div>
    </section>
  );
}
