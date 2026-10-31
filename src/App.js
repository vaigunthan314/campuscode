"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var IntroShell_1 = require("./components/IntroShell");
var scrollToSection_1 = require("./components/scrollToSection");
var Sections_1 = require("./components/Sections");
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
function App() {
    var reducedMotion = useReducedMotion();
    // In-page anchors (skip link, footer) must resolve against pinned sections.
    (0, react_1.useEffect)(function () {
        var onClick = function (event) {
            var _a;
            if (event.defaultPrevented || event.button !== 0)
                return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                return;
            var target = event.target;
            if (!(target instanceof Element))
                return;
            var link = target.closest('a[href^="#"]');
            if (!link)
                return;
            var id = decodeURIComponent(((_a = link.getAttribute("href")) !== null && _a !== void 0 ? _a : "").slice(1));
            if (!id || !document.getElementById(id))
                return;
            event.preventDefault();
            (0, scrollToSection_1.scrollToSection)(id);
        };
        document.addEventListener("click", onClick);
        return function () { return document.removeEventListener("click", onClick); };
    }, []);
    return (<div className="campus-landing" id="top">
      <a className="skip-link" href="#about">
        SKIP INTRO
      </a>
      {/*
          IntroShell renders CinematicIntro which internally renders Hero
          inside .hero-window. Do NOT render a standalone <Hero> here —
          that would create a duplicate hero outside the cinematic sequence.
        */}
      <IntroShell_1.IntroShell reducedMotion={reducedMotion}/>
      <main>
        <Sections_1.Marquee />
        {/*
          Without the pin (reduced motion) the cinematic stage cannot reveal the
          About page, so it is rendered in normal flow instead. The stage is the
          only other place it renders — never both at once.
        */}
        <Sections_1.Experience />
        <Sections_1.HowItWorks />
        <Sections_1.Hackathons />
        <Sections_1.Mission />
        <Sections_1.Community />
        <Sections_1.JoinCTA />
      </main>
      <Sections_1.Footer />
    </div>);
}
