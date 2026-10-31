import { useEffect, useRef } from "react";
import { CampusMark } from "./Logo";
import "./EnterGate.css";

type EnterGateProps = {
  /** Called from the click / Enter / Space gesture that unlocks audio. */
  onEnter: () => void;
  /** True while the 400ms fade-out is running. */
  leaving: boolean;
};

/**
 * Full-screen entry gate. It exists because browsers refuse to start audio
 * without a user gesture: the visitor's press here is what unlocks the loading
 * sound, so nothing (loader, audio, intro) starts before it.
 */
export function EnterGate({ onEnter, leaving }: EnterGateProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Enter must work immediately, without a Tab first.
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className={`cc-gate${leaving ? " is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Enter CampusCode"
    >
      <div className="cc-gate__inner">
        <span className="cc-gate__mark" aria-hidden="true">
          <CampusMark />
        </span>

        <p className="cc-gate__label">CAMPUSCODE / HACKATHON ARENA</p>

        <span className="cc-gate__cta">
          <button
            ref={buttonRef}
            type="button"
            className="cc-gate__enter"
            onClick={onEnter}
          >
            ENTER <span aria-hidden="true">↗</span>
          </button>
        </span>

        <p className="cc-gate__hint">
          <span aria-hidden="true">🔊</span> Best with sound on
        </p>
      </div>
    </div>
  );
}
