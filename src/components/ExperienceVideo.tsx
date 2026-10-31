import { useCallback, useEffect, useRef, useState } from "react";
import "./ExperienceVideo.css";

const SRC = "/videos/campuscode-story.mp4#t=0.1";

/**
 * Fired by "Watch full story ›" / "WATCH STORY" after they scroll here.
 * Listeners in other sections call this; the player itself never scrolls the
 * page, replaces the section heading, or dispatches scroll-like events.
 */
export const PLAY_EXPERIENCE_EVENT = "campuscode:play-experience";
export function requestExperiencePlay() {
  window.dispatchEvent(new Event(PLAY_EXPERIENCE_EVENT));
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ExperienceVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const tiltRef = useRef<{ x: number; y: number } | null>(null);
  const errorLogged = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState(false);
  const [entered, setEntered] = useState(false);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || error) return;
    video.muted = false;
    setMuted(false);
    try {
      await video.play();
    } catch (reason) {
      console.warn("[ExperienceVideo] play() was rejected", reason);
    }
  }, [error]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video || error) return;
    if (video.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause, error]);

  const onSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  const onSurfaceKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (playing) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    tiltRef.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyTilt);
    }
  };

  const applyTilt = () => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const tilt = tiltRef.current;
    if (!tilt) {
      rafRef.current = null;
      return;
    }
    const targetX = tilt.x * -3;
    const targetY = tilt.y * 3;
    const currentX = parseFloat(surface.style.getPropertyValue("--tilt-x") ?? "0");
    const currentY = parseFloat(surface.style.getPropertyValue("--tilt-y") ?? "0");
    const easeX = currentX + (targetX - currentX) * 0.18;
    const easeY = currentY + (targetY - currentY) * 0.18;
    surface.style.setProperty("--tilt-x", String(easeX));
    surface.style.setProperty("--tilt-y", String(easeY));
    if (Math.abs(easeX - targetX) > 0.05 || Math.abs(easeY - targetY) > 0.05) {
      rafRef.current = requestAnimationFrame(applyTilt);
    } else {
      rafRef.current = null;
    }
  };

  const onMouseLeave = () => {
    tiltRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.setProperty("--tilt-x", "0");
      surface.style.setProperty("--tilt-y", "0");
    }
  };

  // Entrance reveal: plays once when the player enters the viewport.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (prefersReduced) {
              setEntered(true);
            } else {
              setEntered(true);
            }
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Pause when the player leaves the viewport or the tab is hidden.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const pause = () => videoRef.current?.pause();

    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // External "play" requests (watch-story links) start the same video.
  useEffect(() => {
    const onRequest = () => {
      const video = videoRef.current;
      if (!video || error) return;
      video.muted = false;
      void video.play().catch((reason: unknown) => {
        console.warn("[ExperienceVideo] play() was rejected", reason);
      });
    };
    window.addEventListener(PLAY_EXPERIENCE_EVENT, onRequest);
    return () => window.removeEventListener(PLAY_EXPERIENCE_EVENT, onRequest);
  }, [error]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const onSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(event.target.value);
    video.currentTime = next;
    setCurrent(next);
  };

  const goFullscreen = () => {
    const surface = wrapRef.current?.parentElement ?? wrapRef.current;
    if (!surface) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    void surface.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="experience-visual-wrap">
      <div
        ref={wrapRef}
        className={`experience-video-placeholder xv-surface${playing ? " is-playing" : ""}${entered ? " is-entered" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={playing ? "Pause video" : "Play video"}
        aria-describedby={error ? "xv-error" : undefined}
        onClick={onSurfaceClick}
        onKeyDown={onSurfaceKeyDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <video
          ref={videoRef}
          className="xv-video"
          src={SRC}
          playsInline
          preload="metadata"
          controls={false}
          muted={muted}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
          }}
          onDurationChange={(event) => {
            const video = event.currentTarget;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrent(0);
          }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onError={(event) => {
            setPlaying(false);
            setError(true);
            if (!errorLogged.current) {
              errorLogged.current = true;
              console.error("[ExperienceVideo] video failed to load", SRC, event.currentTarget.error);
            }
          }}
        />

        <div className="xv-scrim" aria-hidden="true" />
        <div className="experience-video-text" aria-hidden="true">
          <span>02</span>
          <span className="experience-video-dash">—</span>
          <span>CAMPUSCODE EXPERIENCE</span>
        </div>

        <span className="xv-live" aria-hidden="true">● LIVE STORY</span>

        {!error ? (
          <span className="experience-play" aria-hidden="true">
            <span className="experience-play-icon">▶</span>
            <span className="experience-play-label">PLAY STORY</span>
          </span>
        ) : null}

        <div className="experience-video-meta">
          <span>{duration ? formatTime(duration) : "--:--"}</span>
          <span className="experience-video-dot">·</span>
          <span>FULL STORY</span>
        </div>

        {error ? (
          <p className="xv-error" id="xv-error" role="status">
            Video unavailable right now
          </p>
        ) : null}
      </div>

      {playing ? (
        <div className="xv-controls" onClick={(event) => event.stopPropagation()}>
          <input
            className="xv-seek"
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={Math.min(current, duration || 0)}
            onChange={onSeek}
            aria-label="Seek video"
          />
          <div className="xv-controls__row">
            <button
              type="button"
              className="xv-btn"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Unmute video" : "Mute video"}
            >
              {muted ? "UNMUTE" : "MUTE"}
            </button>
            <span className="xv-controls__time">
              {formatTime(current)} / {formatTime(duration)}
            </span>
            <button type="button" className="xv-btn" onClick={goFullscreen} aria-label="Fullscreen video">
              ⤢ FULLSCREEN
            </button>
          </div>
        </div>
      ) : null}

      <div className="xv-strip" aria-hidden="true" />
    </div>
  );
}
