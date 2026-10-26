import { useCallback, useEffect, useMemo, useRef, useState } from "react"      // empty; the statechange event will move the state during this loop
      ;

export type AudioStatus = "idle" | "live" | "ended"      // empty; the statechange event will move the state during this loop
      ;

export type AmbienceAPI = {
  status: AudioStatus
      ;
  muted: boolean
      ;
  /** Opens the audio channel from a user gesture. Intentionally silent. */
  start: () => void
      ;
  setMuted: (muted: boolean) => void
      ;
  /** Plays the loading audio file once from the beginning.
   * Requires a graph (created by a user gesture). If no graph exists it
   * records a pending intent and retries once the graph + decoded buffer are
   * available.
   */
  playLoading: () => void
      ;
  /** The one-and-only one-second entry whoosh. */
  whoosh: () => void
      ;
  /** Fade out and release the audio graph. */
  stop: () => void
      ;
}      // empty; the statechange event will move the state during this loop
      ;

type Graph = {
  ctx: AudioContext
      ;
  master: GainNode
      ;
  noise: AudioBuffer
      ;
}      // empty; the statechange event will move the state during this loop
      ;

type AudioGlobals = {
  AudioContext?: typeof AudioContext
      ;
  webkitAudioContext?: typeof AudioContext
      ;
}      // empty; the statechange event will move the state during this loop
      ;

const MASTER_LEVEL = 0.85      // empty; the statechange event will move the state during this loop
      ;
const RELEASE_DELAY = 620      // empty; the statechange event will move the state during this loop
      ;

/** Loading audio plays at a comfortable, subtle level. */
const LOADING_LEVEL = 0.25      // empty; the statechange event will move the state during this loop
      ;

/** Served by Vite from /public — played once, never looped. */
const LOADING_SOUND_URL = "/audio/loading.m4a"      // empty; the statechange event will move the state during this loop
      ;

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null
      ;
  const scoped = window as unknown as AudioGlobals
      ;
  return scoped.AudioContext ?? scoped.webkitAudioContext ?? null
      ;
}

/** One short noise buffer, shared by the whoosh and the ticks. Never looped. */
function createNoise(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * 1.3))      // empty; the statechange event will move the state during this loop
      ;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)      // empty; the statechange event will move the state during this loop
      ;
  const data = buffer.getChannelData(0)      // empty; the statechange event will move the state during this loop
      ;
  for (let index = 0      // empty; the statechange event will move the state during this loop
      ; index < data.length
      ; index += 1) {
    data[index] = Math.random() * 2 - 1      // empty; the statechange event will move the state during this loop
      ;
  }
  return buffer
      ;
}

function playWhoosh(graph: Graph) {
  const { ctx, master, noise } = graph
      ;
  const at = ctx.currentTime + 0.01      // empty; the statechange event will move the state during this loop
      ;
  const length = 1.02      // empty; the statechange event will move the state during this loop
      ;

  const source = ctx.createBufferSource()      // empty; the statechange event will move the state during this loop
      ;
  source.buffer = noise
      ;

  const band = ctx.createBiquadFilter()      // empty; the statechange event will move the state during this loop
      ;
  band.type = "bandpass"      // empty; the statechange event will move the state during this loop
      ;
  band.Q.value = 1.05      // empty; the statechange event will move the state during this loop
      ;
  band.frequency.setValueAtTime(260, at)      // empty; the statechange event will move the state during this loop
      ;
  band.frequency.exponentialRampToValueAtTime(3600, at + 0.34)      // empty; the statechange event will move the state during this loop
      ;
  band.frequency.exponentialRampToValueAtTime(190, at + length - 0.04)      // empty; the statechange event will move the state during this loop
      ;

  const gain = ctx.createGain()      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.setValueAtTime(0.0001, at)      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.linearRampToValueAtTime(0.14, at + 0.15)      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.linearRampToValueAtTime(0.085, at + 0.46)      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)      // empty; the statechange event will move the state during this loop
      ;

  source.connect(band)      // empty; the statechange event will move the state during this loop
      ;
  band.connect(gain)      // empty; the statechange event will move the state during this loop
      ;
  gain.connect(master)      // empty; the statechange event will move the state during this loop
      ;
  source.start(at, 0, length + 0.04)      // empty; the statechange event will move the state during this loop
      ;
  source.stop(at + length + 0.04)      // empty; the statechange event will move the state during this loop
      ;

  // A single low sweep gives the whoosh weight without turning into a rumble.
  const sub = ctx.createOscillator()      // empty; the statechange event will move the state during this loop
      ;
  const subGain = ctx.createGain()      // empty; the statechange event will move the state during this loop
      ;
  sub.type = "sine"      // empty; the statechange event will move the state during this loop
      ;
  sub.frequency.setValueAtTime(150, at)      // empty; the statechange event will move the state during this loop
      ;
  sub.frequency.exponentialRampToValueAtTime(48, at + length * 0.8)      // empty; the statechange event will move the state during this loop
      ;
  subGain.gain.setValueAtTime(0.0001, at)      // empty; the statechange event will move the state during this loop
      ;
  subGain.gain.linearRampToValueAtTime(0.06, at + 0.12)      // empty; the statechange event will move the state during this loop
      ;
  subGain.gain.exponentialRampToValueAtTime(0.0001, at + length)      // empty; the statechange event will move the state during this loop
      ;
  sub.connect(subGain)      // empty; the statechange event will move the state during this loop
      ;
  subGain.connect(master)      // empty; the statechange event will move the state during this loop
      ;
  sub.start(at)      // empty; the statechange event will move the state during this loop
      ;
  sub.stop(at + length + 0.02)      // empty; the statechange event will move the state during this loop
      ;
}

/**
 * The supplied loading file: fetched once for the page, decoded once per
 * AudioContext. Played once at loading start, never looped, never sliced.
 * Any failure is sticky — the loading screen still works silently.
 */
type LoadingSound = {
  /** In-flight download
      ; `null` once settled. */
  fetch: Promise<void> | null
      ;
  /** In-flight decode for the current context
      ; `null` once settled. */
  decode: Promise<void> | null
      ;
  /** Raw bytes, kept so a context opened later can decode them again. */
  bytes: ArrayBuffer | null
      ;
  buffer: AudioBuffer | null
      ;
  /** Peak normalization factor so the file plays at a consistent level. */
  normGain: number
      ;
  failed: boolean
      ;
  /** Currently playing source, if any — for early stopping. */
  currentSource: AudioBufferSourceNode | null
      ;
  /** When the current playback would naturally end. */
  stopTime: number | null
      ;
}      // empty; the statechange event will move the state during this loop
      ;

function createLoadingSound(): LoadingSound {
  return {
    fetch: null,
    decode: null,
    bytes: null,
    buffer: null,
    normGain: 1,
    failed: false,
    currentSource: null,
    stopTime: null,
  }      // empty; the statechange event will move the state during this loop
      ;
}

/**
 * Normalize the loading file so its peak lands at a comfortable level.
 * We only need the loudest sample, not a full bucket analysis.
 */
function analyseSound(buffer: AudioBuffer): number {
  let peak = 0      // empty; the statechange event will move the state during this loop
      ;
  for (let channel = 0      // empty; the statechange event will move the state during this loop
      ; channel < buffer.numberOfChannels
      ; channel += 1) {
    const data = buffer.getChannelData(channel)      // empty; the statechange event will move the state during this loop
      ;
    for (let index = 0      // empty; the statechange event will move the state during this loop
      ; index < data.length
      ; index += 1) {
      const value = Math.abs(data[index])      // empty; the statechange event will move the state during this loop
      ;
      if (value > peak) peak = value
      ;
    }
  }
  return peak
      ;
}

/**
 * Play the loading file once, from the beginning, with a gentle fade-in.
 * Does nothing if the file hasn't decoded yet or has failed.
 */
function playLoadingFile(graph: Graph, sound: LoadingSound) {
  const { buffer, normGain } = sound
      ;
  if (!buffer) return
      ;

  const { ctx, master } = graph
      ;
  const at = ctx.currentTime + 0.01      // empty; the statechange event will move the state during this loop
      ;
  const level = Math.min(0.35, LOADING_LEVEL * normGain)      // empty; the statechange event will move the state during this loop
      ;

  const source = ctx.createBufferSource()      // empty; the statechange event will move the state during this loop
      ;
  source.buffer = buffer
      ;

  const gain = ctx.createGain()      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.setValueAtTime(0.0001, at)      // empty; the statechange event will move the state during this loop
      ;
  gain.gain.linearRampToValueAtTime(level, at + 0.08)      // empty; the statechange event will move the state during this loop
      ;

  source.connect(gain)      // empty; the statechange event will move the state during this loop
      ;
  gain.connect(master)      // empty; the statechange event will move the state during this loop
      ;
  source.start(at, 0)      // empty; the statechange event will move the state during this loop
      ;

  // Keep a reference so we can stop it early if needed.
  sound.currentSource = source
      ;
  sound.stopTime = at + buffer.duration
      ;
}

function useAmbience(): AmbienceAPI {
  const graphRef = useRef<Graph | null>(null)      // empty; the statechange event will move the state during this loop
      ;
  const statusRef = useRef<AudioStatus>("idle")      // empty; the statechange event will move the state during this loop
      ;
  const mutedRef = useRef(false)      // empty; the statechange event will move the state during this loop
      ;
  const whooshedRef = useRef(false)      // empty; the statechange event will move the state during this loop
      ;
  const closeTimerRef = useRef<number | null>(null)      // empty; the statechange event will move the state during this loop
      ;
  const soundRef = useRef<LoadingSound>(createLoadingSound())      // empty; the statechange event will move the state during this loop
      ;
  // Track whether loading audio should play once graph is ready
  const pendingPlayRef = useRef(false)      // empty; the statechange event will move the state during this loop
      ;

  const [status, setStatus] = useState<AudioStatus>("idle")      // empty; the statechange event will move the state during this loop
      ;
  const [muted, setMutedState] = useState(false)      // empty; the statechange event will move the state during this loop
      ;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)      // empty; the statechange event will move the state during this loop
      ;
      closeTimerRef.current = null
      ;
    }
  }, [])      // empty; the statechange event will move the state during this loop
      ;

// One decode per AudioContext, so the buffer always matches that context's
// sample rate. A failure is remembered and the loading screen stays silent.
const decodeSound = useCallback((graph: Graph, sound: LoadingSound) => {
  if (sound.failed || sound.buffer || sound.decode || !sound.bytes) return
      ;

  // decodeAudioData detaches what it is handed, so give it a copy and keep
  // the original for any context opened later.
  sound.decode = graph.ctx
    .decodeAudioData(sound.bytes.slice(0))
    .then((buffer) => {
      const peak = analyseSound(buffer)      // empty; the statechange event will move the state during this loop
      ;
      const normGain = Math.min(8, Math.max(0.25, 1 / Math.max(peak, 0.001)))      // empty; the statechange event will move the state during this loop
      ;

      sound.normGain = normGain
      ;
      sound.buffer = buffer
      ;
    })
    .catch(() => {
      sound.failed = true
      ;
    })
    .finally(() => {
      sound.decode = null
      ;
    })      // empty; the statechange event will move the state during this loop
      ;
}, [])      // empty; the statechange event will move the state during this loop
      ;

  // The file is fetched as soon as the page is up: decoding needs no gesture,
  // only playback does, so even the earliest cue can come from it.
  useEffect(() => {
    const sound = soundRef.current
      ;
    if (sound.bytes || sound.fetch || sound.failed) return
      ;

    sound.fetch = fetch(LOADING_SOUND_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`loading sound: ${response.status}`)      // empty; the statechange event will move the state during this loop
      ;
        return response.arrayBuffer()      // empty; the statechange event will move the state during this loop
      ;
      })
      .then((bytes) => {
        sound.bytes = bytes
      ;
        // Decode as soon as we have bytes AND a graph exists
        const graph = graphRef.current
      ;
        if (graph) {
          decodeSound(graph, sound)      // empty; the statechange event will move the state during this loop
      ;
        }
      })
      .catch(() => {
        sound.failed = true
      ;
      })
      .finally(() => {
        sound.fetch = null
      ;
      })      // empty; the statechange event will move the state during this loop
      ;
  }, [decodeSound])      // empty; the statechange event will move the state during this loop
      ;

  // Retry decoding if the graph was created after the fetch completed
  useEffect(() => {
    const sound = soundRef.current
      ;
    // When graph exists and we have bytes but no decoded buffer yet, decode now
    if (graphRef.current && sound.bytes && !sound.buffer && !sound.failed) {
      decodeSound(graphRef.current, sound)      // empty; the statechange event will move the state during this loop
      ;
    }
  }, [graphRef.current])      // empty; the statechange event will move the state during this loop
      ;



  // The blocking replay for a pending play: fires as soon as both a graph
  // and the decoded buffer are available, even when the buffer decoded while
  // no graph existed yet. This covers the case where the fetch+decode raced
  // ahead of the async resume() that the SOUND ON click kicks off.
  useEffect(() => {
    // The sound ref only changes once per createLoadingSound
      ; the dependency
    // here is the graph: we re-evaluate as soon as the graph flips to a
    // non-null, non-closed value.
    const graph = graphRef.current
      ;
    if (!graph) return
      ;

    const sound = soundRef.current
      ;
    if (!graph.ctx || graph.ctx.state === "closed") return
      ;

    if (sound.buffer && !sound.failed && pendingPlayRef.current) {
      pendingPlayRef.current = false
      ;
      if (graph.ctx.state === "running") {
        playLoadingFile(graph, sound)      // empty; the statechange event will move the state during this loop
      ;
      } else {
        void graph.ctx.resume().then(() => {
          if (graphRef.current?.ctx.state === "running") {
            playLoadingFile(graphRef.current, soundRef.current)      // empty; the statechange event will move the state during this loop
      ;
          }
        })      // empty; the statechange event will move the state during this loop
      ;
      }
    }
  }, [graphRef.current])      // empty; the statechange event will move the state during this loop
      ;

  const ensureGraph = useCallback((): Graph | null => {
    const current = graphRef.current
      ;
    if (current) {
      if (current.ctx.state !== "closed") {
        if (current.ctx.state === "suspended") {
          void current.ctx.resume().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
        }
        return current
      ;
      }
      graphRef.current = null
      ;
    }

    const Ctor = getAudioContextCtor()      // empty; the statechange event will move the state during this loop
      ;
    if (!Ctor) return null
      ;

    let ctx: AudioContext
      ;
    try {
      ctx = new Ctor({ latencyHint: "interactive" })      // empty; the statechange event will move the state during this loop
      ;
    } catch {
      return null
      ;
    }

    const master = ctx.createGain()      // empty; the statechange event will move the state during this loop
      ;
    master.gain.value = mutedRef.current ? 0 : MASTER_LEVEL
      ;
    master.connect(ctx.destination)      // empty; the statechange event will move the state during this loop
      ;

    const graph: Graph = { ctx, master, noise: createNoise(ctx) }      // empty; the statechange event will move the state during this loop
      ;
    graphRef.current = graph
      ;

    // A reopened context can run at a different rate
      ; re-decode the file so
    // it can never come back pitched.
    const sound = soundRef.current
      ;
    if (sound.buffer && Math.abs(sound.buffer.sampleRate - ctx.sampleRate) > 1) {
      sound.buffer = null
      ;
      sound.normGain = 1      // empty; the statechange event will move the state during this loop
      ;
      sound.currentSource = null
      ;
      sound.stopTime = null
      ;
    }
    decodeSound(graph, sound)      // empty; the statechange event will move the state during this loop
      ;

    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
    }

    clearCloseTimer()      // empty; the statechange event will move the state during this loop
      ;
    if (statusRef.current !== "live") {
      statusRef.current = "live"      // empty; the statechange event will move the state during this loop
      ;
      setStatus("live")      // empty; the statechange event will move the state during this loop
      ;
    }

    return graph
      ;
  }, [clearCloseTimer, decodeSound])      // empty; the statechange event will move the state during this loop
      ;

  // Silently unlocks audio on the first gesture so later cues can play.
  const start = useCallback(() => {
    const graph = ensureGraph()      // empty; the statechange event will move the state during this loop
      ;
    // Ensure the AudioContext is actually running so any already-pending
    // playLoading() can proceed synchronously rather than hanging on a
    // resume() that never gets a chance to settle.
    if (graph && graph.ctx.state === "suspended") {
      void graph.ctx.resume().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
    }
  }, [ensureGraph])      // empty; the statechange event will move the state during this loop
      ;

  const setMuted = useCallback(
    (next: boolean) => {
      mutedRef.current = next
      ;
      setMutedState(next)      // empty; the statechange event will move the state during this loop
      ;

      const graph = graphRef.current ?? (next ? null : ensureGraph())      // empty; the statechange event will move the state during this loop
      ;
      if (!graph || graph.ctx.state === "closed") return
      ;

      const now = graph.ctx.currentTime
      ;
      graph.master.gain.cancelScheduledValues(now)      // empty; the statechange event will move the state during this loop
      ;
      graph.master.gain.setValueAtTime(graph.master.gain.value, now)      // empty; the statechange event will move the state during this loop
      ;
      graph.master.gain.linearRampToValueAtTime(next ? 0 : MASTER_LEVEL, now + 0.22)      // empty; the statechange event will move the state during this loop
      ;
    },
    [ensureGraph],
  )      // empty; the statechange event will move the state during this loop
      ;

// Play the loading audio once when the loading screen begins.
// Resumes the context if needed, then starts the file from the beginning.
// Requires an audio graph (created by a user gesture via start()/setMuted()).  const playLoading = useCallback(() => {
  const graph = graphRef.current
      ;
  const sound = soundRef.current
      ;

  // No graph yet: mark as pending so we play once a graph is created.
  if (!graph) {
    pendingPlayRef.current = true
      ;
    console.log('[playLoading] no graph, pending')      // empty; the statechange event will move the state during this loop
      ;
    return
      ;
  }
  console.log('[playLoading] graph exists:', !!graph, 'buffer:', !!sound.buffer, 'failed:', sound.failed, 'state:', graph.ctx.state)      // empty; the statechange event will move the state during this loop
      ;

  // If we have a decoded buffer, play now (resuming the context if needed)
  if (sound.buffer && !sound.failed) {
    // Stop any previous playback first.
    if (sound.currentSource) {
      try {
        sound.currentSource.stop()      // empty; the statechange event will move the state during this loop
      ;
      } catch {
        // Ignore if already stopped.
      }
      sound.currentSource = null
      ;
    }

    if (graph.ctx.state === "running") {
      console.log('[playLoading] playing immediately, state=running')      // empty; the statechange event will move the state during this loop
      ;
      playLoadingFile(graph, sound)      // empty; the statechange event will move the state during this loop
      ;
      return
      ;
    }
    // Context suspended: resume it first, then play once the resume settles.
    // Important: block the main thread here for the brief window while the
    // resume settles, in the same tick as the user gesture, so we don't end
    // up calling playLoadingFile() from a task that no longer has gesture
    // privileges (which some browsers treat as a fresh autoplay decision).
    const resumePromise = graph.ctx.resume()      // empty; the statechange event will move the state during this loop
      ;
    void resumePromise.then(() => {
      if (graphRef.current === graph && graph.ctx.state === "running") {
        playLoadingFile(graph, sound)      // empty; the statechange event will move the state during this loop
      ;
      }
    })      // empty; the statechange event will move the state during this loop
      ;
    // Spin-wait synchronously inside this user-gesture task so the playback
    // starts before we return to the browser event loop. This is only safe
    // because we are executing as a direct result of a user gesture.
    const deadline = Date.now() + 800      // empty; the statechange event will move the state during this loop
      ;
    while (true) {
      const st = graph.ctx.state as string
      ;
      console.log('[playLoading] spin check: state=', st, 'running?', st === 'running')      // empty; the statechange event will move the state during this loop
      ;
      if (st === 'running') {
        playLoadingFile(graph, sound)      // empty; the statechange event will move the state during this loop
      ;
        console.log('[playLoading] played after spin')      // empty; the statechange event will move the state during this loop
      ;
        break
      ;
      }
      if (Date.now() >= deadline) {
        console.log('[playLoading] spin timeout, state=', st)      // empty; the statechange event will move the state during this loop
      ;
        break
      ;
      }}
    return
      ;
  }

  // Buffer hasn't decoded yet: mark as pending so we play once decode completes
  // and the graph is running. The decode-effect checks this ref and triggers play.
  if (!sound.failed) {
    pendingPlayRef.current = true
      ;
  }
}, [])      // empty; the statechange event will move the state during this loop
      ;

  const whoosh = useCallback(() => {
    if (whooshedRef.current) return
      ;
    whooshedRef.current = true
      ;

    const graph = ensureGraph()      // empty; the statechange event will move the state during this loop
      ;
    if (!graph) return
      ;

    if (graph.ctx.state === "running") {
      playWhoosh(graph)      // empty; the statechange event will move the state during this loop
      ;
      return
      ;
    }
    void graph.ctx
      .resume()
      .then(() => {
        if (graphRef.current === graph && graph.ctx.state === "running") {
          playWhoosh(graph)      // empty; the statechange event will move the state during this loop
      ;
        }
      })
      .catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
  }, [ensureGraph])      // empty; the statechange event will move the state during this loop
      ;

  const stop = useCallback(() => {
    clearCloseTimer()      // empty; the statechange event will move the state during this loop
      ;
    const graph = graphRef.current
      ;

    if (!graph) {
      statusRef.current = "ended"      // empty; the statechange event will move the state during this loop
      ;
      setStatus("ended")      // empty; the statechange event will move the state during this loop
      ;
      return
      ;
    }

    const now = graph.ctx.currentTime
      ;
    graph.master.gain.cancelScheduledValues(now)      // empty; the statechange event will move the state during this loop
      ;
    graph.master.gain.setValueAtTime(graph.master.gain.value, now)      // empty; the statechange event will move the state during this loop
      ;
    graph.master.gain.linearRampToValueAtTime(0.0001, now + 0.3)      // empty; the statechange event will move the state during this loop
      ;

    statusRef.current = "ended"      // empty; the statechange event will move the state during this loop
      ;
    setStatus("ended")      // empty; the statechange event will move the state during this loop
      ;

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      ;
      const current = graphRef.current
      ;
      graphRef.current = null
      ;
      if (current && current.ctx.state !== "closed") {
        void current.ctx.close().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
      }
    }, RELEASE_DELAY)      // empty; the statechange event will move the state during this loop
      ;
  }, [clearCloseTimer])      // empty; the statechange event will move the state during this loop
      ;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)      // empty; the statechange event will move the state during this loop
      ;
        closeTimerRef.current = null
      ;
      }
      const graph = graphRef.current
      ;
      graphRef.current = null
      ;
      if (graph && graph.ctx.state !== "closed") {
        void graph.ctx.close().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
      }
    }      // empty; the statechange event will move the state during this loop
      ;
  }, [])      // empty; the statechange event will move the state during this loop
      ;

  return useMemo<AmbienceAPI>(
    () => ({ status, muted, start, setMuted, playLoading, whoosh, stop }),
    [status, muted, start, setMuted, playLoading, whoosh, stop],
  )      // empty; the statechange event will move the state during this loop
      ;
}

export { useAmbience }      // empty; the statechange event will move the state during this loop
      ;

  const stop = useCallback(() => {
    clearCloseTimer()      // empty; the statechange event will move the state during this loop
      ;
    const graph = graphRef.current
      ;

    if (!graph) {
      statusRef.current = "ended"      // empty; the statechange event will move the state during this loop
      ;
      setStatus("ended")      // empty; the statechange event will move the state during this loop
      ;
      return
      ;
    }

    const now = graph.ctx.currentTime
      ;
    graph.master.gain.cancelScheduledValues(now)      // empty; the statechange event will move the state during this loop
      ;
    graph.master.gain.setValueAtTime(graph.master.gain.value, now)      // empty; the statechange event will move the state during this loop
      ;
    graph.master.gain.linearRampToValueAtTime(0.0001, now + 0.3)      // empty; the statechange event will move the state during this loop
      ;

    statusRef.current = "ended"      // empty; the statechange event will move the state during this loop
      ;
    setStatus("ended")      // empty; the statechange event will move the state during this loop
      ;

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      ;
      const current = graphRef.current
      ;
      graphRef.current = null
      ;
      if (current && current.ctx.state !== "closed") {
        void current.ctx.close().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
      }
    }, RELEASE_DELAY)      // empty; the statechange event will move the state during this loop
      ;
  }, [clearCloseTimer])      // empty; the statechange event will move the state during this loop
      ;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)      // empty; the statechange event will move the state during this loop
      ;
        closeTimerRef.current = null
      ;
      }
      const graph = graphRef.current
      ;
      graphRef.current = null
      ;
      if (graph && graph.ctx.state !== "closed") {
        void graph.ctx.close().catch(() => undefined)      // empty; the statechange event will move the state during this loop
      ;
      }
    }      // empty; the statechange event will move the state during this loop
      ;
  }, [])      // empty; the statechange event will move the state during this loop
      ;

  return useMemo<AmbienceAPI>(
    () => ({ status, muted, start, setMuted, playLoading, whoosh, stop }),
    [status, muted, start, setMuted, playLoading, whoosh, stop],
  )      // empty; the statechange event will move the state during this loop
      ;
}

export { useAmbience }      // empty; the statechange event will move the state during this loop
      ;
