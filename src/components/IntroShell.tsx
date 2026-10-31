import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoadingPrimer } from "./LoadingPrimer";
import { CinematicIntro } from "./CinematicIntro";
import { EnterGate } from "./EnterGate";
import { useAmbience } from "./Ambience";
import { scrollToSection } from "./scrollToSection";

type IntroShellProps = {
  reducedMotion: boolean;
};

const ENTRY_SCROLL_PX = 24;
const AUDIO_RELEASE_MS = 1600;
const SKIP_INTRO_KEY = "campuscode:skip-intro";
/** Set once the gate has been passed: later visits this session skip it. */
const ENTERED_KEY = "cc-entered";
const GATE_FADE_MS = 400;

export function IntroShell({ reducedMotion }: IntroShellProps) {
  const ambience = useAmbience();
  const { start, whoosh, stop, unlock, playLoading } = ambience;

  // A return visit from an auth page, or any visit after the gate has already
  // been passed this session, goes straight to the finished hero: no gate, no
  // loader and no loading sound.
  const [skipped] = useState(() => {
    try {
      if (sessionStorage.getItem(SKIP_INTRO_KEY) === "1") return true;
      return sessionStorage.getItem(ENTERED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [gateState, setGateState] = useState<"shown" | "leaving" | "gone">(
    skipped ? "gone" : "shown",
  );
  const [ready, setReady] = useState(skipped);
  const [entered, setEntered] = useState(skipped);

  useEffect(() => {
    if (sessionStorage.getItem(SKIP_INTRO_KEY) === "1") {
      sessionStorage.removeItem(SKIP_INTRO_KEY);
    }
  }, []);

  const whooshedRef = useRef(false);
  const gateEnteredRef = useRef(false);
  const gateAudioRef = useRef(false);
  const gateTimerRef = useRef<number | null>(null);

  const handleReady = useCallback(() => setReady(true), []);

  // Fired once, by the intro timeline, when the hero is fully revealed.
  const handleEntered = useCallback(() => setEntered(true), []);

  // The gate press is the gesture browsers need. Everything happens inside this
  // one handler: mark the session, resume the audio context, start the loading
  // cue, then fade the gate out and let the loader mount underneath.
  const handleGateEnter = useCallback(() => {
    if (gateEnteredRef.current) return;
    gateEnteredRef.current = true;

    try {
      sessionStorage.setItem(ENTERED_KEY, "1");
    } catch {
      // Private mode without storage: the gate still works for this visit.
    }

    gateAudioRef.current = true;
    unlock();
    void playLoading();

    setGateState("leaving");
    gateTimerRef.current = window.setTimeout(() => {
      gateTimerRef.current = null;
      setGateState("gone");
    }, GATE_FADE_MS);
  }, [unlock, playLoading]);

  useEffect(() => {
    return () => {
      if (gateTimerRef.current !== null) {
        window.clearTimeout(gateTimerRef.current);
        gateTimerRef.current = null;
      }
    };
  }, []);

  // The loading screen must be the very first frame, never a restored scroll
  // position somewhere inside the site.
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, []);

  // Lock scrolling before paint so the hero cannot flash behind the boot screen.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const shouldLock = reducedMotion ? !entered : !ready;
    if (shouldLock) {
      root.classList.add("intro-lock");
    } else {
      root.classList.remove("intro-lock");
    }
    return () => root.classList.remove("intro-lock");
  }, [entered, ready, reducedMotion]);

  // If autoplay is refused, the first gesture unlocks audio. Sound controls run
  // their own gesture logic, so they are skipped here: unlocking from their
  // pointerdown first would race with the press they are about to handle.
  useEffect(() => {
    const remove = () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };

    const onGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-sound-control]")) return;
      start();
      remove();
    };

    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchstart", onGesture, { passive: true });

    return remove;
  }, [start]);

  // Skip Intro must work while the intro still owns the scroll lock: retire the
  // loading screen and the intro first, then scroll once the lock is released.
  useEffect(() => {
    const onSkip = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("a.skip-link")) return;

      // Stop App's anchor handler from scrolling while html is still locked.
      event.preventDefault();
      whooshedRef.current = true;
      setReady(true);
      setEntered(true);
      window.setTimeout(() => scrollToSection("about"), 90);
    };

    document.addEventListener("click", onSkip);
    return () => document.removeEventListener("click", onSkip);
  }, []);

  // Exactly one whoosh, on the first scroll that leaves the loading screen.
  useEffect(() => {
    if (reducedMotion || !ready) return;

    const onScroll = () => {
      if (whooshedRef.current) return;
      if ((window.scrollY || 0) <= ENTRY_SCROLL_PX) return;
      whooshedRef.current = true;
      whoosh();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ready, reducedMotion, whoosh]);

  // Reduced motion keeps the same loading design, but the page never pins, so
  // the first scroll intent is what retires the loading screen.
  useEffect(() => {
    if (!reducedMotion || entered) return;

    const onIntent = () => {
      if (whooshedRef.current) return;
      whooshedRef.current = true;
      whoosh();
      setEntered(true);
      window.scrollTo(0, 0);
    };

    window.addEventListener("wheel", onIntent, { passive: true });
    window.addEventListener("touchmove", onIntent, { passive: true });
    window.addEventListener("keydown", onIntent);

    return () => {
      window.removeEventListener("wheel", onIntent);
      window.removeEventListener("touchmove", onIntent);
      window.removeEventListener("keydown", onIntent);
    };
  }, [entered, reducedMotion, whoosh]);

  // Once the visitor is inside the site the audio channel is released.
  useEffect(() => {
    if (!entered) return;
    const timer = window.setTimeout(() => stop(), AUDIO_RELEASE_MS);
    return () => window.clearTimeout(timer);
  }, [entered, stop]);

  return (
    <>
      {gateState !== "gone" ? (
        <EnterGate
          onEnter={handleGateEnter}
          leaving={gateState === "leaving"}
        />
      ) : null}

      <CinematicIntro
        reducedMotion={reducedMotion}
        ready={ready}
        entered={entered}
        onEntered={handleEntered}
        primer={
          entered || gateState === "shown" ? undefined : (
            <LoadingPrimer
              ambience={ambience}
              onReady={handleReady}
              reducedMotion={reducedMotion}
              autoPlay={!gateAudioRef.current}
            />
          )
        }
      />
    </>
  );
}
