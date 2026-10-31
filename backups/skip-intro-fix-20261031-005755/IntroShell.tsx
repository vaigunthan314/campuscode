import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoadingPrimer } from "./LoadingPrimer";
import { CinematicIntro } from "./CinematicIntro";
import { useAmbience } from "./Ambience";

type IntroShellProps = {
  reducedMotion: boolean;
};

const ENTRY_SCROLL_PX = 24;
const AUDIO_RELEASE_MS = 1600;

export function IntroShell({ reducedMotion }: IntroShellProps) {
  const ambience = useAmbience();
  const { start, whoosh, stop } = ambience;

  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  const whooshedRef = useRef(false);

  const handleReady = useCallback(() => setReady(true), []);

  // Fired once, by the intro timeline, when the hero is fully revealed.
  const handleEntered = useCallback(() => setEntered(true), []);

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
    <CinematicIntro
      reducedMotion={reducedMotion}
      ready={ready}
      entered={entered}
      onEntered={handleEntered}
      primer={
        entered ? undefined : (
          <LoadingPrimer
            ambience={ambience}
            onReady={handleReady}
            reducedMotion={reducedMotion}
          />
        )
      }
    />
  );
}
