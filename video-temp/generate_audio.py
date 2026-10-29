"""
Generate high quality ambient electronic music for CampusCode Experience Video.
Duration: 32.0s @ 44100Hz 16-bit stereo.
Style: Warm analog synth pad, melodic arpeggios, gentle electronic pulse.
"""
import os
import wave
import struct
import numpy as np

SAMPLE_RATE = 44100
DURATION = 32.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
t = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)

BPM = 90.0
BEAT_LEN = 60.0 / BPM  # 0.6667s
BAR_LEN = BEAT_LEN * 4.0  # 2.6667s

# Left and Right stereo accumulator channels
audio_left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
audio_right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)

# Chord definitions (Hz)
# Progression: Am7 -> Fmaj7 -> Cmaj7 -> Gsus4
CHORDS = [
    # Am7 (A2, E3, A3, C4, E4, G4)
    [110.0, 164.81, 220.0, 261.63, 329.63, 392.00],
    # Fmaj7 (F2, C3, F3, A3, C4, E4)
    [87.31, 130.81, 174.61, 220.0, 261.63, 329.63],
    # Cmaj7 (C2, G2, E3, G3, B3, D4, E4)
    [65.41, 98.00, 164.81, 196.00, 246.94, 293.66, 329.63],
    # Gsus4/G (G2, D3, G3, B3, D4, G4)
    [98.00, 146.83, 196.00, 246.94, 293.66, 392.00],
]

def make_pad_voice(freq, duration_s, pan=0.0):
    """Generate a lush detuned stereo pad voice with gentle harmonics."""
    n_s = int(SAMPLE_RATE * duration_s)
    t_v = np.linspace(0, duration_s, n_s, endpoint=False)
    
    # 3 detuned oscillators for analog chorus thickness
    detune = 0.003
    osc1 = np.sin(2.0 * np.pi * freq * t_v)
    osc2 = np.sin(2.0 * np.pi * freq * (1.0 + detune) * t_v + 0.3)
    osc3 = np.sin(2.0 * np.pi * freq * (1.0 - detune) * t_v + 0.8)
    
    # Gentle 2nd and 3rd harmonics
    harm2 = 0.22 * np.sin(2.0 * np.pi * freq * 2.0 * t_v + 0.5)
    harm3 = 0.08 * np.sin(2.0 * np.pi * freq * 3.0 * t_v + 1.1)
    
    raw = (osc1 + osc2 + osc3 + harm2 + harm3) / 2.3
    
    # Smooth envelope (cosine attack & decay)
    env = np.ones(n_s, dtype=np.float64)
    att_samples = int(SAMPLE_RATE * 0.45)
    rel_samples = int(SAMPLE_RATE * 0.55)
    if att_samples > 0 and att_samples < n_s:
        env[:att_samples] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, att_samples))
    if rel_samples > 0 and rel_samples < n_s:
        env[-rel_samples:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, rel_samples))
        
    # Subtle stereo width
    l_gain = np.cos((pan + 1.0) * np.pi / 4.0)
    r_gain = np.sin((pan + 1.0) * np.pi / 4.0)
    
    v_l = raw * env * l_gain
    v_r = np.roll(raw, 25) * env * r_gain
    return v_l, v_r

# 1. Render Chords for 12 bars (32.0s)
for bar in range(12):
    chord_idx = bar % 4
    if bar >= 11:
        # Final resolution chord: Am9 / Cmaj lingering warmly
        chord_freqs = [110.0, 164.81, 220.0, 261.63, 329.63, 392.00, 493.88]
    else:
        chord_freqs = CHORDS[chord_idx]
        
    start_t = bar * BAR_LEN
    # Pad duration slightly overlaps next bar for smooth crossfade
    pad_dur = BAR_LEN + 0.6
    if start_t + pad_dur > DURATION:
        pad_dur = max(0.1, DURATION - start_t)
        
    start_idx = int(start_t * SAMPLE_RATE)
    dur_samples = int(pad_dur * SAMPLE_RATE)
    
    # Energy curve: gentle start -> build middle -> resolve end
    if bar < 3:
        bar_vol = 0.28 + bar * 0.04
    elif bar < 9:
        bar_vol = 0.42
    else:
        bar_vol = 0.40 - (bar - 9) * 0.08
        
    for i, f in enumerate(chord_freqs):
        # Pan alternating across stereo field
        pan = ((i % 4) - 1.5) / 2.5
        v_l, v_r = make_pad_voice(f, pad_dur, pan=pan)
        actual_len = min(dur_samples, len(v_l), TOTAL_SAMPLES - start_idx)
        if actual_len > 0:
            weight = bar_vol / len(chord_freqs)
            audio_left[start_idx : start_idx + actual_len] += v_l[:actual_len] * weight
            audio_right[start_idx : start_idx + actual_len] += v_r[:actual_len] * weight

# 2. Render Gentle Bass Foundation (Sub Sine with soft warmth)
for bar in range(12):
    chord_idx = bar % 4
    root_f = CHORDS[chord_idx][0]
    start_t = bar * BAR_LEN
    start_idx = int(start_t * SAMPLE_RATE)
    sub_dur = min(BAR_LEN + 0.2, DURATION - start_t)
    sub_samples = int(sub_dur * SAMPLE_RATE)
    if sub_samples <= 0:
        continue
    t_sub = np.linspace(0, sub_dur, sub_samples, endpoint=False)
    sub_wave = np.sin(2.0 * np.pi * root_f * t_sub) + 0.25 * np.sin(2.0 * np.pi * root_f * 2.0 * t_sub)
    sub_env = np.ones(sub_samples)
    att = int(SAMPLE_RATE * 0.2)
    rel = int(SAMPLE_RATE * 0.3)
    if att < sub_samples:
        sub_env[:att] = np.linspace(0, 1, att)
    if rel < sub_samples:
        sub_env[-rel:] = np.linspace(1, 0, rel)
    sub_final = sub_wave * sub_env * 0.18
    actual_len = min(sub_samples, TOTAL_SAMPLES - start_idx)
    audio_left[start_idx : start_idx + actual_len] += sub_final[:actual_len]
    audio_right[start_idx : start_idx + actual_len] += sub_final[:actual_len]

# 3. Gentle Electronic Rhythm (Soft heartbeat kick & subtle micro-pulses)
# Starts at bar 3 (8s) through bar 10 (26.6s)
for beat in range(48):
    beat_t = beat * BEAT_LEN
    # Only active between 7.5s and 27s
    if beat_t < 7.5 or beat_t > 27.0:
        continue
    
    # Soft kick pulse on beats 0 and 2 of each bar
    if beat % 2 == 0:
        kick_dur = 0.28
        n_k = int(SAMPLE_RATE * kick_dur)
        if int(beat_t * SAMPLE_RATE) + n_k < TOTAL_SAMPLES:
            t_k = np.linspace(0, kick_dur, n_k, endpoint=False)
            # Gentle pitch drop from 68Hz to 42Hz
            f_k = 42.0 + 26.0 * np.exp(-t_k * 18.0)
            phase = 2.0 * np.pi * np.cumsum(f_k) / SAMPLE_RATE
            k_env = np.exp(-t_k * 11.0)
            kick_wave = np.sin(phase) * k_env * 0.26
            k_idx = int(beat_t * SAMPLE_RATE)
            audio_left[k_idx : k_idx + n_k] += kick_wave
            audio_right[k_idx : k_idx + n_k] += kick_wave

    # Subtle high-tech tick/hat on eighth notes
    tick_dur = 0.05
    n_tk = int(SAMPLE_RATE * tick_dur)
    tk_idx = int((beat_t + BEAT_LEN * 0.5) * SAMPLE_RATE)
    if tk_idx + n_tk < TOTAL_SAMPLES:
        t_tk = np.linspace(0, tick_dur, n_tk, endpoint=False)
        # Soft filtered noise / high sine chirp
        tick_wave = (np.sin(2.0 * np.pi * 3200.0 * t_tk) * 0.5 + 
                     (np.random.rand(n_tk) - 0.5) * 0.5) * np.exp(-t_tk * 90.0) * 0.035
        # Pan tick slightly right
        audio_left[tk_idx : tk_idx + n_tk] += tick_wave * 0.4
        audio_right[tk_idx : tk_idx + n_tk] += tick_wave * 0.8

# 4. Melodic Bell Pluck Arpeggio (ambient tech feel)
# Runs from bar 2 (5.3s) through bar 10 (26.6s)
arp_patterns = [
    [440.0, 523.25, 659.25, 783.99, 880.0],   # Am
    [349.23, 440.0, 523.25, 659.25, 698.46],  # Fmaj
    [523.25, 659.25, 783.99, 987.77, 1046.5], # C
    [392.0, 493.88, 587.33, 783.99, 880.0],   # G
]

for step in range(48 * 2): # 16th-note steps
    step_t = step * (BEAT_LEN / 2.0)
    if step_t < 6.0 or step_t > 27.0:
        continue
        
    bar_num = int(step_t / BAR_LEN)
    chord_idx = bar_num % 4
    notes = arp_patterns[chord_idx]
    
    # Elegant arpeggiated note selection
    pat = [0, 2, 1, 3, 2, 4, 3, 1]
    note_freq = notes[pat[step % len(pat)]]
    
    pluck_dur = 0.45
    n_p = int(SAMPLE_RATE * pluck_dur)
    p_idx = int(step_t * SAMPLE_RATE)
    if p_idx + n_p < TOTAL_SAMPLES:
        t_p = np.linspace(0, pluck_dur, n_p, endpoint=False)
        # Warm sine with soft bell overtone
        pluck = (np.sin(2.0 * np.pi * note_freq * t_p) + 
                 0.35 * np.sin(2.0 * np.pi * note_freq * 2.0 * t_p) +
                 0.12 * np.sin(2.0 * np.pi * note_freq * 3.01 * t_p))
        p_env = np.exp(-t_p * 7.5)
        p_vol = 0.075 * (0.8 + 0.2 * np.sin(step * 0.4)) # subtle dynamic breathing
        
        # Stereo ping-pong panning
        pan = np.sin(step * 0.75)
        l_gain = 0.5 * (1.0 - pan)
        r_gain = 0.5 * (1.0 + pan)
        
        audio_left[p_idx : p_idx + n_p] += pluck * p_env * p_vol * l_gain
        audio_right[p_idx : p_idx + n_p] += pluck * p_env * p_vol * r_gain

# 5. Low-pass smoothing filter (smooth out harsh digital highs)
def apply_warmth_filter(signal, alpha=0.42):
    out = np.zeros_like(signal)
    val = 0.0
    for i in range(len(signal)):
        val = val * alpha + signal[i] * (1.0 - alpha)
        out[i] = val
    return out

audio_left = apply_warmth_filter(audio_left)
audio_right = apply_warmth_filter(audio_right)

# 6. Global Fades
# 2-second fade-in
fade_in_len = int(SAMPLE_RATE * 2.0)
fade_in = np.ones(TOTAL_SAMPLES)
fade_in[:fade_in_len] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade_in_len))

# 3.5-second smooth fade-out at the end
fade_out_len = int(SAMPLE_RATE * 3.5)
fade_out = np.ones(TOTAL_SAMPLES)
fade_out[-fade_out_len:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fade_out_len))

audio_left = audio_left * fade_in * fade_out
audio_right = audio_right * fade_in * fade_out

# 7. Soft limiter / mastering
peak = max(np.max(np.abs(audio_left)), np.max(np.abs(audio_right)))
if peak > 0:
    target_peak = 0.82
    audio_left = np.tanh(audio_left / peak * 1.15) * target_peak
    audio_right = np.tanh(audio_right / peak * 1.15) * target_peak

# Convert to 16-bit PCM
left_pcm = np.int16(audio_left * 32767)
right_pcm = np.int16(audio_right * 32767)

# Interleave stereo
stereo_pcm = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
stereo_pcm[0::2] = left_pcm
stereo_pcm[1::2] = right_pcm

output_path = "/Users/vaigunthansl/Desktop/Rebuild /video-temp/audio.wav"
with wave.open(output_path, 'wb') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(stereo_pcm.tobytes())

print(f"Successfully generated audio: {output_path} ({os.path.getsize(output_path)} bytes, {DURATION}s)")
