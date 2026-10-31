"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntroShell = IntroShell;
var react_1 = require("react");
var LoadingPrimer_1 = require("./LoadingPrimer");
var CinematicIntro_1 = require("./CinematicIntro");
var Ambience_1 = require("./Ambience");
var ENTRY_SCROLL_PX = 24;
var AUDIO_RELEASE_MS = 1600;
function IntroShell(_a) {
    var reducedMotion = _a.reducedMotion;
    var ambience = (0, Ambience_1.useAmbience)();
    var start = ambience.start, whoosh = ambience.whoosh, stop = ambience.stop;
    var _b = (0, react_1.useState)(false), ready = _b[0], setReady = _b[1];
    var _c = (0, react_1.useState)(false), entered = _c[0], setEntered = _c[1];
    var whooshedRef = (0, react_1.useRef)(false);
    var handleReady = (0, react_1.useCallback)(function () { return setReady(true); }, []);
    // Fired once, by the intro timeline, when the hero is fully revealed.
    var handleEntered = (0, react_1.useCallback)(function () { return setEntered(true); }, []);
    // The loading screen must be the very first frame, never a restored scroll
    // position somewhere inside the site.
    (0, react_1.useLayoutEffect)(function () {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
        var root = document.documentElement;
        var previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        root.style.scrollBehavior = previous;
    }, []);
    // Lock scrolling before paint so the hero cannot flash behind the boot screen.
    (0, react_1.useLayoutEffect)(function () {
        var root = document.documentElement;
        var shouldLock = reducedMotion ? !entered : !ready;
        if (shouldLock) {
            root.classList.add("intro-lock");
        }
        else {
            root.classList.remove("intro-lock");
        }
        return function () { return root.classList.remove("intro-lock"); };
    }, [entered, ready, reducedMotion]);
    // If autoplay is refused, the first gesture unlocks audio. Sound controls run
    // their own gesture logic, so they are skipped here: unlocking from their
    // pointerdown first would race with the press they are about to handle.
    (0, react_1.useEffect)(function () {
        var remove = function () {
            window.removeEventListener("pointerdown", onGesture);
            window.removeEventListener("keydown", onGesture);
            window.removeEventListener("touchstart", onGesture);
        };
        var onGesture = function (event) {
            var target = event.target;
            if (target instanceof Element && target.closest("[data-sound-control]"))
                return;
            start();
            remove();
        };
        window.addEventListener("pointerdown", onGesture, { passive: true });
        window.addEventListener("keydown", onGesture);
        window.addEventListener("touchstart", onGesture, { passive: true });
        return remove;
    }, [start]);
    // Exactly one whoosh, on the first scroll that leaves the loading screen.
    (0, react_1.useEffect)(function () {
        if (reducedMotion || !ready)
            return;
        var onScroll = function () {
            if (whooshedRef.current)
                return;
            if ((window.scrollY || 0) <= ENTRY_SCROLL_PX)
                return;
            whooshedRef.current = true;
            whoosh();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return function () { return window.removeEventListener("scroll", onScroll); };
    }, [ready, reducedMotion, whoosh]);
    // Reduced motion keeps the same loading design, but the page never pins, so
    // the first scroll intent is what retires the loading screen.
    (0, react_1.useEffect)(function () {
        if (!reducedMotion || entered)
            return;
        var onIntent = function () {
            if (whooshedRef.current)
                return;
            whooshedRef.current = true;
            whoosh();
            setEntered(true);
            window.scrollTo(0, 0);
        };
        window.addEventListener("wheel", onIntent, { passive: true });
        window.addEventListener("touchmove", onIntent, { passive: true });
        window.addEventListener("keydown", onIntent);
        return function () {
            window.removeEventListener("wheel", onIntent);
            window.removeEventListener("touchmove", onIntent);
            window.removeEventListener("keydown", onIntent);
        };
    }, [entered, reducedMotion, whoosh]);
    // Once the visitor is inside the site the audio channel is released.
    (0, react_1.useEffect)(function () {
        if (!entered)
            return;
        var timer = window.setTimeout(function () { return stop(); }, AUDIO_RELEASE_MS);
        return function () { return window.clearTimeout(timer); };
    }, [entered, stop]);
    return (<CinematicIntro_1.CinematicIntro reducedMotion={reducedMotion} ready={ready} entered={entered} onEntered={handleEntered} primer={entered ? undefined : (<LoadingPrimer_1.LoadingPrimer ambience={ambience} onReady={handleReady} reducedMotion={reducedMotion}/>)}/>);
}
