"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinematicIntro = CinematicIntro;
var react_1 = require("react");
var gsap_1 = require("gsap");
var ScrollTrigger_1 = require("gsap/ScrollTrigger");
var Hero_1 = require("./Hero");
var Sections_1 = require("./Sections");
gsap_1.default.registerPlugin(ScrollTrigger_1.ScrollTrigger);
ScrollTrigger_1.ScrollTrigger.config({ ignoreMobileResize: true });
/** Scroll progress at which the hero is fully revealed and the visitor is "in". */
var ENTER_PROGRESS = 0.55;
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
function CinematicIntro(_a) {
    var reducedMotion = _a.reducedMotion, ready = _a.ready, _b = _a.entered, entered = _b === void 0 ? false : _b, onEntered = _a.onEntered, primer = _a.primer;
    var rootRef = (0, react_1.useRef)(null);
    var blackoutRef = (0, react_1.useRef)(null);
    var heroWindowRef = (0, react_1.useRef)(null);
    var diagonalRef = (0, react_1.useRef)(null);
    var primerRef = (0, react_1.useRef)(null);
    var progressRef = (0, react_1.useRef)(0);
    // panelsRef removed: the IDEAS NEED BUILDERS editorial panels were removed;
    // the hero-window now expands directly into the full page below it.
    var internalReducedMotion = useReducedMotion();
    var isReduced = reducedMotion || internalReducedMotion;
    var onEnteredRef = (0, react_1.useRef)(onEntered);
    var enteredOnceRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        onEnteredRef.current = onEntered;
    }, [onEntered]);
    (0, react_1.useLayoutEffect)(function () {
        var _a;
        if (isReduced || !ready)
            return;
        var root = rootRef.current;
        var blackout = blackoutRef.current;
        var heroWindow = heroWindowRef.current;
        var diagonal = diagonalRef.current;
        var primer = primerRef.current;
        if (!root || !blackout || !heroWindow || !diagonal || !primer)
            return;
        var ctx = gsap_1.default.context(function () {
            var nav = root.querySelector(".landing-nav");
            var topLine = root.querySelector(".hero-top-line");
            var heroLabel = root.querySelector(".hero-label");
            var description = root.querySelector(".hero-description");
            var bottom = root.querySelector(".hero-bottom");
            var object = root.querySelector(".hero-object");
            var heroInner = root.querySelector(".hero-inner");
            var lines = gsap_1.default.utils.toArray(".hero-line-inner", root);
            // The About page sits behind the hero window and is revealed by the same
            // timeline once the hero retires into the lime diagonal.
            var aboutLines = gsap_1.default.utils.toArray(".about-headline-line", root);
            var aboutLabel = root.querySelector(".about-left .section-number");
            var aboutSmall = root.querySelector(".about-left .small-label");
            var aboutLead = root.querySelector(".about-lead");
            var aboutCard = root.querySelector(".about-right-card");
            var aboutBadge = root.querySelector(".about-cc-icon");
            var aboutLogo = root.querySelector(".about-cc-logo");
            var aboutMarkers = gsap_1.default.utils.toArray(".about-marker, .about-marker--vr", root);
            var reveal = { gap: 0 };
            var setGap = function () {
                blackout.style.setProperty("--slit-gap", "".concat(reveal.gap, "%"));
            };
            setGap();
            gsap_1.default.set(heroWindow, { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1 });
            gsap_1.default.set(primer, { autoAlpha: 1 });
            gsap_1.default.set(lines, { y: 0, yPercent: 118, rotate: 2.4, transformOrigin: "0% 100%" });
            gsap_1.default.set(nav, { y: -18, autoAlpha: 0 });
            gsap_1.default.set([heroLabel, description], { y: 24, autoAlpha: 0 });
            gsap_1.default.set(bottom, { autoAlpha: 0 });
            gsap_1.default.set(object, { scale: 0.82, transformOrigin: "50% 50%" });
            gsap_1.default.set(diagonal, { autoAlpha: 0, rotate: 0, scaleY: 1 });
            gsap_1.default.set(aboutLines, { yPercent: 118, opacity: 0, rotate: 2.4, transformOrigin: "0% 100%" });
            gsap_1.default.set([aboutLabel, aboutSmall], { autoAlpha: 0, y: 16 });
            gsap_1.default.set(aboutLead, { autoAlpha: 0, y: 26 });
            gsap_1.default.set(aboutCard, { autoAlpha: 0, y: 46 });
            gsap_1.default.set(aboutBadge, { autoAlpha: 0, scale: 0.6 });
            gsap_1.default.set(aboutLogo, { autoAlpha: 0, y: 18 });
            gsap_1.default.set(aboutMarkers, { autoAlpha: 0 });
            var distance = window.innerWidth < 700 ? 4.4 : 5;
            var tl = gsap_1.default.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    trigger: root,
                    start: "top top",
                    end: function () { return "+=".concat(window.innerHeight * distance); },
                    pin: root,
                    pinSpacing: true,
                    scrub: 0.65,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) {
                        var _a;
                        progressRef.current = self.progress;
                        if (enteredOnceRef.current)
                            return;
                        if (self.progress < ENTER_PROGRESS)
                            return;
                        enteredOnceRef.current = true;
                        (_a = onEnteredRef.current) === null || _a === void 0 ? void 0 : _a.call(onEnteredRef);
                    },
                },
            });
            tl
                // Stage 1 — the completed CODING screen holds.
                .to({}, { duration: 0.045 })
                .to(primer, { autoAlpha: 0, duration: 0.045, ease: "power2.inOut" }, 0.03)
                // Stage 2 — a two-pixel vertical slit appears.
                .to(reveal, { gap: 0.14, duration: 0.055, ease: "power2.out", onUpdate: setGap }, 0.045)
                // Stage 3 — the slit opens into the full hero.
                .to(reveal, { gap: 56, duration: 0.31, ease: "power3.inOut", onUpdate: setGap }, 0.11)
                .to(nav, { y: 0, autoAlpha: 1, duration: 0.12, ease: "power2.out" }, 0.15)
                .to(topLine, { y: 0, autoAlpha: 1, duration: 0.14, ease: "power2.out" }, 0.17)
                .to(lines, {
                y: 0,
                yPercent: 0,
                rotate: 0,
                duration: 0.3,
                stagger: 0.045,
                ease: "power4.out",
            }, 0.17)
                .to(heroLabel, { y: 0, autoAlpha: 1, duration: 0.12, ease: "power2.out" }, 0.21)
                .to(object, { scale: 1, duration: 0.34, ease: "power3.out" }, 0.22)
                .to(description, { y: 0, autoAlpha: 1, duration: 0.16, ease: "power2.out" }, 0.27)
                .to(bottom, { autoAlpha: 1, duration: 0.12 }, 0.35)
                // Stage 4 — the full hero, alive but restrained.
                .to(heroInner, { scale: 1.012, duration: 0.2, ease: "sine.inOut" }, 0.42)
                .to(object, { y: -12, x: 10, duration: 0.2, ease: "sine.inOut" }, 0.42)
                .to(".hero-object-halo", { opacity: 0.9, duration: 0.2 }, 0.42)
                // Stage 5 — the hero closes back into a central slit.
                .to(heroInner, { scale: 0.985, opacity: 0.7, duration: 0.17, ease: "power2.inOut" }, 0.59)
                .to(heroWindow, {
                clipPath: "inset(0% 49.93% 0% 49.93%)",
                duration: 0.19,
                ease: "power3.inOut",
            }, 0.59)
                // Stage 6 — the slit becomes a lime diagonal, flashes, then disappears.
                .set(diagonal, { autoAlpha: 1 }, 0.79)
                .to(diagonal, { rotate: -28, duration: 0.07, ease: "power2.inOut" }, 0.79)
                .to(heroWindow, { autoAlpha: 0, duration: 0.02 }, 0.8)
                .to(diagonal, { opacity: 1, duration: 0.03 }, 0.8)
                .to(diagonal, { scaleY: 0.022, opacity: 0, duration: 0.105, ease: "power3.in" }, 0.845)
                // Stage 7 — the About page is what the contracting hero opens onto, so
                // the headline rises while the slit wipes the hero away.
                .to(aboutLabel, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.57)
                .to(aboutSmall, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.575)
                .to(aboutLines, {
                yPercent: 0,
                opacity: 1,
                rotate: 0,
                duration: 0.12,
                stagger: 0.022,
                ease: "power4.out",
            }, 0.575)
                // Stage 8 — the rest of the section settles once the hero is gone.
                .to(aboutCard, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power3.out" }, 0.8)
                .to(aboutLead, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.82)
                .to(aboutBadge, { autoAlpha: 1, scale: 1, duration: 0.055, ease: "back.out(1.7)" }, 0.825)
                .to(aboutLogo, { autoAlpha: 1, y: 0, duration: 0.055, ease: "power2.out" }, 0.83)
                .to(aboutMarkers, { autoAlpha: 1, duration: 0.055, stagger: 0.02 }, 0.83);
        }, root);
        var refreshFrame = requestAnimationFrame(function () { return ScrollTrigger_1.ScrollTrigger.refresh(); });
        var onFontsReady = function () { return ScrollTrigger_1.ScrollTrigger.refresh(); };
        (_a = document.fonts) === null || _a === void 0 ? void 0 : _a.ready.then(onFontsReady).catch(function () { return undefined; });
        return function () {
            cancelAnimationFrame(refreshFrame);
            ctx.revert();
        };
    }, [isReduced, ready]);
    return (<div ref={rootRef} className={"cine ".concat(isReduced ? "is-reduced" : "", " ").concat(entered ? "is-entered" : "")}>
      <div className="cine-stage">
        {/*
          The animated page that used to sit empty after the hero now holds the
          whole About section. Reduced motion drops the pin, so the section is
          rendered in normal flow by App instead.
        */}
        {!isReduced && (<div className="cine-about">
            <Sections_1.AboutStage progress={progressRef} reducedMotion={false}/>
          </div>)}

        <div className="hero-window" ref={heroWindowRef}>
          <div className="hero-inner">
            <Hero_1.Hero progress={progressRef} reducedMotion={isReduced}/>
          </div>
        </div>

        <div className="cine-blackout" ref={blackoutRef} aria-hidden="true"/>

        <div className="cine-primer" ref={primerRef}>
          {primer}
        </div>

        <div className="diagonal-bar" ref={diagonalRef} aria-hidden="true">
          <span />
        </div>
      </div>
    </div>);
}
