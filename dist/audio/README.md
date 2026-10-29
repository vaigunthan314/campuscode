# CampusCode — audio assets

Everything in this folder is served from the site root by Vite, so a file placed
here is referenced as `/audio/<filename>`.

There are currently **no audio files in this folder**. The loading sequence and
the entry whoosh are both generated in the browser with the Web Audio API
(`src/components/Ambience.tsx`), which is why the site has always shipped without
audio assets. Drop the files described below into this folder only if you want
them to replace the synthesised versions — the code does not reference them yet.

| File | Status | Purpose |
| --- | --- | --- |
| `loading-binary.mp3` | **Missing — to be supplied** | Subtle, intermittent binary-processing ticks for the loading screen. |
| `entry-whoosh.mp3` | **Missing — to be supplied** | Optional file copy of the existing cinematic whoosh played on entry. |

---

## `loading-binary.mp3`

The short interface sound used while `LOADING` is on screen.

It is **not** background music and **not** a loop. It is a one-shot cue fired at
seven irregular moments across the progress bar, alternating between single
ticks and short pulse bursts, and it must stay quiet enough to sit under the
word rather than compete with it.

What works well:

- A single short tick, roughly **40–120 ms**, with a clean attack and no tail.
- Or a short phrase of two or three pulses, at most **~400 ms** total.
- Mono, 44.1 or 48 kHz, peak normalised around −18 dBFS so it stays subtle.
- No silence padding at the start — a leading gap delays the cue against the
  visual beat.

What to avoid: anything looped, droning, hissing, buzzing or fan-like, and any
evenly spaced notification beep. If the clip is used for every cue, it will be
pitch-shifted slightly per play so repeated hits do not sound mechanical, so a
neutral, mid-bright tone works better than a strongly melodic one.

Playback rules already implemented in the app: the cue set is scheduled from the
loading progress, stops the moment the loading screen retires, and is muted by
the `SOUND ON / SOUND OFF` control in the bottom-left corner.

## `entry-whoosh.mp3`

The sound that plays once, when the visitor first scrolls out of the loading
screen into the site.

The current whoosh is synthesised: a 1.02 s band-passed noise sweep from 260 Hz
up to 3.6 kHz and back down to 190 Hz, plus a low sine sweep from 150 Hz to 48 Hz
for weight. Its character, duration, level and timing are fixed and should be
preserved.

If you supply this file, it must match that sound — the same ~1 s sweep, the
same weight, no reverb tail longer than the sweep itself. It is played exactly
once per page visit, from the first scroll past 24 px, and is never replayed on
later scrolling.

---

## Wiring these up

Adding a file here does nothing on its own. When both files exist, the change is
confined to `src/components/Ambience.tsx`:

1. Fetch and `decodeAudioData` each file once, on the first user gesture.
2. Replace `playTick` / `playPulses` with buffer sources from
   `loading-binary.mp3`, keeping the same gains and the same mute gain node.
3. Replace `playWhoosh` with a buffer source from `entry-whoosh.mp3`, keeping the
   existing level and once-only guard.

Nothing outside that module needs to change: the loading screen, the progress
bar, the mute control and the scroll-entry logic already call into these
functions.
