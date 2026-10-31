import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Disable the unused variable warning for the style block
// @ts-ignore

/* ------------------------------------------------------------------ */
/*  Page content baked onto 2D canvases                              */
/* ------------------------------------------------------------------ */

type PageDef = { id: number; short: string; headline: string; body: string };

const PAGES: PageDef[] = [
  { id: 1, short: "01", headline: "DISCOVER", body: "Find a challenge that makes you want to build." },
  { id: 2, short: "02", headline: "TEAM UP", body: "Find people who share your ambition." },
  { id: 3, short: "03", headline: "BUILD", body: "Turn your idea into something people can use." },
  { id: 4, short: "04", headline: "SHIP", body: "Submit your work and take it to the arena." },
];

const PW = 1.6, PH = 2.15, T = 0.014, SPINE = 0.10, SHEETS = PAGES.length;
const COVER_THICK = 0.022;

/* ------------------------------------------------------------------ */
/*  Canvas texturing helpers                                          */
/* ------------------------------------------------------------------ */

function makeCanvas(w = 1024, h = 1365): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

function fillWhitePage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#eaeaeb";
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  // gutter shade
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.6, "rgba(0,0,0,0)");
  g.addColorStop(0.85, "rgba(20,20,20,0.05)");
  g.addColorStop(1, "rgba(20,20,20,0.10)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // vignette
  const v = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.72);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(20,20,20,0.05)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawIllustration(ctx: CanvasRenderingContext2D, page: PageDef, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#f4f4f1";
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = "#deded8";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  if (page.id === 1) {
    const cw = 118, gap = 10;
    const cards = [
      { tag: "AI", title: "AI Innovation", meta: "Mar 15-17 · 248" },
      { tag: "WEB", title: "Future Web", meta: "Apr 05-07 · 186" },
    ];
    cards.forEach((c, i) => {
      const cx = x + 12 + i*(cw+gap);
      ctx.fillStyle = "#7455ff";
      roundRect(ctx, cx, y+12, 64, 16, 3); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "500 8px 'DM Mono', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(c.tag, cx+32, y+20);
      ctx.fillStyle = "#111";
      ctx.font = "700 13px 'Inter', 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(c.title, cx+8, y+36);
      ctx.fillStyle = "#888";
      ctx.font = "400 8px 'DM Mono', monospace";
      ctx.fillText(c.meta, cx+8, y+56);
      ctx.fillStyle = "#e2e2dd";
      ctx.fillRect(cx+8, y+70, cw-16, 3);
      ctx.fillStyle = "#ebebe6";
      ctx.fillRect(cx+8, y+78, cw-22, 3);
    });
  } else if (page.id === 2) {
    const avatars = [
      { initials: "PS", name: "Priya S.", role: "Full Stack", color: "#7455ff" },
      { initials: "MK", name: "Marcus K.", role: "AI / ML", color: "#82b91a" },
      { initials: "AR", name: "Ayesha R.", role: "Design", color: "#ff6b6b" },
    ];
    const asz = 42, agap = 12;
    avatars.forEach((a, i) => {
      const cx = x + 12 + i*(asz+agap);
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(cx+asz/2, y+asz/2, asz/2-3, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 15px 'Inter', 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(a.initials, cx+asz/2, y+asz/2);
      ctx.fillStyle = "#111";
      ctx.font = "600 10px 'Inter', 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(a.name, cx+asz/2, y+asz+6);
      ctx.fillStyle = "#888";
      ctx.font = "400 8px 'DM Mono', monospace";
      ctx.fillText(a.role, cx+asz/2, y+asz+22);
    });
    const cardX = x + 3*asz + 4*agap + 6;
    const cardW = w - (cardX-x) - 14;
    const cardH = h - 24;
    ctx.fillStyle = "#f4f4f1";
    roundRect(ctx, cardX, y+12, cardW, cardH, 6); ctx.fill();
    ctx.strokeStyle = "#deded8";
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y+12, cardW, cardH, 6); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.font = "700 12px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("Team Workspace", cardX+12, y+24);
    ctx.fillStyle = "#888";
    ctx.font = "400 9px 'DM Mono', monospace";
    ctx.fillText("3 members active", cardX+12, y+42);
    const repos = ["campus-app", "ml-engine", "design-ui"];
    repos.forEach((repo, i) => {
      ctx.fillStyle = "#7455ff";
      ctx.fillRect(cardX+12, y+60+i*16, 5, 5);
      ctx.fillStyle = "#666";
      ctx.font = "400 9px 'DM Mono', monospace";
      ctx.fillText(repo, cardX+22, y+60+i*16+1);
    });
  } else if (page.id === 3) {
    const ew = 150, eh = h - 24;
    ctx.fillStyle = "#1a1a1a";
    roundRect(ctx, x+12, y+12, ew, eh, 6); ctx.fill();
    ctx.strokeStyle = "#333330";
    ctx.lineWidth = 1;
    roundRect(ctx, x+12, y+12, ew, eh, 6); ctx.stroke();
    ["#ff6b6b","#ffbd4a","#4ecdc4"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x+22+i*14, y+24, 3.5, 0, Math.PI*2);
      ctx.fill();
    });
    const code = [
      "import { CampusCode } from '@campus/code'",
      "const app = new CampusCode({",
      '  project: "hackathon-app",',
      '  team: "dev-team-01",',
      "})",
      "app.deploy()",
    ];
    ctx.fillStyle = "#666";
    ctx.font = "400 8.5px 'DM Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    code.forEach((line, i) => ctx.fillText(line, x+22, y+40+i*11));
    ctx.fillStyle = "#7455ff";
    roundRect(ctx, x+ew-72, y+32, 60, 16, 3); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 7px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("AI ASSISTANT", x+ew-42, y+40);
    const px = x+ew+16;
    const pw = w-(px-x)-14;
    const ph = eh;
    ctx.fillStyle = "#fff";
    roundRect(ctx, px, y+12, pw, ph, 6); ctx.fill();
    ctx.strokeStyle = "#deded8";
    ctx.lineWidth = 1;
    roundRect(ctx, px, y+12, pw, ph, 6); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.font = "700 11px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("CampusCode App", px+12, y+22);
    ctx.fillStyle = "#f0f0ec";
    ctx.fillRect(px+12, y+44, pw-24, 4);
    ctx.fillStyle = "#7455ff";
    ctx.fillRect(px+12, y+56, pw-24, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "600 9px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("BUILD PROJECT", px+pw/2, y+68);
    ctx.fillStyle = "#e2e2dd";
    ctx.fillRect(px+12, y+92, (pw-24)/3, 12);
    ctx.fillRect(px+12+(pw-24)/3, y+92, (pw-24)/3, 12);
    ctx.fillRect(px+12+2*(pw-24)/3, y+92, (pw-24)/3, 12);
    ctx.fillStyle = "#888";
    ctx.font = "400 7px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("12 issues", px+12+(pw-24)/6, y+98);
    ctx.fillText("8 solved", px+12+(pw-24)/2, y+98);
    ctx.fillText("4 tests", px+12+5*(pw-24)/6, y+98);
  } else {
    const cw = w-24, ch = h-24;
    ctx.fillStyle = "#f4f4f1";
    roundRect(ctx, x+12, y+12, cw, ch, 8); ctx.fill();
    ctx.strokeStyle = "#deded8";
    ctx.lineWidth = 1;
    roundRect(ctx, x+12, y+12, cw, ch, 8); ctx.stroke();
    ctx.fillStyle = "#7455ff";
    ctx.beginPath();
    ctx.moveTo(x+12+cw/2-16, y+34);
    ctx.lineTo(x+12+cw/2+16, y+34);
    ctx.lineTo(x+12+cw/2+10, y+52);
    ctx.lineTo(x+12+cw/2, y+62);
    ctx.lineTo(x+12+cw/2-10, y+52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("\u2605", x+12+cw/2, y+48);
    ctx.fillStyle = "#111";
    ctx.font = "800 18px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("Ready to Ship", x+22, y+74);
    ctx.fillStyle = "#666";
    ctx.font = "400 11px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("Your project is complete and ready for the arena.", x+22, y+98);
    ctx.fillStyle = "#111";
    roundRect(ctx, x+22, y+124, cw-44, 22, 4); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 9px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("\u2192  SUBMIT TO ARENA", x+12+cw/2, y+135);
    const statuses = [{ label: "Build", ok: true }, { label: "Tests", ok: true }, { label: "Review", ok: false }];
    statuses.forEach((s, i) => {
      const dx = x+12+cw+18+i*70;
      ctx.fillStyle = s.ok ? "#82b91a" : "#ffbd4a";
      ctx.beginPath();
      ctx.arc(dx, y+28, 9, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px 'Inter', 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(s.ok ? "\u2713" : "\u2026", dx, y+29);
      ctx.fillStyle = "#666";
      ctx.font = "400 8px 'DM Mono', monospace";
      ctx.textBaseline = "top";
      ctx.fillText(s.label, dx-2, y+42);
    });
  }
}

function renderCoverTexture(): THREE.CanvasTexture {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  fillWhitePage(ctx, c.width, c.height);
  // campuscode wordmark band
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#888";
  ctx.font = "500 12px 'DM Mono', monospace";
  ctx.fillText("CAMPUSCODE", c.width/2, 64);
  ctx.fillStyle = "#7455ff";
  ctx.beginPath();
  ctx.moveTo(c.width/2 - 80, 88);
  ctx.lineTo(c.width/2 + 80, 88);
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 178px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("CC", c.width/2, c.height/2 - 24);
  // fine spine registration tick
  ctx.strokeStyle = "#7455ff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(c.width/2 - 86, c.height/2 + 28);
  ctx.lineTo(c.width/2 + 86, c.height/2 + 28);
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "600 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("HACKATHON ARENA", c.width/2, c.height/2 + 74);
  ctx.fillStyle = "#aaa";
  ctx.font = "400 9px 'DM Mono', monospace";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText("CAMPUSCODE  ·  2026", 56, c.height - 52);
  ctx.fillStyle = "#7455ff";
  ctx.textAlign = "right";
  ctx.fillText("00", c.width - 56, c.height - 52);
  // thin printer registration marks
  ctx.fillStyle = "#a5d85e";
  for (const [mx, my] of [
    [70, 56], [c.width - 70, 56], [70, c.height - 56], [c.width - 70, c.height - 56]
  ]) {
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function renderPageTexture(page: PageDef): THREE.CanvasTexture {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  fillWhitePage(ctx, c.width, c.height);
  // running header
  ctx.fillStyle = "#888";
  ctx.font = "400 9px 'DM Mono', monospace";
  ctx.textBaseline = "top"; ctx.textAlign = "left";
  ctx.fillText("CAMPUSCODE  ·  HOW IT WORKS", 56, 40);
  ctx.fillStyle = "#7455ff";
  ctx.font = "600 14px 'DM Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(page.short, c.width - 56, 38);
  ctx.strokeStyle = "#deded8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 72);
  ctx.lineTo(c.width - 56, 72);
  ctx.stroke();
  ctx.strokeStyle = "#7455ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(56, 92);
  ctx.lineTo(190, 92);
  ctx.stroke();
  ctx.fillStyle = "#7455ff";
  ctx.font = "500 15px 'DM Mono', monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(page.short, 56, 118);
  ctx.fillStyle = "#111";
  ctx.font = "900 88px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(page.headline, 56, 148);
  ctx.fillStyle = "#5a5a55";
  ctx.font = "400 18px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(page.body, 56, 255);
  ctx.strokeStyle = "#deded8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 300);
  ctx.lineTo(c.width - 56, 300);
  ctx.stroke();
  drawIllustration(ctx, page, 56, 324, c.width - 112, c.height - 430);
  ctx.strokeStyle = "#7455ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.width - 200, c.height - 110);
  ctx.lineTo(c.width - 56, c.height - 110);
  ctx.stroke();
  ctx.fillStyle = "#aaa";
  ctx.font = "400 9px 'DM Mono', monospace";
  ctx.textBaseline = "bottom"; ctx.textAlign = "left";
  ctx.fillText("CAMPUSCODE  ·  2026", 56, c.height - 52);
  ctx.fillStyle = "#7455ff";
  ctx.textAlign = "right";
  ctx.fillText(page.short, c.width - 56, c.height - 52);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const coverTex = renderCoverTexture();
const pageTexs = PAGES.map(p => renderPageTexture(p));

/* ------------------------------------------------------------------ */
/*  Turning leaf geometry (48x18 grid, cylindrical curl)             */
/* ------------------------------------------------------------------ */

const SEG_U = 48, SEG_V = 18;
const LU = SEG_U + 1, LV = SEG_V + 1;
const leafGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(LU * LV * 3);
  const uv  = new Float32Array(LU * LV * 2);
  const idx = new Uint16Array(SEG_U * SEG_V * 2 * 3);
  let p = 0;
  for (let j = 0; j <= SEG_V; j++) {
    for (let i = 0; i <= SEG_U; i++) {
      pos[p++] = -PW/2 + (i/SEG_U)*PW;
      pos[p++] = -PH/2 + (j/SEG_V)*PH;
      pos[p++] = 0;
      uv[(j*LU+i)*2] = i/SEG_U;
      uv[(j*LU+i)*2+1] = j/SEG_V;
    }
  }
  let q = 0;
  for (let j = 0; j < SEG_V; j++) {
    for (let i = 0; i < SEG_U; i++) {
      const a = j*LU+i, b = a+1, c = (j+1)*LU+i, d = c+1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b;
      idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
  }
  leafGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  leafGeo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(LU*LV*3), 3));
  leafGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  leafGeo.setIndex(new THREE.BufferAttribute(idx, 1));
  leafGeo.computeVertexNormals();
}

/* ------------------------------------------------------------------ */
/*  State machine                                                     */
/* ------------------------------------------------------------------ */

type SClosed = { kind: "closed" };
type SOpen = { kind: "open"; spread: number };
type STurning = { kind: "turning"; base: number; tv: number; target: number; fromSpread: number; startTime: number };
type State = SClosed | SOpen | STurning;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function PageFlipBook() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendRef = useRef<THREE.WebGLRenderer | null>(null);
  const bookRef = useRef<THREE.Group | null>(null);
  const coverLRef = useRef<THREE.Mesh | null>(null);
  const coverRRef = useRef<THREE.Mesh | null>(null);
  const leafRef = useRef<THREE.Mesh | null>(null);
  const spineRef = useRef<THREE.Mesh | null>(null);
  const leftStackRef = useRef<THREE.Mesh | null>(null);
  const rightStackRef = useRef<THREE.Mesh | null>(null);
  const stateRef = useRef<State>({ kind: "closed" });
  const animRef = useRef<number | null>(null);
  const turnStartRef = useRef<number>(0);

  const [, setIndicator] = useState(0);
  const [, setHint] = useState("SCROLL TO OPEN");
  const reducedRef = useRef(
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = () => { reducedRef.current = m.matches; };
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const easeInOut = (t: number) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;

  /* ---- scene setup ---- */

  const setupScene = useCallback(() => {
    const mount = mountRef.current;
    if (!mount || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    cam.position.set(1.55, 2.15, 3.15);
    cam.lookAt(0, -0.05, 0);
    camRef.current = cam;

    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setSize(mount.offsetWidth, mount.offsetHeight);
    renderer.setClearColor(new THREE.Color("#ffffff"), 1);
    mount.appendChild(canvas);
    rendRef.current = renderer;

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -PH/2 - 0.04;
    ground.receiveShadow = true;
    scene.add(ground);

    // lights
    const key = new THREE.DirectionalLight("#fff8ec", 2.2);
    key.position.set(3.2, 4.6, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.camera.left = -3.4;
    key.shadow.camera.right = 3.4;
    key.shadow.camera.top = 3.4;
    key.shadow.camera.bottom = -3.4;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key);

    const rim = new THREE.DirectionalLight("#dce6ff", 0.85);
    rim.position.set(-2.4, 1.6, 2.8);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight("#ffffff", "#f0f0ec", 0.55));
    scene.add(new THREE.AmbientLight("#ffffff", 0.35));

    // book group
    const book = new THREE.Group();
    book.position.y = -PH/2 + 0.02;
    scene.add(book);
    bookRef.current = book;

    // spine
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(SPINE, PH - 0.06, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.85, metalness: 0 })
    );
    spine.position.set(0, 0, 0.01);
    spine.castShadow = true;
    spine.receiveShadow = true;
    book.add(spine);
    spineRef.current = spine;

    // covers
    const coverMat = (tex: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.02, side: THREE.DoubleSide });

    const lCover = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), coverMat(coverTex));
    lCover.position.set(-PW/2 - SPINE/2 - COVER_THICK/2, 0, 0.002);
    lCover.rotation.y = Math.PI/2;
    lCover.castShadow = true;
    lCover.receiveShadow = true;
    book.add(lCover);
    coverLRef.current = lCover;

    const rCover = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), coverMat(coverTex));
    rCover.position.set(PW/2 + SPINE/2 + COVER_THICK/2, 0, 0.002);
    rCover.rotation.y = -Math.PI/2;
    rCover.castShadow = true;
    rCover.receiveShadow = true;
    book.add(rCover);
    coverRRef.current = rCover;

    // paper stacks (showing thickness)
    const edgeMat = (tint: number) =>
      new THREE.MeshStandardMaterial({ color: tint, roughness: 0.7, metalness: 0 });

    const leftStack = new THREE.Mesh(
      new THREE.BoxGeometry(PW, PH - 0.06, 2*COVER_THICK + SHEETS*T),
      edgeMat(0xeaeaea)
    );
    leftStack.position.set(-PW/2, 0, 2*COVER_THICK + SHEETS*T);
    leftStack.castShadow = true;
    leftStack.receiveShadow = true;
    book.add(leftStack);
    leftStackRef.current = leftStack;

    const rightStack = new THREE.Mesh(
      new THREE.BoxGeometry(PW, PH - 0.06, 2*COVER_THICK + SHEETS*T),
      edgeMat(0xe2e2e0)
    );
    rightStack.position.set(PW/2, 0, 2*COVER_THICK + SHEETS*T);
    rightStack.castShadow = true;
    rightStack.receiveShadow = true;
    book.add(rightStack);
    rightStackRef.current = rightStack;

    // turning leaf
    const leafMat = new THREE.MeshStandardMaterial({
      roughness: 0.42, metalness: 0, side: THREE.DoubleSide, depthWrite: true, depthTest: true,
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    leaf.visible = false;
    book.add(leaf);
    leafRef.current = leaf;

  const cameraFrame = useCallback(() => {
    const cam = camRef.current;
    const mount = mountRef.current;
    if (!cam || !mount) return;
    const ar = mount.offsetWidth / mount.offsetHeight;
    const bound = 0.55;
    const halfH = PH/2 + bound;
    const halfW = PW/2 + SPINE/2 + COVER_THICK + bound;
    const fov = cam.fov * Math.PI/180;
    let viewH = 2*halfH, viewW = 2*halfW;
    if (ar < 1) { viewH = viewW / ar; } else { viewW = viewH * ar; }
    const dist = viewH / (2 * Math.tan(fov/2));
    const scale = dist / 3.15;
    cam.position.set(1.55*scale, 2.15*scale, 3.15*scale);
    cam.lookAt(0, -0.05, 0);
    cam.updateProjectionMatrix();
    if (rendRef.current) rendRef.current.setSize(mount.offsetWidth, mount.offsetHeight);
  }, []);

  // init on mount
  useEffect(() => {
    if (!mountRef.current) return;
    setupScene();
    window.addEventListener("resize", cameraFrame);
    return () => {
      window.removeEventListener("resize", cameraFrame);
      const r = rendRef.current;
      const m = mountRef.current;
      if (r && m) {
        m.removeChild(r.domElement);
        r.domElement.remove();
        r.dispose();
      }
      sceneRef.current = null;
      camRef.current = null;
      rendRef.current = null;
      bookRef.current = null;
      coverLRef.current = null;
      coverRRef.current = null;
      leafRef.current = null;
      spineRef.current = null;
      leftStackRef.current = null;
      rightStackRef.current = null;
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [setupScene, cameraFrame]);



  /* ---- spread helpers ---- */

  const applySpread = useCallback((spread: number) => {
    if (coverLRef.current) {
      const mat = coverLRef.current.material as THREE.MeshStandardMaterial;
      if (spread >= 1 && spread < SHEETS) {
        const idx = spread;
        mat.map = pageTexs[idx - 1];
        mat.needsUpdate = true;
      } else {
        mat.map = null;
        mat.color.set("#ffffff");
        mat.needsUpdate = true;
      }
    }
    if (coverRRef.current) {
      const mat = coverRRef.current.material as THREE.MeshStandardMaterial;
      if (spread >= 1 && spread <= SHEETS) {
        const idx = spread;
        mat.map = pageTexs[idx - 1];
        mat.needsUpdate = true;
      } else {
        mat.map = null;
        mat.color.set("#ffffff");
        mat.needsUpdate = true;
      }
    }
    if (leftStackRef.current) {
      const count = spread;
      leftStackRef.current.scale.z = (2*COVER_THICK + count*T) / (2*COVER_THICK + SHEETS*T);
      leftStackRef.current.position.z = COVER_THICK + count*T/2;
    }
    if (rightStackRef.current) {
      const count = SHEETS - spread;
      rightStackRef.current.scale.z = (2*COVER_THICK + count*T) / (2*COVER_THICK + SHEETS*T);
      rightStackRef.current.position.z = COVER_THICK + count*T/2;
    }
  }, []);

  /* ---- turning leaf deformation ---- */

  const deformLeaf = useCallback((tv: number, _startSpread: number, forward: boolean) => {
    _startSpread;
    const leaf = leafRef.current;
    if (!leaf) return;
    leaf.visible = true;

    const pos = leaf.geometry.attributes.position.array as Float32Array;
    const theta = tv * Math.PI;
    const bend = Math.sin(theta) * 0.55 + 0.12;
    const lead = 0.06;
    const rho = PW / Math.max(bend, 0.001);
    const spineSign = forward ? -1 : 1;

    for (let j = 0; j <= SEG_V; j++) {
      const v = j / SEG_V;
      const rowLead = lead * (1 - v) * Math.sin(theta) * 0.5;
      for (let i = 0; i <= SEG_U; i++) {
        const u = i / SEG_U;
        const idx = (j * LU + i) * 3;
        const s = u * PW;
        const cx = rho * Math.sin(s / PW * bend);
        const cy = rho * (1 - Math.cos(s / PW * bend));
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const rx = (cx + rowLead) * cosT - cy * sinT;
        const ry = (cx + rowLead) * sinT + cy * cosT;
        const pivotX = forward ? PW/2 : -PW/2;
        pos[idx]     = pivotX + rx * spineSign;
        pos[idx + 1] = -PH/2 + v * PH;
        pos[idx + 2] = ry;
      }
    }
    leaf.geometry.attributes.position.needsUpdate = true;
    leaf.geometry.computeVertexNormals();
  }, []);

  /* ---- turn logic ---- */

  const startTurn = useCallback((forward: boolean, fromSpread: number) => {
    if (reducedRef.current) {
      const newSpread = forward ? fromSpread + 1 : fromSpread - 1;
      applySpread(newSpread);
      stateRef.current = { kind: "open", spread: newSpread };
      setIndicator(newSpread);
      setHint(newSpread === 0 ? "SCROLL TO OPEN" : "SCROLL TO TURN PAGE");
      return;
    }
    stateRef.current = {
      kind: "turning",
      base: fromSpread,
      tv: 0,
      target: forward ? 1 : -1,
      fromSpread,
      startTime: performance.now(),
    };
    turnStartRef.current = performance.now();
    setIndicator(fromSpread);
    setHint("TURNING...");
  }, [applySpread]);

  const commitTurn = useCallback((forward: boolean, fromSpread: number) => {
    const newSpread = forward ? fromSpread + 1 : fromSpread - 1;
    const clamped = clamp(newSpread, 0, SHEETS);
    applySpread(clamped);
    if (leafRef.current) leafRef.current.visible = false;
    stateRef.current = { kind: "open", spread: clamped };
    setIndicator(clamped);
    setHint(clamped === 0 ? "SCROLL TO OPEN" : "SCROLL TO TURN PAGE");
  }, [applySpread]);

  /* ---- animation loop ---- */    const tick = useCallback(() => {
    const state = stateRef.current;
    const leaf = leafRef.current;
    const scene = sceneRef.current;
    const cam = camRef.current;
    const rend = rendRef.current;
    if (!leaf || !scene || !cam || !rend) return;

    const now = performance.now();

    if (state.kind === "turning") {
      const dt = (now - state.startTime) / 1000;
      const raw = clamp(dt / 0.7, 0, 1);
      const tv = easeInOut(raw);
      deformLeaf(tv, state.base, state.target > 0);
      if (raw >= 1) {
        commitTurn(state.target > 0, state.fromSpread);
        // continue rendering without scheduling another frame
        rend.render(scene, cam);
        return;
      }
    } else {
      if (leaf) leaf.visible = false;
      if (bookRef.current && state.kind === "closed") {
        const t = now / 1000;
        bookRef.current.position.y = -PH/2 + 0.02 + Math.sin(t * 0.9) * 0.012;
      } else if (bookRef.current) {
        bookRef.current.position.y = -PH/2 + 0.02;
      }
    }

    rend.render(scene, cam);
    animRef.current = requestAnimationFrame(tick);
  }, [deformLeaf, commitTurn, sceneRef, camRef, rendRef, leafRef, bookRef]);

  // start animation loop when scene is ready
  useEffect(() => {
    if (!sceneRef.current) return;
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [tick]);

  /* ---- input: scroll ---- */

  const handleWheel = useCallback((e: WheelEvent) => {
    const state = stateRef.current;
    if (reducedRef.current) {
      if (e.deltaY > 0) stepPage(1); else stepPage(-1);
      e.preventDefault();
      return;
    }
    if (Math.abs(e.deltaY) < 10) return;
    const now = performance.now();
    const last = (handleWheel as any)._last;
    if (last && now - last < 260) return;
    (handleWheel as any)._last = now;
    if (state.kind === "turning") return;
    if (e.deltaY > 0) stepPage(1); else stepPage(-1);
    e.preventDefault();
  }, []);

  const startCoverOpen = useCallback(() => {
    if (reducedRef.current) {
      applySpread(1);
      stateRef.current = { kind: "open", spread: 1 };
      setIndicator(1);
      setHint("SCROLL TO TURN PAGE");
      return;
    }
    stateRef.current = {
      kind: "turning",
      base: 0,
      tv: 0,
      target: 1,
      fromSpread: 0,
      startTime: performance.now(),
    };
    turnStartRef.current = performance.now();
    setIndicator(0);
    setHint("OPENING...");
  }, [applySpread]);

  const releaseSection = useCallback(() => {
    setHint("CONTINUE SCROLLING");
  }, []);

  const stepPage = useCallback((dir: 1 | -1) => {
    const state = stateRef.current;
    if (state.kind === "closed") {
      if (dir > 0) startCoverOpen();
      return;
    }
    if (state.kind === "open") {
      const spread = state.spread;
      const target = spread + dir;
      if (target < 0 || target > SHEETS) {
        if (dir > 0 && spread >= SHEETS) releaseSection();
        return;
      }
      startTurn(dir > 0, spread);
    }
  }, [startCoverOpen, startTurn, releaseSection]);

  /* ---- input: drag/click ---- */

  const dragRef = useRef({ active: false, startX: 0, startSpread: 0, tv: 0 });

  const pointerDown = useCallback((clientX: number) => {
    const state = stateRef.current;
    if (state.kind === "turning" || reducedRef.current || state.kind === "closed") return;
    dragRef.current.active = true;
    dragRef.current.startX = clientX;
    dragRef.current.startSpread = state.kind === "open" ? state.spread : 0;
    dragRef.current.tv = 0;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const down = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x > 0.3 && x < 0.7) return;
      pointerDown(e.clientX);
    };
    const touchStart = (e: any) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.touches[0].clientX - rect.left) / rect.width;
      if (x > 0.3 && x < 0.7) return;
      pointerDown(e.touches[0].clientX);
    };

    mount.addEventListener("mousedown", down);
    mount.addEventListener("touchstart", touchStart, { passive: true });

    const move = (e: any) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const rect = mount.getBoundingClientRect();
      const cx = e.type && e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
      const px = (cx - rect.left) / rect.width;
      const tv = clamp((px - 0.5) * 2, 0, 1);
      drag.tv = tv;
      const leaf = leafRef.current;
      if (leaf) {
        leaf.visible = tv > 0.005;
        deformLeaf(tv, drag.startSpread, true);
      }
    };

    const up = () => {
      const drag = dragRef.current;
      if (!drag.active) return;
      drag.active = false;
      const tv = drag.tv;
      if (tv > 0.5) {
        const spread = drag.startSpread;
        startTurn(true, spread);
      }
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("touchmove", move, { passive: true });
    document.addEventListener("touchend", up);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };
  }, [pointerDown, deformLeaf, startTurn]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (reducedRef.current) return;
    const state = stateRef.current;
    if (state.kind === "turning") return;
    const rect = mountRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (state.kind === "closed") {
      if (x > 0.65) startCoverOpen();
      return;
    }
    if (state.kind === "open") {
      const spread = state.spread;
      if (x > 0.7 && spread < SHEETS) startTurn(true, spread);
      else if (x < 0.3 && spread > 0) startTurn(false, spread);
    }
  }, [startCoverOpen, startTurn]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.addEventListener("wheel", handleWheel, { passive: false });
    mount.addEventListener("click", handleClick);
    return () => {
      mount.removeEventListener("wheel", handleWheel);
      mount.removeEventListener("click", handleClick);
    };
  }, [handleWheel, handleClick]);

  /* ---- style (kept; rendered via injected <style> below) ---- */

  const styleBlock = `
    .book-scene-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #ffffff;
      cursor: grab;
    }
    .book-scene-wrapper:active { cursor: grabbing; }
    .book-scene-wrapper canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .book-scene-wrapper { touch-action: none; }    `;

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = styleBlock;
    document.head.appendChild(style);
    return () => {      style.remove();
    };
  }, []);

  return (
    <div
      className="book-scene-wrapper"
      ref={mountRef}
      style={{ width: "100%", height: "100%", aspectRatio: "16/10" }}
    />
  );
}
export default PageFlipBook;



