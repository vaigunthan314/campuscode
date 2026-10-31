"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageFlipBook = PageFlipBook;
var react_1 = require("react");
var THREE = require("three");
var PAGES = [
    { id: 1, short: "01", headline: "DISCOVER", body: "Find a challenge that makes you want to build." },
    { id: 2, short: "02", headline: "TEAM UP", body: "Find people who share your ambition." },
    { id: 3, short: "03", headline: "BUILD", body: "Turn your idea into something people can use." },
    { id: 4, short: "04", headline: "SHIP", body: "Submit your work and take it to the arena." },
];
var PW = 1.6, PH = 2.15, T = 0.014, SPINE = 0.10, SHEETS = PAGES.length;
var COVER_THICK = 0.022;
/* ------------------------------------------------------------------ */
/*  Canvas texturing helpers                                          */
/* ------------------------------------------------------------------ */
function makeCanvas(w, h) {
    if (w === void 0) { w = 1024; }
    if (h === void 0) { h = 1365; }
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}
function fillWhitePage(ctx, w, h) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#eaeaeb";
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    // gutter shade
    var g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(0.85, "rgba(20,20,20,0.05)");
    g.addColorStop(1, "rgba(20,20,20,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // vignette
    var v = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(20,20,20,0.05)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
}
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
function drawIllustration(ctx, page, x, y, w, h) {
    ctx.fillStyle = "#f4f4f1";
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "#deded8";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();
    if (page.id === 1) {
        var cw_1 = 118, gap_1 = 10;
        var cards = [
            { tag: "AI", title: "AI Innovation", meta: "Mar 15-17 · 248" },
            { tag: "WEB", title: "Future Web", meta: "Apr 05-07 · 186" },
        ];
        cards.forEach(function (c, i) {
            var cx = x + 12 + i * (cw_1 + gap_1);
            ctx.fillStyle = "#7455ff";
            roundRect(ctx, cx, y + 12, 64, 16, 3);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "500 8px 'DM Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(c.tag, cx + 32, y + 20);
            ctx.fillStyle = "#111";
            ctx.font = "700 13px 'Inter', 'Helvetica Neue', Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(c.title, cx + 8, y + 36);
            ctx.fillStyle = "#888";
            ctx.font = "400 8px 'DM Mono', monospace";
            ctx.fillText(c.meta, cx + 8, y + 56);
            ctx.fillStyle = "#e2e2dd";
            ctx.fillRect(cx + 8, y + 70, cw_1 - 16, 3);
            ctx.fillStyle = "#ebebe6";
            ctx.fillRect(cx + 8, y + 78, cw_1 - 22, 3);
        });
    }
    else if (page.id === 2) {
        var avatars = [
            { initials: "PS", name: "Priya S.", role: "Full Stack", color: "#7455ff" },
            { initials: "MK", name: "Marcus K.", role: "AI / ML", color: "#82b91a" },
            { initials: "AR", name: "Ayesha R.", role: "Design", color: "#ff6b6b" },
        ];
        var asz_1 = 42, agap_1 = 12;
        avatars.forEach(function (a, i) {
            var cx = x + 12 + i * (asz_1 + agap_1);
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.arc(cx + asz_1 / 2, y + asz_1 / 2, asz_1 / 2 - 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "700 15px 'Inter', 'Helvetica Neue', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(a.initials, cx + asz_1 / 2, y + asz_1 / 2);
            ctx.fillStyle = "#111";
            ctx.font = "600 10px 'Inter', 'Helvetica Neue', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(a.name, cx + asz_1 / 2, y + asz_1 + 6);
            ctx.fillStyle = "#888";
            ctx.font = "400 8px 'DM Mono', monospace";
            ctx.fillText(a.role, cx + asz_1 / 2, y + asz_1 + 22);
        });
        var cardX_1 = x + 3 * asz_1 + 4 * agap_1 + 6;
        var cardW = w - (cardX_1 - x) - 14;
        var cardH = h - 24;
        ctx.fillStyle = "#f4f4f1";
        roundRect(ctx, cardX_1, y + 12, cardW, cardH, 6);
        ctx.fill();
        ctx.strokeStyle = "#deded8";
        ctx.lineWidth = 1;
        roundRect(ctx, cardX_1, y + 12, cardW, cardH, 6);
        ctx.stroke();
        ctx.fillStyle = "#111";
        ctx.font = "700 12px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Team Workspace", cardX_1 + 12, y + 24);
        ctx.fillStyle = "#888";
        ctx.font = "400 9px 'DM Mono', monospace";
        ctx.fillText("3 members active", cardX_1 + 12, y + 42);
        var repos = ["campus-app", "ml-engine", "design-ui"];
        repos.forEach(function (repo, i) {
            ctx.fillStyle = "#7455ff";
            ctx.fillRect(cardX_1 + 12, y + 60 + i * 16, 5, 5);
            ctx.fillStyle = "#666";
            ctx.font = "400 9px 'DM Mono', monospace";
            ctx.fillText(repo, cardX_1 + 22, y + 60 + i * 16 + 1);
        });
    }
    else if (page.id === 3) {
        var ew = 150, eh = h - 24;
        ctx.fillStyle = "#1a1a1a";
        roundRect(ctx, x + 12, y + 12, ew, eh, 6);
        ctx.fill();
        ctx.strokeStyle = "#333330";
        ctx.lineWidth = 1;
        roundRect(ctx, x + 12, y + 12, ew, eh, 6);
        ctx.stroke();
        ["#ff6b6b", "#ffbd4a", "#4ecdc4"].forEach(function (col, i) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x + 22 + i * 14, y + 24, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });
        var code = [
            "import { CampusCode } from '@campus/code'",
            "const app = new CampusCode({",
            '  project: "hackathon-app",',
            '  team: "dev-team-01",',
            "})",
            "app.deploy()",
        ];
        ctx.fillStyle = "#666";
        ctx.font = "400 8.5px 'DM Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        code.forEach(function (line, i) { return ctx.fillText(line, x + 22, y + 40 + i * 11); });
        ctx.fillStyle = "#7455ff";
        roundRect(ctx, x + ew - 72, y + 32, 60, 16, 3);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 7px 'DM Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("AI ASSISTANT", x + ew - 42, y + 40);
        var px = x + ew + 16;
        var pw = w - (px - x) - 14;
        var ph = eh;
        ctx.fillStyle = "#fff";
        roundRect(ctx, px, y + 12, pw, ph, 6);
        ctx.fill();
        ctx.strokeStyle = "#deded8";
        ctx.lineWidth = 1;
        roundRect(ctx, px, y + 12, pw, ph, 6);
        ctx.stroke();
        ctx.fillStyle = "#111";
        ctx.font = "700 11px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("CampusCode App", px + 12, y + 22);
        ctx.fillStyle = "#f0f0ec";
        ctx.fillRect(px + 12, y + 44, pw - 24, 4);
        ctx.fillStyle = "#7455ff";
        ctx.fillRect(px + 12, y + 56, pw - 24, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "600 9px 'DM Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BUILD PROJECT", px + pw / 2, y + 68);
        ctx.fillStyle = "#e2e2dd";
        ctx.fillRect(px + 12, y + 92, (pw - 24) / 3, 12);
        ctx.fillRect(px + 12 + (pw - 24) / 3, y + 92, (pw - 24) / 3, 12);
        ctx.fillRect(px + 12 + 2 * (pw - 24) / 3, y + 92, (pw - 24) / 3, 12);
        ctx.fillStyle = "#888";
        ctx.font = "400 7px 'DM Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("12 issues", px + 12 + (pw - 24) / 6, y + 98);
        ctx.fillText("8 solved", px + 12 + (pw - 24) / 2, y + 98);
        ctx.fillText("4 tests", px + 12 + 5 * (pw - 24) / 6, y + 98);
    }
    else {
        var cw_2 = w - 24, ch = h - 24;
        ctx.fillStyle = "#f4f4f1";
        roundRect(ctx, x + 12, y + 12, cw_2, ch, 8);
        ctx.fill();
        ctx.strokeStyle = "#deded8";
        ctx.lineWidth = 1;
        roundRect(ctx, x + 12, y + 12, cw_2, ch, 8);
        ctx.stroke();
        ctx.fillStyle = "#7455ff";
        ctx.beginPath();
        ctx.moveTo(x + 12 + cw_2 / 2 - 16, y + 34);
        ctx.lineTo(x + 12 + cw_2 / 2 + 16, y + 34);
        ctx.lineTo(x + 12 + cw_2 / 2 + 10, y + 52);
        ctx.lineTo(x + 12 + cw_2 / 2, y + 62);
        ctx.lineTo(x + 12 + cw_2 / 2 - 10, y + 52);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2605", x + 12 + cw_2 / 2, y + 48);
        ctx.fillStyle = "#111";
        ctx.font = "800 18px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Ready to Ship", x + 22, y + 74);
        ctx.fillStyle = "#666";
        ctx.font = "400 11px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText("Your project is complete and ready for the arena.", x + 22, y + 98);
        ctx.fillStyle = "#111";
        roundRect(ctx, x + 22, y + 124, cw_2 - 44, 22, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 9px 'DM Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2192  SUBMIT TO ARENA", x + 12 + cw_2 / 2, y + 135);
        var statuses = [{ label: "Build", ok: true }, { label: "Tests", ok: true }, { label: "Review", ok: false }];
        statuses.forEach(function (s, i) {
            var dx = x + 12 + cw_2 + 18 + i * 70;
            ctx.fillStyle = s.ok ? "#82b91a" : "#ffbd4a";
            ctx.beginPath();
            ctx.arc(dx, y + 28, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "700 12px 'Inter', 'Helvetica Neue', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(s.ok ? "\u2713" : "\u2026", dx, y + 29);
            ctx.fillStyle = "#666";
            ctx.font = "400 8px 'DM Mono', monospace";
            ctx.textBaseline = "top";
            ctx.fillText(s.label, dx - 2, y + 42);
        });
    }
}
function renderCoverTexture() {
    var c = makeCanvas();
    var ctx = c.getContext("2d");
    fillWhitePage(ctx, c.width, c.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#888";
    ctx.font = "400 11px 'DM Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText("CAMPUSCODE", c.width / 2, 70);
    ctx.fillStyle = "#111";
    ctx.font = "900 170px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("CC", c.width / 2, c.height / 2 - 30);
    ctx.strokeStyle = "#7455ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(c.width / 2 - 70, c.height / 2 + 40);
    ctx.lineTo(c.width / 2 + 70, c.height / 2 + 40);
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.font = "600 22px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("HACKATHON ARENA", c.width / 2, c.height / 2 + 90);
    ctx.fillStyle = "#aaa";
    ctx.font = "400 9px 'DM Mono', monospace";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText("CAMPUSCODE  ·  2026", 56, c.height - 52);
    ctx.fillStyle = "#7455ff";
    ctx.textAlign = "right";
    ctx.fillText("00", c.width - 56, c.height - 52);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
function renderPageTexture(page) {
    var c = makeCanvas();
    var ctx = c.getContext("2d");
    fillWhitePage(ctx, c.width, c.height);
    // running header
    ctx.fillStyle = "#888";
    ctx.font = "400 9px 'DM Mono', monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
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
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
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
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText("CAMPUSCODE  ·  2026", 56, c.height - 52);
    ctx.fillStyle = "#7455ff";
    ctx.textAlign = "right";
    ctx.fillText(page.short, c.width - 56, c.height - 52);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
var coverTex = renderCoverTexture();
var pageTexs = PAGES.map(function (p) { return renderPageTexture(p); });
/* ------------------------------------------------------------------ */
/*  Turning leaf geometry (48x18 grid, cylindrical curl)             */
/* ------------------------------------------------------------------ */
var SEG_U = 48, SEG_V = 18;
var LU = SEG_U + 1, LV = SEG_V + 1;
var leafGeo = new THREE.BufferGeometry();
{
    var pos = new Float32Array(LU * LV * 3);
    var uv = new Float32Array(LU * LV * 2);
    var idx = new Uint16Array(SEG_U * SEG_V * 2 * 3);
    var p = 0;
    for (var j = 0; j <= SEG_V; j++) {
        for (var i = 0; i <= SEG_U; i++) {
            pos[p++] = -PW / 2 + (i / SEG_U) * PW;
            pos[p++] = -PH / 2 + (j / SEG_V) * PH;
            pos[p++] = 0;
            uv[(j * LU + i) * 2] = i / SEG_U;
            uv[(j * LU + i) * 2 + 1] = j / SEG_V;
        }
    }
    var q = 0;
    for (var j = 0; j < SEG_V; j++) {
        for (var i = 0; i < SEG_U; i++) {
            var a = j * LU + i, b = a + 1, c = (j + 1) * LU + i, d = c + 1;
            idx[q++] = a;
            idx[q++] = c;
            idx[q++] = b;
            idx[q++] = b;
            idx[q++] = c;
            idx[q++] = d;
        }
    }
    leafGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    leafGeo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(LU * LV * 3), 3));
    leafGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    leafGeo.setIndex(new THREE.BufferAttribute(idx, 1));
    leafGeo.computeVertexNormals();
}
/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function PageFlipBook() {
    var mountRef = (0, react_1.useRef)(null);
    var sceneRef = (0, react_1.useRef)(null);
    var camRef = (0, react_1.useRef)(null);
    var rendRef = (0, react_1.useRef)(null);
    var bookRef = (0, react_1.useRef)(null);
    var coverLRef = (0, react_1.useRef)(null);
    var coverRRef = (0, react_1.useRef)(null);
    var leafRef = (0, react_1.useRef)(null);
    var spineRef = (0, react_1.useRef)(null);
    var leftStackRef = (0, react_1.useRef)(null);
    var rightStackRef = (0, react_1.useRef)(null);
    var stateRef = (0, react_1.useRef)({ kind: "closed" });
    var animRef = (0, react_1.useRef)(null);
    var turnStartRef = (0, react_1.useRef)(0);
    var _a = (0, react_1.useState)(0), setIndicator = _a[1];
    var _b = (0, react_1.useState)("SCROLL TO OPEN"), setHint = _b[1];
    var reducedRef = (0, react_1.useRef)(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    (0, react_1.useEffect)(function () {
        var m = window.matchMedia("(prefers-reduced-motion: reduce)");
        var h = function () { reducedRef.current = m.matches; };
        m.addEventListener("change", h);
        return function () { return m.removeEventListener("change", h); };
    }, []);
    var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    /* ---- scene setup ---- */
    var setupScene = (0, react_1.useCallback)(function () {
        var mount = mountRef.current;
        if (!mount || sceneRef.current)
            return;
        var scene = new THREE.Scene();
        scene.background = new THREE.Color("#ffffff");
        sceneRef.current = scene;
        var cam = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
        cam.position.set(1.55, 2.15, 3.15);
        cam.lookAt(0, -0.05, 0);
        camRef.current = cam;
        var canvas = document.createElement("canvas");
        var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Snapshot the intended render dimensions for the wrapper.
        renderer.setSize(mount.offsetWidth, mount.offsetHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setSize(mount.offsetWidth, mount.offsetHeight);
        renderer.setClearColor(new THREE.Color("#ffffff"), 1);
        mount.appendChild(canvas);
        rendRef.current = renderer;
        // Do not let the WebGL canvas grow beyond the wrapper's intended box.
        // The CSS rule `.book-scene-wrapper canvas { width:100% !important; height:100% !important; }`
        // is applied once, via the injected style block, so the canvas fills the wrapper and
        // cannot create a large blank rectangle over later sections.
        // ground
        var ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -PH / 2 - 0.04;
        ground.receiveShadow = true;
        scene.add(ground);
        // lights
        var key = new THREE.DirectionalLight("#fff8ec", 2.2);
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
        var rim = new THREE.DirectionalLight("#dce6ff", 0.85);
        rim.position.set(-2.4, 1.6, 2.8);
        scene.add(rim);
        scene.add(new THREE.HemisphereLight("#ffffff", "#f0f0ec", 0.55));
        scene.add(new THREE.AmbientLight("#ffffff", 0.35));
        // book group
        var book = new THREE.Group();
        book.position.y = -PH / 2 + 0.02;
        scene.add(book);
        bookRef.current = book;
        // spine
        var spine = new THREE.Mesh(new THREE.BoxGeometry(SPINE, PH - 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.85, metalness: 0 }));
        spine.position.set(0, 0, 0.01);
        spine.castShadow = true;
        spine.receiveShadow = true;
        book.add(spine);
        spineRef.current = spine;
        // covers
        var coverMat = function (tex) {
            return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.02, side: THREE.DoubleSide });
        };
        var lCover = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), coverMat(coverTex));
        lCover.position.set(-PW / 2 - SPINE / 2 - COVER_THICK / 2, 0, 0.002);
        lCover.rotation.y = Math.PI / 2;
        lCover.castShadow = true;
        lCover.receiveShadow = true;
        book.add(lCover);
        coverLRef.current = lCover;
        var rCover = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), coverMat(coverTex));
        rCover.position.set(PW / 2 + SPINE / 2 + COVER_THICK / 2, 0, 0.002);
        rCover.rotation.y = -Math.PI / 2;
        rCover.castShadow = true;
        rCover.receiveShadow = true;
        book.add(rCover);
        coverRRef.current = rCover;
        // paper stacks (showing thickness)
        var edgeMat = function (tint) {
            return new THREE.MeshStandardMaterial({ color: tint, roughness: 0.7, metalness: 0 });
        };
        var leftStack = new THREE.Mesh(new THREE.BoxGeometry(PW, PH - 0.06, 2 * COVER_THICK + SHEETS * T), edgeMat(0xeaeaea));
        leftStack.position.set(-PW / 2, 0, 2 * COVER_THICK + SHEETS * T);
        leftStack.castShadow = true;
        leftStack.receiveShadow = true;
        book.add(leftStack);
        leftStackRef.current = leftStack;
        var rightStack = new THREE.Mesh(new THREE.BoxGeometry(PW, PH - 0.06, 2 * COVER_THICK + SHEETS * T), edgeMat(0xe2e2e0));
        rightStack.position.set(PW / 2, 0, 2 * COVER_THICK + SHEETS * T);
        rightStack.castShadow = true;
        rightStack.receiveShadow = true;
        book.add(rightStack);
        rightStackRef.current = rightStack;
        // turning leaf
        var leafMat = new THREE.MeshStandardMaterial({
            roughness: 0.42, metalness: 0, side: THREE.DoubleSide, depthWrite: true, depthTest: true,
        });
        var leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        leaf.visible = false;
        book.add(leaf);
        leafRef.current = leaf;
        cameraFrame();
    }, []);
    var cameraFrame = (0, react_1.useCallback)(function () {
        var cam = camRef.current;
        var mount = mountRef.current;
        if (!cam || !mount)
            return;
        var ar = mount.offsetWidth / mount.offsetHeight;
        var bound = 0.55;
        var halfH = PH / 2 + bound;
        var halfW = PW / 2 + SPINE / 2 + COVER_THICK + bound;
        var fov = cam.fov * Math.PI / 180;
        var viewH = 2 * halfH, viewW = 2 * halfW;
        if (ar < 1) {
            viewH = viewW / ar;
        }
        else {
            viewW = viewH * ar;
        }
        var dist = viewH / (2 * Math.tan(fov / 2));
        var scale = dist / 3.15;
        cam.position.set(1.55 * scale, 2.15 * scale, 3.15 * scale);
        cam.lookAt(0, -0.05, 0);
        cam.updateProjectionMatrix();
        if (rendRef.current)
            rendRef.current.setSize(mount.offsetWidth, mount.offsetHeight);
    }, []);
    // init on mount
    (0, react_1.useEffect)(function () {
        if (!mountRef.current)
            return;
        setupScene();
        window.addEventListener("resize", cameraFrame);
        return function () {
            window.removeEventListener("resize", cameraFrame);
            var r = rendRef.current;
            var m = mountRef.current;
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
    // Re-apply wrapper canvas sizing whenever the wrapper box is resized.
    // This prevents a stale canvas from drifting outside its section.
    (0, react_1.useEffect)(function () {
        var mount = mountRef.current;
        var rend = rendRef.current;
        if (!mount || !rend)
            return;
        var rafId = null;
        var lastW = mount.offsetWidth;
        var lastH = mount.offsetHeight;
        var sync = function () {
            var w = mount.offsetWidth;
            var h = mount.offsetHeight;
            if (w !== lastW || h !== lastH) {
                lastW = w;
                lastH = h;
                rend.setSize(w, h);
            }
            rafId = requestAnimationFrame(sync);
        };
        rafId = requestAnimationFrame(sync);
        return function () {
            if (rafId !== null)
                cancelAnimationFrame(rafId);
        };
    }, []);
    /* ---- spread helpers ---- */
    var applySpread = (0, react_1.useCallback)(function (spread) {
        if (coverLRef.current) {
            var mat = coverLRef.current.material;
            if (spread >= 1 && spread < SHEETS) {
                var idx = spread;
                mat.map = pageTexs[idx - 1];
                mat.needsUpdate = true;
            }
            else {
                mat.map = null;
                mat.color.set("#ffffff");
                mat.needsUpdate = true;
            }
        }
        if (coverRRef.current) {
            var mat = coverRRef.current.material;
            if (spread >= 1 && spread <= SHEETS) {
                var idx = spread;
                mat.map = pageTexs[idx - 1];
                mat.needsUpdate = true;
            }
            else {
                mat.map = null;
                mat.color.set("#ffffff");
                mat.needsUpdate = true;
            }
        }
        if (leftStackRef.current) {
            var count = spread;
            leftStackRef.current.scale.z = (2 * COVER_THICK + count * T) / (2 * COVER_THICK + SHEETS * T);
            leftStackRef.current.position.z = COVER_THICK + count * T / 2;
        }
        if (rightStackRef.current) {
            var count = SHEETS - spread;
            rightStackRef.current.scale.z = (2 * COVER_THICK + count * T) / (2 * COVER_THICK + SHEETS * T);
            rightStackRef.current.position.z = COVER_THICK + count * T / 2;
        }
    }, []);
    /* ---- turning leaf deformation ---- */
    var deformLeaf = (0, react_1.useCallback)(function (tv, _startSpread, forward) {
        _startSpread;
        var leaf = leafRef.current;
        if (!leaf)
            return;
        leaf.visible = true;
        var pos = leaf.geometry.attributes.position.array;
        var theta = tv * Math.PI;
        var bend = Math.sin(theta) * 0.55 + 0.12;
        var lead = 0.06;
        var rho = PW / Math.max(bend, 0.001);
        var spineSign = forward ? -1 : 1;
        for (var j = 0; j <= SEG_V; j++) {
            var v = j / SEG_V;
            var rowLead = lead * (1 - v) * Math.sin(theta) * 0.5;
            for (var i = 0; i <= SEG_U; i++) {
                var u = i / SEG_U;
                var idx = (j * LU + i) * 3;
                var s = u * PW;
                var cx = rho * Math.sin(s / PW * bend);
                var cy = rho * (1 - Math.cos(s / PW * bend));
                var cosT = Math.cos(theta);
                var sinT = Math.sin(theta);
                var rx = (cx + rowLead) * cosT - cy * sinT;
                var ry = (cx + rowLead) * sinT + cy * cosT;
                var pivotX = forward ? PW / 2 : -PW / 2;
                pos[idx] = pivotX + rx * spineSign;
                pos[idx + 1] = -PH / 2 + v * PH;
                pos[idx + 2] = ry;
            }
        }
        leaf.geometry.attributes.position.needsUpdate = true;
        leaf.geometry.computeVertexNormals();
    }, []);
    /* ---- turn logic ---- */
    var startTurn = (0, react_1.useCallback)(function (forward, fromSpread) {
        if (reducedRef.current) {
            var newSpread = forward ? fromSpread + 1 : fromSpread - 1;
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
            fromSpread: fromSpread,
            startTime: performance.now(),
        };
        turnStartRef.current = performance.now();
        setIndicator(fromSpread);
        setHint("TURNING...");
    }, [applySpread]);
    var commitTurn = (0, react_1.useCallback)(function (forward, fromSpread) {
        var newSpread = forward ? fromSpread + 1 : fromSpread - 1;
        var clamped = clamp(newSpread, 0, SHEETS);
        applySpread(clamped);
        if (leafRef.current)
            leafRef.current.visible = false;
        stateRef.current = { kind: "open", spread: clamped };
        setIndicator(clamped);
        setHint(clamped === 0 ? "SCROLL TO OPEN" : "SCROLL TO TURN PAGE");
    }, [applySpread]);
    /* ---- animation loop ---- */
    var tick = (0, react_1.useCallback)(function () {
        var state = stateRef.current;
        var leaf = leafRef.current;
        var scene = sceneRef.current;
        var cam = camRef.current;
        var rend = rendRef.current;
        if (!leaf || !scene || !cam || !rend)
            return;
        var now = performance.now();
        if (state.kind === "turning") {
            var dt = (now - state.startTime) / 1000;
            var raw = clamp(dt / 0.7, 0, 1);
            var tv = easeInOut(raw);
            deformLeaf(tv, state.base, state.target > 0);
            if (raw >= 1) {
                commitTurn(state.target > 0, state.fromSpread);
                // continue rendering without scheduling another frame
                rend.render(scene, cam);
                return;
            }
        }
        else {
            if (leaf)
                leaf.visible = false;
            if (bookRef.current && state.kind === "closed") {
                var t = now / 1000;
                bookRef.current.position.y = -PH / 2 + 0.02 + Math.sin(t * 0.9) * 0.012;
            }
            else if (bookRef.current) {
                bookRef.current.position.y = -PH / 2 + 0.02;
            }
        }
        rend.render(scene, cam);
        animRef.current = requestAnimationFrame(tick);
    }, [deformLeaf, commitTurn]);
    // start animation loop when scene is ready
    (0, react_1.useEffect)(function () {
        if (!sceneRef.current)
            return;
        if (animRef.current !== null) {
            cancelAnimationFrame(animRef.current);
            animRef.current = null;
        }
        animRef.current = requestAnimationFrame(tick);
        return function () {
            if (animRef.current !== null) {
                cancelAnimationFrame(animRef.current);
                animRef.current = null;
            }
        };
    }, [tick]);
    /* ---- input: scroll ---- */
    var handleWheel = (0, react_1.useCallback)(function (e) {
        var state = stateRef.current;
        if (reducedRef.current) {
            if (e.deltaY > 0)
                stepPage(1);
            else
                stepPage(-1);
            e.preventDefault();
            return;
        }
        if (Math.abs(e.deltaY) < 8)
            return;
        var now = performance.now();
        var last = handleWheel._last;
        if (last && now - last < 220)
            return;
        handleWheel._last = now;
        if (state.kind === "turning")
            return;
        if (e.deltaY > 0)
            stepPage(1);
        else
            stepPage(-1);
        e.preventDefault();
    }, []);
    var startCoverOpen = (0, react_1.useCallback)(function () {
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
    var releaseSection = (0, react_1.useCallback)(function () {
        setHint("CONTINUE SCROLLING");
    }, []);
    var stepPage = (0, react_1.useCallback)(function (dir) {
        var state = stateRef.current;
        if (state.kind === "closed") {
            if (dir > 0)
                startCoverOpen();
            return;
        }
        if (state.kind === "open") {
            var spread = state.spread;
            var target = spread + dir;
            if (target < 0 || target > SHEETS) {
                if (dir > 0 && spread >= SHEETS)
                    releaseSection();
                return;
            }
            startTurn(dir > 0, spread);
        }
    }, [startCoverOpen, startTurn, releaseSection]);
    /* ---- input: drag/click ---- */
    var dragRef = (0, react_1.useRef)({ active: false, startX: 0, startSpread: 0, tv: 0 });
    var pointerDown = (0, react_1.useCallback)(function (clientX) {
        var state = stateRef.current;
        if (state.kind === "turning" || reducedRef.current || state.kind === "closed")
            return;
        dragRef.current.active = true;
        dragRef.current.startX = clientX;
        dragRef.current.startSpread = state.kind === "open" ? state.spread : 0;
        dragRef.current.tv = 0;
    }, []);
    (0, react_1.useEffect)(function () {
        var mount = mountRef.current;
        if (!mount)
            return;
        var down = function (e) {
            var rect = mount.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width;
            if (x > 0.3 && x < 0.7)
                return;
            pointerDown(e.clientX);
        };
        var touchStart = function (e) {
            var rect = mount.getBoundingClientRect();
            var x = (e.touches[0].clientX - rect.left) / rect.width;
            if (x > 0.3 && x < 0.7)
                return;
            pointerDown(e.touches[0].clientX);
        };
        mount.addEventListener("mousedown", down);
        mount.addEventListener("touchstart", touchStart, { passive: true });
        var move = function (e) {
            var drag = dragRef.current;
            if (!drag.active)
                return;
            var rect = mount.getBoundingClientRect();
            var cx = e.type && e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
            var px = (cx - rect.left) / rect.width;
            var tv = clamp((px - 0.5) * 2, 0, 1);
            drag.tv = tv;
            var leaf = leafRef.current;
            if (leaf) {
                leaf.visible = tv > 0.005;
                deformLeaf(tv, drag.startSpread, true);
            }
        };
        var up = function () {
            var drag = dragRef.current;
            if (!drag.active)
                return;
            drag.active = false;
            var tv = drag.tv;
            if (tv > 0.5) {
                var spread = drag.startSpread;
                startTurn(true, spread);
            }
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("touchmove", move, { passive: true });
        document.addEventListener("touchend", up);
        return function () {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", up);
        };
    }, [pointerDown, deformLeaf, startTurn]);
    var handleClick = (0, react_1.useCallback)(function (e) {
        if (reducedRef.current)
            return;
        var state = stateRef.current;
        if (state.kind === "turning")
            return;
        var rect = mountRef.current.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        if (state.kind === "closed") {
            if (x > 0.65)
                startCoverOpen();
            return;
        }
        if (state.kind === "open") {
            var spread = state.spread;
            if (x > 0.7 && spread < SHEETS)
                startTurn(true, spread);
            else if (x < 0.3 && spread > 0)
                startTurn(false, spread);
        }
    }, [startCoverOpen, startTurn]);
    (0, react_1.useEffect)(function () {
        var mount = mountRef.current;
        if (!mount)
            return;
        mount.addEventListener("wheel", handleWheel, { passive: false });
        mount.addEventListener("click", handleClick);
        return function () {
            mount.removeEventListener("wheel", handleWheel);
            mount.removeEventListener("click", handleClick);
        };
    }, [handleWheel, handleClick]);
    /* ---- style (kept; rendered via injected <style> below) ---- */
    var styleBlock = "\n    .book-scene-wrapper {\n      position: relative;\n      width: 100%;\n      height: 100%;\n      overflow: hidden;\n      background: #ffffff;\n      cursor: grab;\n    }\n    .book-scene-wrapper:active { cursor: grabbing; }\n    .book-scene-wrapper canvas {\n      display: block;\n      width: 100% !important;\n      height: 100% !important;\n    }\n    .book-scene-wrapper { touch-action: none; }    ";
    (0, react_1.useEffect)(function () {
        var style = document.createElement("style");
        style.textContent = styleBlock;
        document.head.appendChild(style);
        return function () {
            style.remove();
        };
    }, []);
    return (<div className="book-scene-wrapper" ref={mountRef} style={{ width: "100%", height: "100%", aspectRatio: "16/10" }}/>);
}
exports.default = PageFlipBook;
