"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arena = Arena;
var react_1 = require("react");
var ARENA_CARDS = [
    {
        id: "ai",
        number: "01",
        title: "AI INNOVATION",
        category: "INTELLIGENCE",
        description: "Build intelligent solutions for problems that matter.",
        status: "LIVE",
        image: "/images/arena-ai.svg",
        alt: "A purple studio scene with a laptop showing an AI model workspace.",
        variant: "ai",
    },
    {
        id: "web",
        number: "02",
        title: "FUTURE WEB",
        category: "WEB PLATFORM",
        description: "Design and ship the next generation of digital experiences.",
        status: "OPEN",
        image: "/images/arena-web.svg",
        alt: "A studio scene with a monitor running a code editor beside a website preview and a phone.",
        variant: "web",
    },
    {
        id: "campus",
        number: "03",
        title: "CAMPUS TECH",
        category: "STUDENT LIFE",
        description: "Create technology that makes student life better.",
        status: "UPCOMING",
        image: "/images/arena-campus.svg",
        alt: "A campus plaza with white and purple buildings and a phone showing the campus app.",
        variant: "campus",
    },
];
function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Cheap tileable value noise, sampled with smooth interpolation. */
function makeNoise(rand, grid) {
    var g = [];
    for (var i = 0; i < grid * grid; i += 1)
        g.push(rand());
    return function (u, v) {
        var x = u * grid;
        var y = v * grid;
        var ix = Math.floor(x);
        var iy = Math.floor(y);
        var x0 = ((ix % grid) + grid) % grid;
        var y0 = ((iy % grid) + grid) % grid;
        var x1 = (x0 + 1) % grid;
        var y1 = (y0 + 1) % grid;
        var fx = x - ix;
        var fy = y - iy;
        var sx = fx * fx * (3 - 2 * fx);
        var sy = fy * fy * (3 - 2 * fy);
        var top = g[y0 * grid + x0] + (g[y0 * grid + x1] - g[y0 * grid + x0]) * sx;
        var bottom = g[y1 * grid + x0] + (g[y1 * grid + x1] - g[y1 * grid + x0]) * sx;
        return top + (bottom - top) * sy;
    };
}
/**
 * A soft, irregular grey cloud baked once into an offscreen canvas. Layering
 * octaves of value noise under a radial falloff keeps the smoke from reading
 * as perfect circles or repeated blobs.
 */
function buildSprite(size, tone, seed) {
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    if (!ctx)
        return canvas;
    var image = ctx.createImageData(size, size);
    var rand = mulberry32(seed);
    var coarse = makeNoise(rand, 4);
    var mid = makeNoise(rand, 9);
    var fine = makeNoise(rand, 21);
    var warpA = makeNoise(rand, 3);
    var warpB = makeNoise(rand, 6);
    for (var y = 0; y < size; y += 1) {
        for (var x = 0; x < size; x += 1) {
            var u = x / size;
            var v = y / size;
            // Domain warp bends the noise into filaments instead of round puffs.
            var wu = u + (warpA(u * 0.7, v * 1.3) - 0.5) * 0.24;
            var wv = v + (warpB(u * 1.3, v * 0.7) - 0.5) * 0.18;
            var noise = coarse(wu, wv) * 0.4 + mid(wu * 1.1, wv) * 0.35 + fine(wu, wv) * 0.25;
            var dx = (u - 0.5) * 2;
            var dy = (v - 0.5) * 2;
            var dist = Math.min(1, Math.sqrt(dx * dx + dy * dy * 0.8));
            var falloff = Math.pow(1 - dist, 1.9);
            var alpha = Math.max(0, Math.min(1, (noise * 1.95 - 0.55) * falloff));
            var i = (y * size + x) * 4;
            image.data[i] = tone;
            image.data[i + 1] = tone;
            image.data[i + 2] = tone;
            image.data[i + 3] = Math.round(alpha * 255);
        }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}
function createSmoke(canvas, isReduced) {
    var ctx = canvas.getContext("2d", { alpha: true });
    var sprites = [0, 1, 2, 3, 4].map(function (i) {
        return buildSprite(192, 212 + i * 9, 9173 + i * 733);
    });
    var width = 0;
    var height = 0;
    var puffs = [];
    var raf = 0;
    var running = false;
    var last = 0;
    var time = 0;
    var wind = 0;
    var rand = mulberry32(24680);
    var dpr = function () {
        return Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    };
    var baseRadius = function () { return Math.max(width, height) * 0.115; };
    var floorY = function () { return height * 0.86; };
    function spawn(age) {
        if (age === void 0) { age = 0; }
        var r = baseRadius();
        var spread = width * 0.4;
        return {
            x: width * 0.5 + (rand() - 0.5) * spread * 2,
            y: floorY() - height * 0.07 + rand() * height * 0.13,
            r: r * (0.55 + rand() * 0.85),
            vx: (rand() - 0.5) * 8,
            vy: -(11 + rand() * 15),
            age: age,
            life: 12 + rand() * 9,
            peak: 0.11 + rand() * 0.07,
            rot: rand() * Math.PI * 2,
            vrot: (rand() - 0.5) * 0.05,
            sprite: Math.floor(rand() * sprites.length) % sprites.length,
            wobble: rand() * Math.PI * 2,
            burst: false,
        };
    }
    function spawnBurst(dir) {
        if (dir === void 0) { dir = 0; }
        var r = baseRadius();
        // The deck is wide once open, so the burst has to live in the outer bands
        // to stay visible: some wisps slip past each end, the rest hug the base.
        var side = rand() < 0.5 ? -1 : 1;
        var outward = width * (0.3 + rand() * 0.22) * side;
        return {
            x: width * 0.5 + outward + dir * width * 0.03,
            y: floorY() + rand() * height * 0.04,
            r: r * (0.9 + rand() * 1.0),
            vx: side * (9 + rand() * 16) + dir * 10,
            vy: -(20 + rand() * 24),
            age: 0,
            life: 5 + rand() * 3.2,
            peak: 0.17 + rand() * 0.09,
            rot: rand() * Math.PI * 2,
            vrot: (rand() - 0.5) * 0.16,
            sprite: Math.floor(rand() * sprites.length) % sprites.length,
            wobble: rand() * Math.PI * 2,
            burst: true,
        };
    }
    function measure() {
        var nextW = canvas.clientWidth;
        var nextH = canvas.clientHeight;
        if (!nextW || !nextH)
            return false;
        var ratio = dpr();
        var resized = nextW !== width || nextH !== height;
        if (resized && width && height) {
            var sx = nextW / width;
            var sy = nextH / height;
            for (var _i = 0, puffs_1 = puffs; _i < puffs_1.length; _i++) {
                var puff = puffs_1[_i];
                puff.x *= sx;
                puff.y *= sy;
            }
        }
        width = nextW;
        height = nextH;
        if (canvas.width !== Math.round(width * ratio) ||
            canvas.height !== Math.round(height * ratio)) {
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
        }
        ctx === null || ctx === void 0 ? void 0 : ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return resized;
    }
    function count() {
        if (width < 560)
            return 14;
        if (width < 900)
            return 20;
        return 26;
    }
    function seed() {
        puffs = [];
        var total = count();
        for (var i = 0; i < total; i += 1) {
            var puff = spawn(rand() * 10);
            puff.age = rand() * puff.life * 0.85;
            puffs.push(puff);
        }
    }
    function draw(dt, advance) {
        if (!ctx)
            return;
        ctx.clearRect(0, 0, width, height);
        var ambientTarget = count();
        var ambient = 0;
        for (var i = 0; i < puffs.length; i += 1) {
            var puff = puffs[i];
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
                var turbulence = Math.sin(time * 0.42 + puff.wobble) * 3.2;
                puff.vx += (turbulence + wind - puff.vx) * 0.5 * dt;
                puff.vy += Math.sin(time * 0.27 + puff.wobble * 1.7) * 1.6 * dt;
                puff.x += puff.vx * dt;
                puff.y += puff.vy * dt;
                puff.rot += puff.vrot * dt;
                wind *= 1 - 0.7 * dt;
            }
            if (!puff.burst)
                ambient += 1;
            var k = Math.min(1, puff.age / puff.life);
            var rise = k < (puff.burst ? 0.12 : 0.18)
                ? k / (puff.burst ? 0.12 : 0.18)
                : k > 0.62
                    ? Math.max(0, 1 - (k - 0.62) / 0.38)
                    : 1;
            // Dissolve before the canvas boundary so the smoke never shows a cut edge.
            var nx = puff.x / width;
            var ny = puff.y / height;
            var edge = Math.max(0, Math.min(1, Math.min(nx, 1 - nx) / 0.11, (1 - ny) / 0.11));
            var alpha = puff.peak * rise * rise * edge;
            if (alpha <= 0.001)
                continue;
            var grow = 1 + k * 0.42;
            // Slightly taller than wide, so puffs read as rising vapour rather than fog discs.
            var rx = puff.r * grow * 0.74;
            var ry = puff.r * grow * 1.34;
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
    function frame(now) {
        if (!running)
            return;
        var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
        last = now;
        time += dt;
        draw(dt, true);
        raf = requestAnimationFrame(frame);
    }
    function start() {
        if (running)
            return;
        if (measure()) {
            if (!puffs.length)
                seed();
        }
        else if (!puffs.length) {
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
        if (raf)
            cancelAnimationFrame(raf);
        raf = 0;
    }
    start();
    return {
        burst: function (dir) {
            if (dir === void 0) { dir = 0; }
            measure();
            if (!puffs.length)
                seed();
            if (isReduced()) {
                draw(0, false);
                return;
            }
            var total = width < 560 ? 8 : 14;
            for (var i = 0; i < total; i += 1)
                puffs.push(spawnBurst(dir));
            if (puffs.length > 76)
                puffs.splice(0, puffs.length - 76);
            wind += dir * 3;
            if (!running)
                start();
        },
        nudge: function (dir) {
            if (isReduced())
                return;
            for (var i = 0; i < 3; i += 1) {
                var puff = spawnBurst(dir);
                puff.peak *= 0.55;
                puff.r *= 0.8;
                puff.vy *= 0.6;
                puffs.push(puff);
            }
            wind += dir * 6;
            if (puffs.length > 76)
                puffs.splice(0, puffs.length - 76);
            if (!running)
                start();
        },
        setRunning: function (next) {
            if (next) {
                measure();
                if (!puffs.length)
                    seed();
                start();
            }
            else {
                stop();
            }
        },
        destroy: function () {
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
    var _a = (0, react_1.useState)(function () {
        return typeof window === "undefined"
            ? false
            : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }), reduced = _a[0], setReduced = _a[1];
    (0, react_1.useEffect)(function () {
        var query = window.matchMedia("(prefers-reduced-motion: reduce)");
        var onChange = function (event) { return setReduced(event.matches); };
        query.addEventListener("change", onChange);
        return function () { return query.removeEventListener("change", onChange); };
    }, []);
    return reduced;
}
/** The compact deck: front card low and centred, the other two peeking above. */
var COMPACT = [
    { x: 0, y: 12, z: 0, scale: 1, rotate: 0 },
    { x: 18, y: -16, z: -58, scale: 0.972, rotate: 1.7 },
    { x: 36, y: -46, z: -116, scale: 0.944, rotate: 3.4 },
];
/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */
function Arena() {
    var reducedMotion = useReducedMotion();
    var _a = (0, react_1.useState)(function () {
        return typeof window !== "undefined" &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    }), finePointer = _a[0], setFinePointer = _a[1];
    (0, react_1.useEffect)(function () {
        var query = window.matchMedia("(hover: hover) and (pointer: fine)");
        var onChange = function (event) { return setFinePointer(event.matches); };
        query.addEventListener("change", onChange);
        return function () { return query.removeEventListener("change", onChange); };
    }, []);
    var sectionRef = (0, react_1.useRef)(null);
    var stageRef = (0, react_1.useRef)(null);
    var deckRef = (0, react_1.useRef)(null);
    var canvasRef = (0, react_1.useRef)(null);
    var slotRefs = (0, react_1.useRef)([]);
    var _b = (0, react_1.useState)(false), entered = _b[0], setEntered = _b[1];
    var _c = (0, react_1.useState)(false), expanded = _c[0], setExpanded = _c[1];
    var _d = (0, react_1.useState)(0), active = _d[0], setActive = _d[1];
    var smokeRef = (0, react_1.useRef)(null);
    var reducedRef = (0, react_1.useRef)(reducedMotion);
    reducedRef.current = reducedMotion;
    var spreadRef = (0, react_1.useRef)(0);
    var focusRef = (0, react_1.useRef)([1, 0, 0]);
    var targetSpreadRef = (0, react_1.useRef)(0);
    var targetFocusRef = (0, react_1.useRef)([1, 0, 0]);
    var rafRef = (0, react_1.useRef)(0);
    var lastFrameRef = (0, react_1.useRef)(0);
    var expandedRef = (0, react_1.useRef)(false);
    var activeRef = (0, react_1.useRef)(0);
    // True only while the deck is being driven from the keyboard, so a pointer
    // press never gets treated as a second, collapsing activation.
    var keyboardRef = (0, react_1.useRef)(false);
    /* --- layout ------------------------------------------------------ */
    var applyTransforms = (0, react_1.useCallback)(function () {
        var _a;
        var stage = stageRef.current;
        if (!stage)
            return;
        var stageWidth = stage.clientWidth;
        var floor = stage.querySelector(".arena-floor");
        var first = slotRefs.current[0];
        var cardWidth = (_a = first === null || first === void 0 ? void 0 : first.offsetWidth) !== null && _a !== void 0 ? _a : 280;
        var narrow = stageWidth < 620;
        var sep = narrow
            ? cardWidth * 0.42
            : Math.min(cardWidth + 26, Math.max(cardWidth * 0.34, (stageWidth - 48 - cardWidth) / 2));
        var spread = spreadRef.current;
        slotRefs.current.forEach(function (slot, i) {
            var _a;
            var card = slot === null || slot === void 0 ? void 0 : slot.querySelector(".arena-card");
            if (!slot || !card)
                return;
            var focus = (_a = focusRef.current[i]) !== null && _a !== void 0 ? _a : 0;
            var base = COMPACT[i];
            var s = spread;
            // A phone cannot spread three readable cards side by side, so the deck
            // stays a pile there: the chosen card simply lifts out of it.
            var compactX = narrow ? base.x * 0.45 : base.x;
            var expandX = (i - 1) * sep;
            var expandY = focus * -16 - (1 - focus) * 2;
            var expandZ = focus * 86 - (1 - focus) * 26;
            var expandScale = 1 + focus * 0.045 - (1 - focus) * 0.015;
            var x = compactX * (1 - s) + (narrow ? compactX : expandX) * s;
            var y = base.y * (1 - s) + (narrow ? base.y - focus * 10 : expandY) * s;
            var z = base.z * (1 - s) + (narrow ? base.z + focus * 78 : expandZ) * s;
            var scale = base.scale * (1 - s) +
                (narrow ? base.scale + focus * 0.105 : expandScale) * s;
            var rotateZ = base.rotate * (1 - s * (narrow ? 0.35 : 1));
            var rotateY = (1 - i) * 2.2 * s * (1 - focus * 0.85);
            var rotateX = (1 - s) * 3.4 + s * 1.1;
            card.style.transform =
                "translate3d(".concat(x.toFixed(2), "px, ").concat(y.toFixed(2), "px, ").concat(z.toFixed(2), "px) ") +
                    "rotateX(".concat(rotateX.toFixed(2), "deg) rotateY(").concat(rotateY.toFixed(2), "deg) ") +
                    "rotateZ(".concat(rotateZ.toFixed(2), "deg) scale(").concat(scale.toFixed(4), ")");
            slot.style.zIndex = String(Math.round(30 + focus * 20 - i * 3 * (1 - s)));
            card.classList.toggle("is-active", focus > 0.5);
            card.style.setProperty("--arena-focus", focus.toFixed(3));
        });
        if (floor) {
            floor.style.opacity = String(0.34 + spread * 0.4);
            floor.style.transform = "translate3d(0,0,0) scaleX(".concat(0.66 + spread * 0.34, ")");
        }
    }, []);
    /* --- motion loop ------------------------------------------------- */
    var tick = (0, react_1.useCallback)(function () {
        var now = performance.now();
        var dt = Math.min(0.034, Math.max(0.001, (now - lastFrameRef.current) / 1000));
        lastFrameRef.current = now;
        var steps = 3;
        var h = dt / steps;
        var moving = false;
        for (var step = 0; step < steps; step += 1) {
            // Damped spring: restrained overshoot, quick natural settle.
            var ds = targetSpreadRef.current - spreadRef.current;
            spreadRef.current += ds * Math.min(1, h * 11);
            if (Math.abs(ds) > 0.0008)
                moving = true;
            for (var i = 0; i < focusRef.current.length; i += 1) {
                var df = targetFocusRef.current[i] - focusRef.current[i];
                focusRef.current[i] += df * Math.min(1, h * 12);
                if (Math.abs(df) > 0.0008)
                    moving = true;
            }
        }
        if (Math.abs(targetSpreadRef.current - spreadRef.current) < 0.0008) {
            spreadRef.current = targetSpreadRef.current;
        }
        for (var i = 0; i < focusRef.current.length; i += 1) {
            if (Math.abs(targetFocusRef.current[i] - focusRef.current[i]) < 0.0008) {
                focusRef.current[i] = targetFocusRef.current[i];
            }
        }
        applyTransforms();
        if (moving) {
            rafRef.current = requestAnimationFrame(tick);
        }
        else {
            rafRef.current = 0;
        }
    }, [applyTransforms]);
    var ensureLoop = (0, react_1.useCallback)(function () {
        if (reducedMotion) {
            spreadRef.current = targetSpreadRef.current;
            focusRef.current = __spreadArray([], targetFocusRef.current, true);
            applyTransforms();
            return;
        }
        if (rafRef.current)
            return;
        lastFrameRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [applyTransforms, reducedMotion, tick]);
    var setLayout = (0, react_1.useCallback)(function (nextActive, nextExpanded, burst, dir) {
        var _a, _b;
        if (dir === void 0) { dir = 0; }
        var wasExpanded = expandedRef.current;
        expandedRef.current = nextExpanded;
        activeRef.current = nextActive;
        targetSpreadRef.current = nextExpanded ? 1 : 0;
        targetFocusRef.current = nextExpanded
            ? [0, 1, 2].map(function (i) { return (i === nextActive ? 1 : 0); })
            : [1, 0, 0];
        setExpanded(nextExpanded);
        setActive(nextActive);
        ensureLoop();
        if (!burst)
            return;
        if (nextExpanded && !wasExpanded) {
            (_a = smokeRef.current) === null || _a === void 0 ? void 0 : _a.burst(dir);
        }
        else if (nextExpanded && wasExpanded) {
            (_b = smokeRef.current) === null || _b === void 0 ? void 0 : _b.nudge(dir);
        }
    }, [ensureLoop]);
    /* --- entrance ---------------------------------------------------- */
    (0, react_1.useEffect)(function () {
        var section = sectionRef.current;
        if (!section)
            return;
        if (!("IntersectionObserver" in window)) {
            setEntered(true);
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                if (entry.isIntersecting) {
                    setEntered(true);
                    observer.disconnect();
                }
            }
        }, { threshold: 0.22, rootMargin: "0px 0px -6% 0px" });
        observer.observe(section);
        return function () { return observer.disconnect(); };
    }, []);
    /* --- smoke lifecycle --------------------------------------------- */
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        var stage = stageRef.current;
        if (!canvas || !stage)
            return;
        var controller = createSmoke(canvas, function () { return reducedRef.current; });
        smokeRef.current = controller;
        var measuredImmediately = false;
        var reposition = function () {
            controller.setRunning(visible && document.visibilityState === "visible");
            if (!measuredImmediately) {
                measuredImmediately = true;
                requestAnimationFrame(function () { return controller.setRunning(visible && document.visibilityState === "visible"); });
            }
        };
        var visible = false;
        var visibility = new IntersectionObserver(function (entries) {
            var _a, _b;
            visible = (_b = (_a = entries[0]) === null || _a === void 0 ? void 0 : _a.isIntersecting) !== null && _b !== void 0 ? _b : false;
            reposition();
        }, { rootMargin: "80px 0px" });
        visibility.observe(stage);
        var onVisibility = function () { return reposition(); };
        document.addEventListener("visibilitychange", onVisibility);
        var resize = new ResizeObserver(function () {
            reposition();
            applyTransforms();
        });
        resize.observe(stage);
        return function () {
            visibility.disconnect();
            resize.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            controller.destroy();
            smokeRef.current = null;
        };
    }, [applyTransforms]);
    // Reduced motion: no spring, no continuous smoke, instant states.
    (0, react_1.useEffect)(function () {
        if (!reducedMotion)
            return;
        spreadRef.current = targetSpreadRef.current;
        focusRef.current = __spreadArray([], targetFocusRef.current, true);
        applyTransforms();
    }, [reducedMotion, applyTransforms]);
    (0, react_1.useEffect)(function () {
        applyTransforms();
        return function () {
            if (rafRef.current)
                cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        };
    }, [applyTransforms]);
    /* --- interaction ------------------------------------------------- */
    var expandTo = (0, react_1.useCallback)(function (index) {
        var dir = index - activeRef.current;
        setLayout(index, true, true, dir);
    }, [setLayout]);
    var collapse = (0, react_1.useCallback)(function () {
        setLayout(0, false, false);
    }, [setLayout]);
    var handleCardClick = (0, react_1.useCallback)(function (index) {
        if (expandedRef.current && activeRef.current === index) {
            collapse();
            return;
        }
        expandTo(index);
    }, [collapse, expandTo]);
    var handleCardFocus = (0, react_1.useCallback)(function (index) {
        if (!keyboardRef.current)
            return;
        if (!expandedRef.current) {
            expandTo(index);
        }
        else if (activeRef.current !== index) {
            setLayout(index, true, true, index - activeRef.current);
        }
    }, [expandTo, setLayout]);
    (0, react_1.useEffect)(function () {
        var onPointerDown = function () {
            keyboardRef.current = false;
        };
        var onKeyDown = function (event) {
            if (event.key === "Tab" || event.key.startsWith("Arrow")) {
                keyboardRef.current = true;
            }
            if (event.key !== "Escape")
                return;
            if (expandedRef.current)
                collapse();
        };
        var onDocumentPointerDown = function (event) {
            var stage = stageRef.current;
            if (!stage)
                return;
            if (event.target instanceof Node && stage.contains(event.target))
                return;
            if (expandedRef.current)
                collapse();
        };
        window.addEventListener("pointerdown", onPointerDown, { passive: true });
        window.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onDocumentPointerDown);
        return function () {
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onDocumentPointerDown);
        };
    }, [collapse]);
    var handleDeckKeyDown = (0, react_1.useCallback)(function (event) {
        var _a, _b, _c;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
            return;
        var cards = Array.from((_b = (_a = deckRef.current) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".arena-card")) !== null && _b !== void 0 ? _b : []);
        var current = cards.indexOf(document.activeElement);
        if (current < 0)
            return;
        event.preventDefault();
        var delta = event.key === "ArrowRight" ? 1 : -1;
        var next = (current + delta + cards.length) % cards.length;
        (_c = cards[next]) === null || _c === void 0 ? void 0 : _c.focus();
    }, []);
    /* --- render ------------------------------------------------------ */
    var hint = reducedMotion
        ? "SELECT A TRACK"
        : finePointer
            ? "SELECT A TRACK TO OPEN"
            : "TAP A TRACK TO OPEN";
    return (<section className={"landing-hackathons arena ".concat(entered ? "is-entered" : "")} id="hackathons" ref={sectionRef} data-expanded={expanded ? "true" : "false"}>
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

      <div className="arena-rule" aria-hidden="true"/>

      <div className="arena-stage" ref={stageRef} onPointerDown={function (event) {
            if (event.target instanceof Element && event.target.closest(".arena-card"))
                return;
            if (expandedRef.current)
                collapse();
        }}>
        <div className="arena-floor" aria-hidden="true"/>
        <div className="arena-slashes" aria-hidden="true">
          <span className="arena-slash arena-slash--white"/>
          <span className="arena-slash arena-slash--purple"/>
          <span className="arena-slash arena-slash--lime"/>
        </div>
        <canvas className="arena-smoke" ref={canvasRef} aria-hidden="true"/>

        <div className="arena-deck" ref={deckRef} role="group" aria-label="CampusCode challenge tracks" onKeyDown={handleDeckKeyDown}>
          {ARENA_CARDS.map(function (card, i) {
            var _a;
            return (<div key={card.id} className="arena-slot" ref={function (el) {
                    slotRefs.current[i] = el;
                }} style={_a = {}, _a["--arena-index"] = i, _a}>
              <button type="button" className={"arena-card arena-card--".concat(card.variant)} onClick={function () { return handleCardClick(i); }} onFocus={function () { return handleCardFocus(i); }} aria-pressed={expanded && active === i} aria-label={"".concat(card.number, " ").concat(card.title, " \u2014 ").concat(card.description, " Status ").concat(card.status.toLowerCase())}>
                <span className="arena-card-media">
                  <img src={card.image} alt={card.alt} loading="lazy" draggable={false}/>
                  <span className="arena-card-number" aria-hidden="true">
                    {card.number}
                  </span>
                </span>
                <span className="arena-card-body">
                  <span className="arena-card-meta">
                    <span className="arena-card-category">{card.category}</span>
                  </span>
                  <span className="arena-card-title">{card.title}</span>
                  <span className="arena-card-desc">{card.description}</span>
                  <span className="arena-card-foot">
                    <span className={"arena-status arena-status--".concat(card.status.toLowerCase())}>
                      <i aria-hidden="true"/>
                      {card.status}
                    </span>
                    <span className="arena-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                </span>
              </button>
            </div>);
        })}
        </div>
      </div>

      <div className="arena-foot">
        <span className="arena-hint">{hint}</span>
        <span className="arena-note">3 TRACKS · CHENNAI · 2026</span>
      </div>

      <p className="arena-sr" aria-live="polite">
        {expanded
            ? "".concat(ARENA_CARDS[active].title, " selected.")
            : "Challenge tracks collapsed."}
      </p>
    </section>);
}
