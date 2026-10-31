import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AudioStatus = "idle" | "live" | "ended";

export type AmbienceAPI = {
  status: AudioStatus;
  muted: boolean;
  /** Opens the audio channel from a user gesture. Intentionally silent. */
  start: () => void;
  setMuted: (muted: boolean) => void;
  /** Plays the loading audio file once from the beginning.
   * Requires a graph (created by a user gesture). If no graph exists it
   * records a pending intent and retries once the graph + decoded buffer are
   * available.
   */
  playLoading: () => Promise<void>;
  /** The one-and-only one-second entry whoosh. */
  whoosh: () => void;
  /** True when the browser refused to start audio without a gesture. */
  autoplayBlocked: boolean;
  /** Call from a user gesture to start the parked loading cue. */
  unlock: () => void;
  /** Fade the loading cue out; it never outlives the loading sequence. */
  stopLoading: () => void;
  /** Fade out and release the audio graph. */
  stop: () => void;
};

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
};

type AudioGlobals = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const MASTER_LEVEL = 0.85;
const RELEASE_DELAY = 620;

/** Loading audio plays at a comfortable, subtle level. */
const LOADING_LEVEL = 0.25;

/** Served by Vite from /public — played once, never looped. */
const LOADING_SOUND_URL = "/audio/loading.m4a";

/**
 * The download starts at module evaluation, before React mounts, so the bytes
 * are usually in memory long before the loading sequence wants to play them.
 * Decoding still needs an AudioContext, which the hook opens on mount.
 */
const loadingSoundRequest: Promise<ArrayBuffer> | null =
  typeof window !== "undefined" && typeof fetch === "function"
    ? fetch(LOADING_SOUND_URL).then((response) => {
        if (!response.ok) throw new Error(`loading sound: ${response.status}`);
        return response.arrayBuffer();
      })
    : null;

// Mark handled up front: a failure before the hook mounts must not surface as
// an unhandled rejection. The effect below still observes the rejection.
if (loadingSoundRequest) void loadingSoundRequest.catch(() => undefined);

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const scoped = window as unknown as AudioGlobals;
  return scoped.AudioContext ?? scoped.webkitAudioContext ?? null;
}

/** One short noise buffer, shared by the whoosh and the ticks. Never looped. */
function createNoise(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * 1.3));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playWhoosh(graph: Graph) {
  const { ctx, master, noise } = graph;
  const at = ctx.currentTime + 0.01;
  const length = 1.02;

  const source = ctx.createBufferSource();
  source.buffer = noise;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.05;
  band.frequency.setValueAtTime(260, at);
  band.frequency.exponentialRampToValueAtTime(3600, at + 0.34);
  band.frequency.exponentialRampToValueAtTime(190, at + length - 0.04);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(0.14, at + 0.15);
  gain.gain.linearRampToValueAtTime(0.085, at + 0.46);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);

  source.connect(band);
  band.connect(gain);
  gain.connect(master);
  source.start(at, 0, length + 0.04);
  source.stop(at + length + 0.04);

  // A single low sweep gives the whoosh weight without turning into a rumble.
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(150, at);
  sub.frequency.exponentialRampToValueAtTime(48, at + length * 0.8);
  subGain.gain.setValueAtTime(0.0001, at);
  subGain.gain.linearRampToValueAtTime(0.06, at + 0.12);
  subGain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(at);
  sub.stop(at + length + 0.02);
}

/**
 * The supplied loading file: fetched once for the page, decoded once per
 * AudioContext. Played once at loading start, never looped, never sliced.
 * Any failure is sticky — the loading screen still works silently.
 */
type LoadingSound = {
  /** In-flight download; `null` once settled. */
  fetch: Promise<void> | null;
  /** In-flight decode for the current context; `null` once settled. */
  decode: Promise<void> | null;
  /** Raw bytes, kept so a context opened later can decode them again. */
  bytes: ArrayBuffer | null;
  buffer: AudioBuffer | null;
  /** Peak normalization factor so the file plays at a consistent level. */
  normGain: number;
  failed: boolean;
  /** Currently playing source, if any — for early stopping. */
  currentSource: AudioBufferSourceNode | null;
  /** Its gain, so it can be faded instead of cut. */
  currentGain: GainNode | null;
  /** When the current playback would naturally end. */
  stopTime: number | null;
};

function createLoadingSound(): LoadingSound {
  return {
    fetch: null,
    decode: null,
    bytes: null,
    buffer: null,
    normGain: 1,
    failed: false,
    currentSource: null,
    currentGain: null,
    stopTime: null,
  };
}

/**
 * Normalize the loading file so its peak lands at a comfortable level.
 * We only need the loudest sample, not a full bucket analysis.
 */
function analyseSound(buffer: AudioBuffer): number {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      const value = Math.abs(data[index]);
      if (value > peak) peak = value;
    }
  }
  return peak;
}

/**
 * Play the loading file once, from the beginning, with a gentle fade-in.
 * Does nothing if the file hasn't decoded yet or has failed.
 */
function playLoadingFile(graph: Graph, sound: LoadingSound) {
  const { buffer, normGain } = sound;
  if (!buffer) return;

  const { ctx, master } = graph;
  const at = ctx.currentTime + 0.01;
  const level = Math.min(0.35, LOADING_LEVEL * normGain);

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(level, at + 0.08);

  source.connect(gain);
  gain.connect(master);
  source.start(at, 0);

  // Keep references so we can stop it early if needed.
  sound.currentSource = source;
  sound.currentGain = gain;
  sound.stopTime = at + buffer.duration;
}

export function useAmbience(): AmbienceAPI {
  const graphRef = useRef<Graph | null>(null);
  const statusRef = useRef<AudioStatus>("idle");
  const mutedRef = useRef(false);
  const whooshedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const soundRef = useRef<LoadingSound>(createLoadingSound());
  // Track whether loading audio should play once graph is ready
  const pendingPlayRef = useRef(false);

  const [status, setStatus] = useState<AudioStatus>("idle");
  const [muted, setMutedState] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Browsers refuse to start audio before a real user gesture, so the loading
  // screen's request is parked in pendingPlayRef and flushed from the first
  // gesture (or from wherever the decoded buffer lands after it).
  const flushPendingPlay = useCallback(() => {
    if (!pendingPlayRef.current || mutedRef.current) return;

    const graph = graphRef.current;
    if (!graph || graph.ctx.state === "closed") return;

    const sound = soundRef.current;
    if (sound.failed || !sound.buffer) return;

    if (graph.ctx.state !== "running") {
      void graph.ctx
        .resume()
        .then(() => {
          // Never spin: a refused resume() can resolve while the context stays
          // suspended, and a blocked one may never settle at all.
          if (graphRef.current?.ctx.state === "running") {
            flushPendingPlay();
          } else {
            setAutoplayBlocked(true);
          }
        })
        .catch(() => setAutoplayBlocked(true));
      return;
    }

    pendingPlayRef.current = false;
    playLoadingFile(graph, sound);
  }, []);

  // One decode per AudioContext, so the buffer always matches that context's
  // sample rate. A failure is remembered and the loading screen stays silent.
  const decodeSound = useCallback((graph: Graph, sound: LoadingSound) => {
    if (sound.failed || sound.buffer || sound.decode || !sound.bytes) return;

    // decodeAudioData detaches what it is handed, so give it a copy and keep
    // the original for any context opened later.
    sound.decode = graph.ctx
      .decodeAudioData(sound.bytes.slice(0))
      .then((buffer) => {
        const peak = analyseSound(buffer);
        const normGain = Math.min(8, Math.max(0.25, 1 / Math.max(peak, 0.001)));

        sound.normGain = normGain;
        sound.buffer = buffer;
        // The gesture may have arrived while this decode was in flight.
        try {
          flushPendingPlay();
        } catch {
          // A playback problem must not mark the decoded file itself broken.
        }
      })
      .catch(() => {
        // A context that closes mid-decode rejects the promise. That is not a
        // broken file, so keep the right to decode again on the next context.
        if (graph.ctx.state !== "closed") sound.failed = true;
      })
      .finally(() => {
        sound.decode = null;
        // Retry on whatever context is live now (e.g. React StrictMode in dev
        // unmounts and remounts, closing the context the decode started on).
        const live = graphRef.current;
        if (
          !sound.buffer &&
          !sound.failed &&
          sound.bytes &&
          live &&
          live.ctx.state !== "closed"
        ) {
          decodeSound(live, sound);
        }
      });
  }, [flushPendingPlay]);

  // The file is fetched as soon as the page is up: decoding needs no gesture,
  // only playback does, so even the earliest cue can come from it.
  useEffect(() => {
    const sound = soundRef.current;
    if (sound.bytes || sound.fetch || sound.failed) return;
    if (!loadingSoundRequest) {
      sound.failed = true;
      return;
    }

    sound.fetch = loadingSoundRequest
      .then((bytes) => {
        sound.bytes = bytes;
        // Decode as soon as we have bytes AND a graph exists
        const graph = graphRef.current;
        if (graph) {
          decodeSound(graph, sound);
        }
      })
      .catch(() => {
        sound.failed = true;
      })
      .finally(() => {
        sound.fetch = null;
      });
  }, [decodeSound]);

  // Retry decoding if the graph was created after the fetch completed
  useEffect(() => {
    const sound = soundRef.current;
    // When graph exists and we have bytes but no decoded buffer yet, decode now
    if (graphRef.current && sound.bytes && !sound.buffer && !sound.failed) {
      decodeSound(graphRef.current, sound);
    }
  }, [graphRef.current]);

  const ensureGraph = useCallback((): Graph | null => {
    const current = graphRef.current;
    if (current) {
      if (current.ctx.state !== "closed") {
        if (current.ctx.state === "suspended") {
          void current.ctx.resume().catch(() => undefined);
        }
        return current;
      }
      graphRef.current = null;
    }

    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;

    let ctx: AudioContext;
    try {
      ctx = new Ctor({ latencyHint: "interactive" });
    } catch {
      return null;
    }

    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0 : MASTER_LEVEL;
    master.connect(ctx.destination);

    const graph: Graph = { ctx, master, noise: createNoise(ctx) };
    graphRef.current = graph;

    // A reopened context can run at a different rate; re-decode the file so it
    // can never come back pitched.
    const sound = soundRef.current;
    if (sound.buffer && Math.abs(sound.buffer.sampleRate - ctx.sampleRate) > 1) {
      sound.buffer = null;
      sound.normGain = 1;
      sound.currentSource = null;
      sound.currentGain = null;
      sound.stopTime = null;
    }
    decodeSound(graph, sound);

    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }

    clearCloseTimer();
    if (statusRef.current !== "live") {
      statusRef.current = "live";
      setStatus("live");
    }

    // A gesture just opened the channel: release any cue the loading screen
    // asked for before audio was allowed to start.
    flushPendingPlay();

    return graph;
  }, [clearCloseTimer, decodeSound, flushPendingPlay]);

  // Runs from a real gesture (tap, click or key press): resumes the context
  // and releases the cue the loading screen parked while audio was blocked.
  const unlock = useCallback(() => {
    const graph = ensureGraph();
    if (!graph) {
      setAutoplayBlocked(true);
      return;
    }

    const settle = () => {
      if (graphRef.current?.ctx.state === "running") {
        setAutoplayBlocked(false);
        flushPendingPlay();
      }
    };

    void graph.ctx.resume().then(settle).catch(settle);
    // A gesture unblocks in every browser we support, but re-check once so the
    // prompt can never get stuck on screen.
    window.setTimeout(settle, 250);
  }, [ensureGraph, flushPendingPlay]);

  // Silently unlocks audio on the first gesture so later cues can play.
  const start = useCallback(() => {
    unlock();
  }, [unlock]);

  // Try to start the loading cue the moment the page opens, with no gesture.
  // Chrome allows this only when the visitor has enough media engagement for
  // the origin; otherwise the context stays suspended and we surface the tap
  // prompt. A refused resume() can stay pending forever, so the state is also
  // probed on a timer instead of trusting the promise.
  useEffect(() => {
    let cancelled = false;

    const probe = () => {
      if (cancelled) return;
      if (graphRef.current?.ctx.state === "running") {
        setAutoplayBlocked(false);
        flushPendingPlay();
        return;
      }
      // Report the real reason instead of guessing: Web Audio has no play()
      // rejection to inspect, so this is the context state plus Chrome's own
      // autoplay verdict for the origin.
      const policy = (navigator as unknown as AutoplayPolicyNavigator).getAutoplayPolicy?.(
        "audiocontext",
      );
      console.warn(
        "[audio] autoplay blocked: AudioContext is",
        graphRef.current?.ctx.state,
        "| policy:",
        policy ?? "unknown",
        "| a user gesture or site sound permission is required",
      );
      setAutoplayBlocked(true);
    };

    const graph = ensureGraph();
    if (!graph) {
      setAutoplayBlocked(true);
      return;
    }

    void graph.ctx.resume().then(probe).catch(probe);
    const timer = window.setTimeout(probe, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ensureGraph, flushPendingPlay]);

  const setMuted = useCallback(
    (next: boolean) => {
      mutedRef.current = next;
      setMutedState(next);

      // A click is a user gesture, so it always opens the channel — including
      // when the intent is to silence it.
      const graph = graphRef.current ?? ensureGraph();
      if (!graph) return;

      if (graph.ctx.state !== "closed") {
        const now = graph.ctx.currentTime;
        graph.master.gain.cancelScheduledValues(now);
        graph.master.gain.setValueAtTime(graph.master.gain.value, now);
        graph.master.gain.linearRampToValueAtTime(next ? 0 : MASTER_LEVEL, now + 0.22);
      }

      if (!next) flushPendingPlay();
    },
    [ensureGraph, flushPendingPlay],
  );

  // Play the loading audio once when the loading screen begins.
  // Resumes the context if needed, then starts the file from the beginning.
  // Requires an audio graph (created by a user gesture via start()/setMuted()).
  // Play the loading audio once when the loading screen begins.
  // Resumes the context if needed, then starts the file from the beginning.
  // Returns a Promise so the loading sequence can always finish, even when the
  // browser refuses the resume (autoplay policy) or the cue never decodes.
  const playLoading = useCallback(async (): Promise<void> => {
    const graph = graphRef.current;
    const sound = soundRef.current;

    // No graph yet: remember the request so the first gesture can honour it.
    if (!graph) {
      pendingPlayRef.current = true;
      return;
    }

    if (!sound.buffer || sound.failed) {
      // The decode is still in flight (or failed): flushPendingPlay() picks the
      // request up the moment the buffer lands.
      if (!sound.failed) pendingPlayRef.current = true;
      return;
    }

    // Stop any previous playback first.
    if (sound.currentSource) {
      try {
        sound.currentSource.stop();
      } catch {
        // Already stopped.
      }
      sound.currentSource = null;
      sound.currentGain = null;
      sound.stopTime = null;
    }

    // Already running: play straight away.
    if (graph.ctx.state === "running") {
      playLoadingFile(graph, sound);
      return;
    }

    // Resume inside the user-gesture task, then play only once the context is
    // actually running. A refused resume must never throw into the caller.
    try {
      await graph.ctx.resume();
    } catch {
      return;
    }
    // Read the state through a plain string: TypeScript keeps the narrowing
    // from the early "running" return above.
    const stateAfterResume: string = graph.ctx.state;
    if (graphRef.current === graph && stateAfterResume === "running") {
      playLoadingFile(graph, sound);
    }
  }, []);

  const whoosh = useCallback(() => {
    if (whooshedRef.current) return;
    whooshedRef.current = true;

    const graph = ensureGraph();
    if (!graph) return;

    if (graph.ctx.state === "running") {
      playWhoosh(graph);
      return;
    }
    void graph.ctx
      .resume()
      .then(() => {
        if (graphRef.current === graph && graph.ctx.state === "running") {
          playWhoosh(graph);
        }
      })
      .catch(() => undefined);
  }, [ensureGraph]);

  // The loading cue is part of the loading sequence: fade it out when the bar
  // completes so it never bleeds into the intro, and never restart it.
  const stopLoading = useCallback(() => {
    // Retire the request too: a cue that never played must not fire later, when
    // some unrelated click unlocks the context after the loading screen is gone.
    pendingPlayRef.current = false;

    const sound = soundRef.current;
    const source = sound.currentSource;
    const gain = sound.currentGain;
    const graph = graphRef.current;

    if (!source) return;

    sound.currentSource = null;
    sound.currentGain = null;
    sound.stopTime = null;

    if (gain && graph && graph.ctx.state !== "closed") {
      const now = graph.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      // Fade over 400ms, then stop and forget the source.
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      try {
        source.stop(now + 0.42);
      } catch {
        // Already stopped.
      }
      return;
    }

    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }, []);

  const stop = useCallback(() => {
    clearCloseTimer();
    const graph = graphRef.current;

    if (!graph) {
      statusRef.current = "ended";
      setStatus("ended");
      return;
    }

    const now = graph.ctx.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setValueAtTime(graph.master.gain.value, now);
    graph.master.gain.linearRampToValueAtTime(0.0001, now + 0.3);

    statusRef.current = "ended";
    setStatus("ended");

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      const current = graphRef.current;
      graphRef.current = null;
      if (current && current.ctx.state !== "closed") {
        void current.ctx.close().catch(() => undefined);
      }
    }, RELEASE_DELAY);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph && graph.ctx.state !== "closed") {
        void graph.ctx.close().catch(() => undefined);
      }
    };
  }, []);

  return useMemo<AmbienceAPI>(
    () => ({
      status,
      muted,
      start,
      setMuted,
      playLoading,
      whoosh,
      autoplayBlocked,
      unlock,
      stopLoading,
      stop,
    }),
    [status, muted, start, setMuted, playLoading, whoosh, autoplayBlocked, unlock, stopLoading, stop],
  );
}

type AutoplayPolicyNavigator = Navigator & {
  getAutoplayPolicy?: (
    type: "mediaelement" | "audiocontext",
  ) => "allowed" | "allowed-muted" | "disallowed";
};
