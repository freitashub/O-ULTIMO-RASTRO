#!/usr/bin/env python3
"""
Ambiências em loop (procedurais) — O Último Rastro. Estéreo, 40 s, loop limpo.
Uso: python tools/audio/ambience.py [--out public/assets/audio/ambience]
"""
import argparse, json, sys, tempfile
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from synth import *  # noqa

ROOT = Path(__file__).resolve().parents[2]
DUR = 40.0

def bed_noise(rng, n, lo, hi, gain, color="pink", lfo=0.0, lfo_rate=0.05):
    x = bandpass(noise(n, rng, color), lo, hi)
    if lfo:
        t = np.arange(n) / SR
        x *= 1 + lfo * np.sin(2 * np.pi * lfo_rate * t + rng.uniform(0, 6)) * np.sin(2 * np.pi * lfo_rate * 0.37 * t)
    return x * gain

def hum(rng, n, freq, gain, harmonics=(1, 2, 3)):
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * freq * h * t) / h for h in harmonics) * gain * (1 + 0.1 * np.sin(2 * np.pi * 0.2 * t))

def drips(rng, n, count, tone=(1500, 4000), gain=0.4, rev=True):
    out = np.zeros(n)
    for _ in range(count):
        f = rng.uniform(*tone); d = int(0.25 * SR); t = np.arange(d) / SR
        x = np.sin(2 * np.pi * (f * (1 + 0.6 * np.exp(-t * 60))) * t) * np.exp(-t * 25)
        place(out, x, rng.uniform(0, n / SR - 0.3), gain * rng.uniform(0.3, 1))
    return reverb(out, 2.5, 0.5, rng) if rev else out

def crickets(rng, n, gain=0.15):
    t = np.arange(n) / SR; out = np.zeros(n)
    for f in (3800, 4300, 4700):
        chirp = (np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * 26 * t) > 0.6)) * ((np.sin(2 * np.pi * rng.uniform(0.6, 1.1) * t) > 0.2))
        out += chirp * rng.uniform(0.5, 1)
    return out * gain

def birds(rng, n, count=14, gain=0.25):
    out = np.zeros(n)
    for _ in range(count):
        d = int(rng.uniform(0.15, 0.4) * SR); t = np.arange(d) / SR
        f0 = rng.uniform(1800, 3500); x = np.sin(2 * np.pi * (f0 + rng.uniform(-800, 800) * np.sin(2 * np.pi * rng.uniform(4, 12) * t)) * t) * adsr(d, 0.02, 0.05, 0.7, 0.1)
        place(out, x, rng.uniform(0, n / SR - 0.5), gain * rng.uniform(0.4, 1))
    return reverb(out, 1.5, 0.3, rng)

def traffic(rng, n, gain=0.3):
    t = np.arange(n) / SR
    bed = lowpass(noise(n, rng, "brown"), 400) * (1 + 0.5 * np.sin(2 * np.pi * 0.03 * t)) * gain
    for _ in range(6):  # carros passando
        d = int(3.0 * SR); tt = np.arange(d) / SR; env = np.sin(np.pi * tt / 3.0) ** 2
        car = sweep_lowpass(noise(d, rng, "pink"), 300, 1500, 2, 24) * env
        place(bed, car, rng.uniform(0, n / SR - 3.5), gain * 0.5 * rng.uniform(0.4, 1))
    return bed

def clock(rng, n, gain=0.15):
    out = np.zeros(n)
    for s in np.arange(0, n / SR, 1.0):
        place(out, tick(0.05, rng, 3200), s, gain * (1 if int(s) % 2 == 0 else 0.7))
    return out

def rain(rng, n, gain=0.3):
    x = highpass(noise(n, rng), 2000) * gain * 0.6
    for _ in range(600):
        place(x, tick(0.03, rng, rng.uniform(2500, 7000)), rng.uniform(0, n / SR - 0.1), gain * 0.5)
    return lowpass(x, 9000)

def breathing(rng, n, rate=0.28, gain=0.2, lo=200, hi=1500):
    t = np.arange(n) / SR
    env = (0.5 + 0.5 * np.sin(2 * np.pi * rate * t)) ** 3
    return bandpass(noise(n, rng, "pink"), lo, hi) * env * gain

def distant_growls(rng, n, count=5, gain=0.2):
    out = np.zeros(n)
    for _ in range(count):
        d = int(1.5 * SR); t = np.arange(d) / SR
        x = lowpass(signal.sawtooth(2 * np.pi * (48 + 10 * np.sin(2 * np.pi * 2 * t)) * t), 250) * adsr(d, 0.3, 0.3, 0.7, 0.5)
        place(out, x, rng.uniform(0, n / SR - 2), gain * rng.uniform(0.3, 1))
    return reverb(out, 3.0, 0.6, rng)

def forge(rng, n, gain=0.3):
    fire = bandpass(noise(n, rng, "pink"), 300, 4000) * lowpass(np.abs(noise(n, rng)), 8) * 2 * gain
    out = fire
    for s in np.arange(1.0, n / SR - 1, 2.6):
        d = int(0.8 * SR); t = np.arange(d) / SR
        hit = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dec) for f, dec in ((900, 6), (1400, 8), (2300, 10))) * 0.4
        place(out, hit, s + rng.uniform(-0.2, 0.2), gain * rng.uniform(0.5, 1))
    return reverb(out, 2.0, 0.3, rng)

def shimmer(rng, n, gain=0.15, root=50):
    out = np.zeros(n)
    for _ in range(18):
        m = root + rng.choice([0, 3, 7, 10, 12, 15, 19, 24, 26])
        place(out, bell(midi_to_hz(m) * 2, 4.0, rng), rng.uniform(0, n / SR - 4), gain * rng.uniform(0.3, 1))
    t = np.arange(n) / SR
    out += 0.4 * gain * (np.sin(2 * np.pi * midi_to_hz(root) * t) + 0.5 * np.sin(2 * np.pi * midi_to_hz(root + 7) * t)) * (1 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
    return reverb(out, 3.5, 0.5, rng)

def build(kind, rng):
    n = int((DUR + 5) * SR)
    if kind == "city":        x = traffic(rng, n, 0.35) + bed_noise(rng, n, 100, 2500, 0.08, lfo=0.3) + drips(rng, n, 4, (2000, 4000), 0.15, False)
    elif kind == "house":     x = bed_noise(rng, n, 40, 400, 0.12, "brown") + hum(rng, n, 60, 0.02) + clock(rng, n, 0.12) + rain(rng, n, 0.12) + bed_noise(rng, n, 200, 900, 0.05, lfo=0.5, lfo_rate=0.08)
    elif kind == "forest":    x = bed_noise(rng, n, 200, 3000, 0.18, lfo=0.6, lfo_rate=0.07) + crickets(rng, n, 0.06) + birds(rng, n, 5, 0.12) + bed_noise(rng, n, 60, 300, 0.06, "brown")
    elif kind == "church":    x = reverb(bed_noise(rng, n, 60, 500, 0.15, "brown", lfo=0.4) + hum(rng, n, 110, 0.03, (1, 2, 4)), 4.0, 0.5, rng) + drips(rng, n, 6, (1000, 2500), 0.12)
    elif kind == "police":    x = hum(rng, n, 120, 0.06, (1, 2, 3, 5)) + bed_noise(rng, n, 80, 600, 0.1, "brown") + drips(rng, n, 10, (800, 2000), 0.08, False) + clock(rng, n, 0.05)
    elif kind == "interior":  x = bed_noise(rng, n, 40, 500, 0.14, "brown", lfo=0.2) + hum(rng, n, 50, 0.015) + drips(rng, n, 5, (600, 1500), 0.06, False)
    elif kind == "underground": x = bed_noise(rng, n, 30, 250, 0.2, "brown", lfo=0.5, lfo_rate=0.04) + drips(rng, n, 24, (1200, 3500), 0.25) + reverb(bed_noise(rng, n, 200, 1200, 0.04, lfo=0.7), 3.0, 0.6, rng)
    elif kind == "trolls":    x = bed_noise(rng, n, 30, 200, 0.22, "brown", lfo=0.4) + breathing(rng, n, 0.22, 0.12, 150, 900) + distant_growls(rng, n, 6, 0.18) + drips(rng, n, 8, (900, 2500), 0.12)
    elif kind == "forge":     x = forge(rng, n, 0.3) + bed_noise(rng, n, 40, 300, 0.12, "brown")
    elif kind == "cave":      x = reverb(bed_noise(rng, n, 100, 900, 0.16, lfo=0.7, lfo_rate=0.05), 4.0, 0.5, rng) + drips(rng, n, 16, (1500, 4500), 0.22) + hum(rng, n, 36, 0.05, (1, 2)) + breathing(rng, n, 0.25, 0.08)
    elif kind == "mountain":  x = bed_noise(rng, n, 150, 1800, 0.25, lfo=0.8, lfo_rate=0.06) + bed_noise(rng, n, 40, 200, 0.1, "brown", lfo=0.5, lfo_rate=0.03)
    elif kind == "illusion":  x = shimmer(rng, n, 0.12, 54) + bed_noise(rng, n, 40, 300, 0.08, "brown") + breathing(rng, n, 0.2, 0.05)
    elif kind == "cube":      x = shimmer(rng, n, 0.16, 50) + hum(rng, n, 55, 0.05, (1, 3, 5)) + bed_noise(rng, n, 30, 150, 0.08, "brown", lfo=0.4)
    elif kind == "ending_good": x = birds(rng, n, 16, 0.2) + bed_noise(rng, n, 200, 2500, 0.1, lfo=0.5, lfo_rate=0.06) + shimmer(rng, n, 0.05, 57)
    elif kind == "ending_bad":  x = bed_noise(rng, n, 100, 1200, 0.18, lfo=0.8, lfo_rate=0.04) + hum(rng, n, 41, 0.06, (1, 2)) + heartbeat(rng, 48, DUR + 5)[:n] * 0.25
    elif kind == "ending_secret": x = shimmer(rng, n, 0.14, 52) + breathing(rng, n, 0.15, 0.06) + hum(rng, n, 33, 0.05, (1, 2, 3)) + drips(rng, n, 6, (2000, 5000), 0.1)
    elif kind == "station":   x = traffic(rng, n, 0.2) + hum(rng, n, 100, 0.04, (1, 2)) + bed_noise(rng, n, 300, 3000, 0.1, lfo=0.4) + drips(rng, n, 8, (1500, 3000), 0.1, False)
    else: raise ValueError(kind)
    x = np.nan_to_num(x)
    x = stereo(x, 0.7)
    x = make_loop(x, DUR, 1.5)
    x = highpass(x, 25, 1)
    return normalize(x, -24.0, -3.0)

AMB = [
    ("amb_city", "city", "cidade (tráfego distante, vento urbano)"),
    ("amb_house", "house", "casa (tom de sala, relógio, chuva na janela)"),
    ("amb_forest", "forest", "floresta noturna (vento nas folhas, grilos)"),
    ("amb_church", "church", "igreja (reverberação, goteiras)"),
    ("amb_police", "police", "delegacia (fluorescente, teclas distantes)"),
    ("amb_interior", "interior", "interior genérico (arquivo, biblioteca)"),
    ("amb_underground", "underground", "subterrâneo (goteiras, rumor grave)"),
    ("amb_trolls", "trolls", "cidade dos trolls (respiração, rosnados distantes)"),
    ("amb_forge", "forge", "oficina do ferreiro (fogo, martelo)"),
    ("amb_cave", "cave", "caverna final (vento, goteiras, respiração)"),
    ("amb_mountain", "mountain", "montanha (vento forte)"),
    ("amb_illusion", "illusion", "sala da ilusão (brilho irreal)"),
    ("amb_cube", "cube", "Cubo de Orun (zumbido cristalino)"),
    ("amb_ending_good", "ending_good", "final bom (amanhecer, pássaros)"),
    ("amb_ending_bad", "ending_bad", "final ruim (vento, batimento lento)"),
    ("amb_ending_secret", "ending_secret", "final secreto (brilho profundo)"),
    ("amb_station", "station", "estação / porto (motores, vento)"),
]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "public/assets/audio/ambience")); ap.add_argument("--only")
    args = ap.parse_args(); out = Path(args.out)
    meta = {"version": 1, "basePath": "/assets/audio/ambience", "ambience": {}}
    with tempfile.TemporaryDirectory() as tmp:
        for i, (aid, kind, desc) in enumerate(AMB):
            if args.only and args.only != aid: continue
            x = build(kind, rng_for(5000 + i))
            wav = Path(tmp) / f"{aid}.wav"; write_wav(wav, x)
            encode(wav, out / aid, ogg_q=3, mp3_bps="96k")
            meta["ambience"][aid] = {"file": aid, "desc": desc, "loop": True, "durationMs": int(DUR * 1000), "generator": "procedural-synth"}
            print(f"{aid:20s} {desc}", flush=True)
    (ROOT / "src/data/ambience.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "public/data/ambience.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()
