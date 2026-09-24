"""
Biblioteca de síntese procedural (numpy/scipy) — O Último Rastro.
Usada por music.py, sfx.py e ambience.py. Determinística por seed.
"""
import subprocess
from pathlib import Path
import numpy as np
from scipy import signal

SR = 44100

# ------------------------------------------------------------------ utils
def rng_for(seed):
    return np.random.default_rng(seed)

def t_axis(dur):
    return np.arange(int(dur * SR)) / SR

def midi_to_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def db(x):
    return 10 ** (x / 20)

def adsr(n, a=0.01, d=0.1, s=0.7, r=0.3, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, max(1, a_n)),
        np.linspace(1, s, max(1, d_n)),
        np.full(s_n, s),
        np.linspace(s, 0, max(1, r_n)),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]

def lowpass(x, cutoff, order=2):
    cutoff = float(np.clip(cutoff, 20, SR / 2 - 100))
    b, a = signal.butter(order, cutoff / (SR / 2), btype="low")
    return signal.lfilter(b, a, x, axis=0)

def highpass(x, cutoff, order=2):
    cutoff = float(np.clip(cutoff, 10, SR / 2 - 100))
    b, a = signal.butter(order, cutoff / (SR / 2), btype="high")
    return signal.lfilter(b, a, x, axis=0)

def bandpass(x, lo, hi, order=2):
    lo = float(np.clip(lo, 10, SR / 2 - 200)); hi = float(np.clip(hi, lo + 10, SR / 2 - 100))
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.lfilter(b, a, x, axis=0)

def sweep_lowpass(x, c_from, c_to, order=2, blocks=64):
    """lowpass com cutoff variando linearmente no tempo (por blocos)."""
    n = len(x); out = np.zeros_like(x); edges = np.linspace(0, n, blocks + 1).astype(int)
    zi = None
    for i in range(blocks):
        c = c_from + (c_to - c_from) * i / max(1, blocks - 1)
        b, a = signal.butter(order, float(np.clip(c, 30, SR / 2 - 100)) / (SR / 2), btype="low")
        if zi is None:
            zi = signal.lfilter_zi(b, a) * x[edges[0]]
        seg, zi = signal.lfilter(b, a, x[edges[i]:edges[i + 1]], zi=zi)
        out[edges[i]:edges[i + 1]] = seg
    return out

def noise(n, rng, color="white"):
    w = rng.standard_normal(n)
    if color == "white":
        return w
    if color == "pink":
        b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
        a = [1, -2.494956002, 2.017265875, -0.522189400]
        return signal.lfilter(b, a, w) * 3.0
    if color == "brown":
        x = np.cumsum(w); x -= np.linspace(x[0], x[-1], n)
        return x / (np.abs(x).max() + 1e-9) * 2.0
    raise ValueError(color)

def reverb(x, decay=2.0, mix=0.3, rng=None, predelay=0.02, tone=4000):
    """Reverb por convolução com IR de ruído decaindo exponencialmente."""
    rng = rng or np.random.default_rng(7)
    n_ir = int(decay * SR)
    ir = rng.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / (decay * SR / 6.9))
    ir = lowpass(ir, tone, 1)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    if x.ndim == 2:
        wet = np.stack([signal.fftconvolve(x[:, c], ir * (1 + 0.15 * c))[: len(x)] for c in range(2)], axis=1)
    else:
        wet = signal.fftconvolve(x, ir)[: len(x)]
    return x * (1 - mix) + wet * mix * 3.0

def delay(x, time_s, feedback=0.35, mix=0.3):
    d = int(time_s * SR); out = x.copy(); buf = x.copy()
    for _ in range(6):
        shifted = np.zeros_like(buf); shifted[d:] = buf[:-d] * feedback
        out += shifted * mix; buf = shifted
        if np.abs(shifted).max() < 1e-4: break
    return out

def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)

def stereo(x, width=0.5, rng=None):
    """mono -> stereo (Haas + micro-detune de fase por filtro allpass)."""
    if x.ndim == 2: return x
    d = int(0.012 * width * SR)
    l = x.copy(); r = np.zeros_like(x); r[d:] = x[: len(x) - d] if d else x
    return np.stack([l * (1 - 0.15 * width) + r * 0.15 * width, r * (1 - 0.15 * width) + l * 0.15 * width], axis=1)

def normalize(x, rms_db=-18.0, peak_db=-1.0):
    x = x - np.mean(x, axis=0)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    peak = db(peak_db)
    gain = min(db(rms_db) / rms, peak / (np.abs(x).max() + 1e-9))  # nunca ultrapassa o pico alvo
    x = x * gain
    return np.clip(x, -peak, peak)

def make_loop(x, loop_len_s, xfade_s=1.0):
    """corta em loop_len e devolve tail (reverb/delay) para o início; crossfade de segurança."""
    L = int(loop_len_s * SR)
    if len(x) <= L:
        x = np.pad(x, ((0, L - len(x)),) + ((0, 0),) * (x.ndim - 1))
    body = x[:L].copy(); tail = x[L:]
    n = min(len(tail), L)
    if n: body[:n] += tail[:n]
    xf = int(xfade_s * SR)
    if xf and xf * 2 < L:
        ramp = np.linspace(0, 1, xf)
        if body.ndim == 2: ramp = ramp[:, None]
        head = body[:xf].copy()
        body[:xf] = head * ramp + body[-xf:] * (1 - ramp) * 0.5 + head * 0 
        body[-xf:] = body[-xf:] * (1 - ramp) + head * ramp * 0.5
    return body

def write_wav(path, x):
    import soundfile as sf
    sf.write(str(path), x.astype(np.float32), SR)

def encode(wav, out_base: Path, ogg_q=4, mp3_bps="96k", mono=False):
    out_base.parent.mkdir(parents=True, exist_ok=True)
    ch = ["-ac", "1"] if mono else []
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), *ch, "-c:a", "libvorbis", "-q:a", str(ogg_q), str(out_base) + ".ogg"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), *ch, "-c:a", "libmp3lame", "-b:a", mp3_bps, str(out_base) + ".mp3"], check=True)

# ------------------------------------------------------------------ vozes / instrumentos
def osc_sine(freq, n, phase=0.0):
    return np.sin(2 * np.pi * freq * np.arange(n) / SR + phase)

def osc_saw(freq, n, harmonics=12):
    t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if freq * k > SR / 2.2: break
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * freq * k * t) / k
    return out * (2 / np.pi)

def osc_tri(freq, n, harmonics=9):
    t = np.arange(n) / SR; out = np.zeros(n)
    for i in range(harmonics):
        k = 2 * i + 1
        if freq * k > SR / 2.2: break
        out += ((-1) ** i) * np.sin(2 * np.pi * freq * k * t) / (k * k)
    return out * (8 / np.pi ** 2)

def pad_note(freq, dur, rng, detune=0.4, cutoff=1200, attack=1.2, release=2.0, bright_lfo=0.15):
    n = int(dur * SR)
    voices = [osc_saw(freq * 2 ** (c / 1200), n, 10) for c in (-detune * 6, 0, detune * 6)]
    x = sum(voices) / 3 + 0.4 * osc_sine(freq / 2, n)
    lfo = 1 + bright_lfo * np.sin(2 * np.pi * 0.07 * np.arange(n) / SR + rng.uniform(0, 6))
    x = sweep_lowpass(x, cutoff * 0.7, cutoff * 1.3, 2, 32) * lfo
    return x * adsr(n, attack, 0.5, 0.8, release)

def drone(freq, dur, rng, harmonics=(1, 2, 3, 5), drift=0.08, cutoff=600):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for i, h in enumerate(harmonics):
        amp = 1 / (h ** 1.2)
        wobble = 1 + drift * 0.01 * np.sin(2 * np.pi * (0.03 + 0.02 * i) * t + rng.uniform(0, 6))
        x += amp * np.sin(2 * np.pi * freq * h * wobble * t)
    x = lowpass(x, cutoff) * (1 + 0.25 * np.sin(2 * np.pi * 0.05 * t + rng.uniform(0, 6)))
    return x * adsr(n, 2.0, 0.1, 1.0, 3.0)

def pluck(freq, dur, rng, bright=0.5, decay=0.996):
    """Karplus-Strong."""
    n = int(dur * SR); period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period) * bright + (1 - bright) * np.sin(np.linspace(0, 2 * np.pi, period))
    out = np.zeros(n); idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = decay * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out * adsr(n, 0.002, 0.05, 0.9, 0.2)

def piano_note(freq, dur, vel=0.8):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, amp in ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.12), (5, 0.06)):
        f = freq * k * (1 + 0.0004 * k * k)
        if f > SR / 2.2: break
        x += amp * np.sin(2 * np.pi * f * t) * np.exp(-t * (1.2 + 0.8 * k))
    x *= np.exp(-t * 0.9)
    x += 0.02 * np.sin(2 * np.pi * freq * 0.5 * t) * np.exp(-t * 6)  # thump
    return x * vel * adsr(n, 0.003, 0.05, 1.0, 0.15)

def bell(freq, dur, rng):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 1.0), (2.0, 0.6, 1.6), (2.4, 0.4, 2.2), (3.0, 0.3, 2.5), (4.2, 0.2, 3.5), (5.4, 0.12, 4.0)):
        x += amp * np.sin(2 * np.pi * freq * ratio * t + rng.uniform(0, 6)) * np.exp(-t * dec)
    return x * adsr(n, 0.002, 0.1, 1.0, 0.3)

def kick(dur=0.5, f0=120, f1=45):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * 1.0

def tom(dur, freq, rng):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * (freq * (1 + 0.6 * np.exp(-t * 20))) * t) * np.exp(-t * 5)
    x += 0.3 * lowpass(noise(n, rng), 2000) * np.exp(-t * 30)
    return x

def tick(dur, rng, tone=3000, q=0.02):
    n = int(dur * SR); t = np.arange(n) / SR
    return bandpass(noise(n, rng), tone * 0.7, tone * 1.4) * np.exp(-t / q)

def heartbeat(rng, bpm=60, dur=4.0):
    n = int(dur * SR); out = np.zeros(n); period = 60 / bpm
    for tb in np.arange(0, dur, period):
        for off, amp, f in ((0, 1.0, 55), (0.18, 0.6, 48)):
            i = int((tb + off) * SR)
            k = kick(0.35, f * 1.4, f) * amp
            end = min(n, i + len(k)); out[i:end] += k[: end - i]
    return lowpass(out, 200)

def place(canvas, x, at_s, gain=1.0):
    i = int(at_s * SR)
    if i >= len(canvas): return
    end = min(len(canvas), i + len(x))
    if canvas.ndim == 2 and x.ndim == 1:
        canvas[i:end] += (x[: end - i] * gain)[:, None]
    else:
        canvas[i:end] += x[: end - i] * gain
