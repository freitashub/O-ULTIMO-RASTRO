#!/usr/bin/env python3
"""
Trilhas musicais procedurais — O Último Rastro.
Identidade sonora: motivo principal em Ré menor ("tema do rastro"), pads escuros,
drones, piano esparso, percussão grave só em tensão/perseguição.
Determinístico por seed. Exporta OGG + MP3 (estéreo) e music.json com metadados.

Uso: python tools/audio/music.py [--only phase01] [--out public/assets/music]
"""
import argparse, json, sys, tempfile
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from synth import *  # noqa

ROOT = Path(__file__).resolve().parents[2]

SCALES = {
    "aeolian":  [0, 2, 3, 5, 7, 8, 10],
    "dorian":   [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "lydian":   [0, 2, 4, 6, 7, 9, 11],
    "major":    [0, 2, 4, 5, 7, 9, 11],
    "harmonic": [0, 2, 3, 5, 7, 8, 11],
}
# motivo principal: (grau da escala, duração em tempos)
MOTIF = [(0, 1), (2, 1), (1, 2), (4, 1), (3, 1), (2, 2), (0, 1), (-1, 1), (0, 4)]

def deg_to_midi(root, scale, deg, octave=0):
    s = SCALES[scale]; o, d = divmod(deg, len(s))
    return root + 12 * (o + octave) + s[d]

def chord_midi(root, scale, deg, octave=0, n=3):
    return [deg_to_midi(root, scale, deg + 2 * i, octave) for i in range(n)]

# ------------------------------------------------------------------ camadas
def layer_drone(canvas, spec, rng):
    dur = len(canvas) / SR
    x = drone(midi_to_hz(spec["root"] - 24), dur + 4, rng, cutoff=spec.get("drone_cut", 500))
    place(canvas, x, 0, spec.get("drone_gain", 0.5))

def layer_pad(canvas, spec, rng, prog, bar_s, bars):
    for b in range(bars):
        deg = prog[b % len(prog)]
        for m in chord_midi(spec["root"], spec["scale"], deg, -1):
            x = pad_note(midi_to_hz(m), bar_s * 1.4, rng, cutoff=spec.get("pad_cut", 1000), attack=bar_s * 0.35, release=bar_s * 0.6)
            place(canvas, x, b * bar_s, spec.get("pad_gain", 0.18) * rng.uniform(0.85, 1.0))

def layer_motif(canvas, spec, rng, beat_s, bars, bar_s, instrument="piano", octave=1, every=4, gain=0.5, start_bar=2):
    for b in range(start_bar, bars, every):
        t = b * bar_s; g = gain * rng.uniform(0.8, 1.0)
        variant = rng.integers(0, 3)
        for i, (deg, beats) in enumerate(MOTIF):
            if variant == 1 and i in (3, 4): deg += 2
            if variant == 2 and i == 7: deg -= 2
            m = deg_to_midi(spec["root"], spec["scale"], deg, octave)
            d = beats * beat_s
            if instrument == "piano":   x = piano_note(midi_to_hz(m), d * 2.2, 0.9)
            elif instrument == "pluck": x = pluck(midi_to_hz(m), d * 1.5, rng, 0.4)
            elif instrument == "bell":  x = bell(midi_to_hz(m), d * 3, rng) * 0.5
            else:                       x = pad_note(midi_to_hz(m), d * 1.2, rng, cutoff=1500, attack=0.05, release=0.4)
            place(canvas, x, t, g); t += d

def layer_arp(canvas, spec, rng, prog, beat_s, bar_s, bars, gain=0.2, subdiv=2, octave=0, inst="pluck"):
    for b in range(bars):
        notes = chord_midi(spec["root"], spec["scale"], prog[b % len(prog)], octave, 4)
        steps = int(bar_s / (beat_s / subdiv))
        for s in range(steps):
            if rng.random() < spec.get("arp_density", 0.7):
                m = notes[(s + b) % len(notes)] + (12 if s % 5 == 4 else 0)
                x = pluck(midi_to_hz(m), beat_s * 1.2, rng, 0.35) if inst == "pluck" else piano_note(midi_to_hz(m), beat_s, 0.5)
                place(canvas, x, b * bar_s + s * beat_s / subdiv, gain * rng.uniform(0.6, 1))

def layer_perc(canvas, spec, rng, beat_s, bars, bar_s, pattern="tension", gain=0.5):
    n_beats = int(round(bar_s / beat_s))
    for b in range(bars):
        for k in range(n_beats):
            t = b * bar_s + k * beat_s
            if pattern == "tension":
                if k == 0: place(canvas, kick(0.6, 110, 40), t, gain)
                if k == 2 and rng.random() < 0.4: place(canvas, tom(0.4, 70, rng), t + beat_s * 0.5, gain * 0.5)
            elif pattern == "chase":
                place(canvas, kick(0.4, 130, 48), t, gain * (1 if k % 2 == 0 else 0.7))
                place(canvas, tick(0.15, rng, 2500), t + beat_s / 2, gain * 0.35)
                if k == 3: place(canvas, tom(0.35, 90, rng), t + beat_s * 0.75, gain * 0.6)
            elif pattern == "pulse":
                if k % 2 == 0: place(canvas, kick(0.5, 90, 42), t, gain * 0.6)
            elif pattern == "ritual":
                place(canvas, tom(0.5, 60 if k == 0 else 80, rng), t, gain * (0.8 if k == 0 else 0.4))

def layer_heartbeat(canvas, rng, bpm, gain=0.4):
    x = heartbeat(rng, bpm, len(canvas) / SR + 2)
    place(canvas, x, 0, gain)

def layer_stings(canvas, spec, rng, bars, bar_s, gain=0.35, prob=0.25):
    for b in range(bars):
        if rng.random() < prob:
            m = deg_to_midi(spec["root"], spec["scale"], rng.choice([1, 6, 8]), 0)
            x = pad_note(midi_to_hz(m), bar_s * 0.8, rng, detune=1.5, cutoff=2500, attack=bar_s * 0.4, release=bar_s * 0.3)
            x += 0.6 * pad_note(midi_to_hz(m + 1), bar_s * 0.8, rng, detune=1.5, cutoff=2500, attack=bar_s * 0.4, release=bar_s * 0.3)
            place(canvas, x, b * bar_s + rng.uniform(0, bar_s / 2), gain)

def layer_shimmer(canvas, spec, rng, bars, bar_s, gain=0.15, density=0.5):
    for b in range(bars):
        for _ in range(int(rng.poisson(density * 3))):
            m = deg_to_midi(spec["root"], spec["scale"], rng.integers(0, 7), 2 + rng.integers(0, 2))
            place(canvas, bell(midi_to_hz(m), 3.0, rng), b * bar_s + rng.uniform(0, bar_s), gain * rng.uniform(0.4, 1))

def layer_breath(canvas, rng, gain=0.12, rate=0.2):
    n = len(canvas); t = np.arange(n) / SR
    env = (0.5 + 0.5 * np.sin(2 * np.pi * rate * t)) ** 3
    x = bandpass(noise(n, rng, "pink"), 300, 1800) * env
    place(canvas, x, 0, gain)

def layer_wind(canvas, rng, gain=0.2):
    n = len(canvas); t = np.arange(n) / SR
    x = noise(n, rng, "pink")
    x = sweep_lowpass(x, 300, 900, 2, 48) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t) * np.sin(2 * np.pi * 0.013 * t))
    place(canvas, x, 0, gain)

# ------------------------------------------------------------------ presets
def preset(mood):
    P = {
        "medo":         dict(scale="phrygian", bpm=56, prog=[0, 1, 0, 5], layers=["drone", "pad", "stings", "heartbeat", "breath"], pad_cut=700, drone_gain=0.55),
        "curiosidade":  dict(scale="dorian", bpm=76, prog=[0, 3, 5, 6], layers=["drone", "pad", "arp", "motif_pluck"], pad_cut=1400, arp_density=0.5),
        "tensao":       dict(scale="phrygian", bpm=88, prog=[0, 1, 0, 3], layers=["drone", "pad", "perc_tension", "stings", "arp"], pad_cut=900, arp_density=0.35),
        "respiro":      dict(scale="dorian", bpm=66, prog=[0, 5, 3, 6], layers=["pad", "motif_piano", "shimmer"], pad_cut=1800, pad_gain=0.22),
        "confusao":     dict(scale="harmonic", bpm=70, prog=[0, 6, 1, 4], layers=["drone", "pad", "arp", "stings"], pad_cut=1100, arp_density=0.8),
        "melancolia":   dict(scale="aeolian", bpm=60, prog=[0, 5, 2, 6], layers=["pad", "motif_piano", "drone"], pad_cut=1500, drone_gain=0.3, pad_gain=0.24),
        "raiva":        dict(scale="phrygian", bpm=100, prog=[0, 1, 0, 1], layers=["drone", "pad", "perc_tension", "arp", "stings"], pad_cut=1300, arp_density=0.9),
        "humor":        dict(scale="lydian", bpm=92, prog=[0, 1, 3, 4], layers=["pad", "arp_piano", "shimmer", "perc_pulse"], pad_cut=2200, arp_density=0.6, pad_gain=0.2),
        "urgencia":     dict(scale="aeolian", bpm=120, prog=[0, 5, 6, 4], layers=["drone", "pad", "perc_chase", "arp"], pad_cut=1600, arp_density=0.85),
        "confianca":    dict(scale="dorian", bpm=72, prog=[0, 3, 4, 3], layers=["pad", "motif_pluck", "drone", "shimmer"], pad_cut=1600, drone_gain=0.3, pad_gain=0.22),
        "descoberta":   dict(scale="lydian", bpm=80, prog=[0, 4, 5, 3], layers=["pad", "motif_bell", "arp", "drone"], pad_cut=2000, arp_density=0.45, drone_gain=0.3),
        "paranoia":     dict(scale="phrygian", bpm=64, prog=[0, 1, 5, 1], layers=["drone", "stings", "heartbeat", "breath", "arp"], arp_density=0.3, drone_gain=0.6),
        "desconfianca": dict(scale="harmonic", bpm=68, prog=[0, 3, 1, 6], layers=["drone", "pad", "motif_piano", "stings"], pad_cut=1000),
        "choque":       dict(scale="phrygian", bpm=72, prog=[0, 1, 6, 1], layers=["drone", "stings", "perc_ritual", "pad"], pad_cut=800, drone_gain=0.6),
        "ilusao":       dict(scale="lydian", bpm=62, prog=[0, 1, 4, 5], layers=["pad", "shimmer", "motif_bell", "stings"], pad_cut=2400, pad_gain=0.24),
        "silencio":     dict(scale="aeolian", bpm=50, prog=[0, 0, 5, 0], layers=["wind", "breath", "drone_soft"], drone_gain=0.18),
        "perseguicao":  dict(scale="phrygian", bpm=132, prog=[0, 1, 0, 6], layers=["drone", "perc_chase", "arp", "stings", "pad"], pad_cut=1500, arp_density=0.95, drone_gain=0.45),
        "trolls":       dict(scale="phrygian", bpm=58, prog=[0, 1, 0, 3], layers=["drone", "perc_ritual", "breath", "stings", "pad"], pad_cut=600, drone_gain=0.6),
        "caverna":      dict(scale="aeolian", bpm=54, prog=[0, 5, 0, 6], layers=["drone", "wind", "shimmer", "pad"], pad_cut=700, drone_gain=0.5),
        "cubo":         dict(scale="harmonic", bpm=60, prog=[0, 4, 5, 6], layers=["drone", "shimmer", "motif_bell", "arp", "perc_pulse"], pad_cut=1500, arp_density=0.5),
        "transformacao":dict(scale="phrygian", bpm=66, prog=[0, 1, 3, 1], layers=["drone", "pad", "heartbeat", "stings", "shimmer", "breath"], pad_cut=900, drone_gain=0.55),
        "tema":         dict(scale="aeolian", bpm=70, prog=[0, 5, 3, 6], layers=["drone", "pad", "motif_piano", "arp", "shimmer"], pad_cut=1400, arp_density=0.4, drone_gain=0.35),
        "final_bom":    dict(scale="dorian", bpm=64, prog=[0, 3, 5, 6, 0, 3, 4, 6], layers=["pad", "motif_piano", "shimmer", "drone_soft"], pad_cut=2200, pad_gain=0.26),
        "final_ruim":   dict(scale="phrygian", bpm=52, prog=[0, 1, 0, 5], layers=["drone", "pad", "motif_piano", "heartbeat"], pad_cut=800, drone_gain=0.5),
        "final_secreto":dict(scale="lydian", bpm=58, prog=[0, 4, 1, 5], layers=["drone", "pad", "motif_bell", "shimmer", "breath"], pad_cut=2600, pad_gain=0.24),
        "creditos":     dict(scale="aeolian", bpm=68, prog=[0, 5, 3, 6], layers=["pad", "motif_piano", "arp", "shimmer"], pad_cut=1800, arp_density=0.35, pad_gain=0.22),
    }
    return dict(P[mood])

TRACKS = [
    # (id, arquivo, mood, root midi, bars, loop, seed)
    ("phase01", "phase01_casa_medo", "medo", 50, 16, True, 101),
    ("phase02", "phase02_igreja_curiosidade", "curiosidade", 52, 16, True, 102),
    ("phase03", "phase03_tunel_tensao", "tensao", 50, 20, True, 103),
    ("phase04", "phase04_delegacia_respiro", "respiro", 55, 16, True, 104),
    ("phase05", "phase05_arquivo_confusao", "confusao", 49, 16, True, 105),
    ("phase06", "phase06_estacao_melancolia", "melancolia", 50, 16, True, 106),
    ("phase07", "phase07_biblioteca_raiva", "raiva", 48, 20, True, 107),
    ("phase08", "phase08_porto_humor", "humor", 55, 16, True, 108),
    ("phase09", "phase09_registros_urgencia", "urgencia", 50, 24, True, 109),
    ("phase10", "phase10_oficina_confianca", "confianca", 53, 16, True, 110),
    ("phase11", "phase11_cidade_descoberta", "descoberta", 52, 16, True, 111),
    ("phase12", "phase12_prisioneiro_paranoia", "paranoia", 47, 16, True, 112),
    ("phase13", "phase13_silas_desconfianca", "desconfianca", 50, 16, True, 113),
    ("phase14", "phase14_mapa_choque", "choque", 48, 16, True, 114),
    ("phase15", "phase15_montanha_tensao", "tensao", 49, 20, True, 115),
    ("phase16", "phase16_sala_ilusao_pico", "ilusao", 54, 16, True, 116),
    ("phase17", "phase17_cidade_medo", "medo", 48, 16, True, 117),
    ("phase18", "phase18_verdade_raiva", "raiva", 50, 20, True, 118),
    ("phase19", "phase19_aviso_choque", "choque", 47, 16, True, 119),
    ("phase20", "phase20_caverna_silencio", "silencio", 50, 12, True, 120),
    ("menu", "bgm_menu_tema", "tema", 50, 24, True, 201),
    ("credits", "bgm_credits", "creditos", 50, 20, True, 202),
    ("investigation", "bgm_investigacao", "curiosidade", 50, 16, True, 203),
    ("suspense", "bgm_suspense", "paranoia", 49, 16, True, 204),
    ("discovery", "bgm_descoberta", "descoberta", 52, 16, True, 205),
    ("chase", "bgm_perseguicao", "perseguicao", 50, 24, True, 206),
    ("trolls", "bgm_trolls", "trolls", 47, 16, True, 207),
    ("cave", "bgm_caverna", "caverna", 50, 16, True, 208),
    ("cube", "bgm_cubo_orun", "cubo", 50, 16, True, 209),
    ("transformation", "bgm_transformacao", "transformacao", 48, 16, True, 210),
    ("ending_good", "bgm_final_bom", "final_bom", 50, 16, False, 211),
    ("ending_bad", "bgm_final_ruim", "final_ruim", 47, 12, False, 212),
    ("ending_secret", "bgm_final_secreto", "final_secreto", 52, 16, False, 213),
]

def render(track):
    tid, fname, mood, root, bars, loop, seed = track
    spec = preset(mood); spec["root"] = root
    rng = rng_for(seed)
    beat_s = 60 / spec["bpm"]; bar_s = beat_s * 4; dur = bars * bar_s
    tail = 6.0
    canvas = np.zeros(int((dur + tail) * SR))
    prog = spec["prog"]
    for layer in spec["layers"]:
        if layer == "drone": layer_drone(canvas, spec, rng)
        elif layer == "drone_soft": layer_drone(canvas, dict(spec, drone_gain=spec.get("drone_gain", 0.2), drone_cut=300), rng)
        elif layer == "pad": layer_pad(canvas, spec, rng, prog, bar_s, bars)
        elif layer == "motif_piano": layer_motif(canvas, spec, rng, beat_s, bars, bar_s, "piano", 1, 4, 0.45)
        elif layer == "motif_pluck": layer_motif(canvas, spec, rng, beat_s, bars, bar_s, "pluck", 1, 4, 0.5)
        elif layer == "motif_bell": layer_motif(canvas, spec, rng, beat_s, bars, bar_s, "bell", 2, 4, 0.35)
        elif layer == "arp": layer_arp(canvas, spec, rng, prog, beat_s, bar_s, bars, 0.16, 2, 0)
        elif layer == "arp_piano": layer_arp(canvas, spec, rng, prog, beat_s, bar_s, bars, 0.2, 2, 1, "piano")
        elif layer == "perc_tension": layer_perc(canvas, spec, rng, beat_s, bars, bar_s, "tension", 0.5)
        elif layer == "perc_chase": layer_perc(canvas, spec, rng, beat_s, bars, bar_s, "chase", 0.45)
        elif layer == "perc_pulse": layer_perc(canvas, spec, rng, beat_s, bars, bar_s, "pulse", 0.4)
        elif layer == "perc_ritual": layer_perc(canvas, spec, rng, beat_s, bars, bar_s, "ritual", 0.45)
        elif layer == "heartbeat": layer_heartbeat(canvas, rng, spec["bpm"], 0.35)
        elif layer == "stings": layer_stings(canvas, spec, rng, bars, bar_s)
        elif layer == "shimmer": layer_shimmer(canvas, spec, rng, bars, bar_s)
        elif layer == "breath": layer_breath(canvas, rng)
        elif layer == "wind": layer_wind(canvas, rng, 0.25)
    x = reverb(canvas, 2.6, 0.28, rng, tone=3500)
    x = stereo(x, 0.6)
    x = reverb(x, 1.2, 0.12, rng, tone=6000)
    if loop:
        x = make_loop(x, dur, 0.8)
    else:
        n = int(dur * SR); x = x[: n + int(tail * SR)]
        fade = np.linspace(1, 0, int(4 * SR)); x[-len(fade):] *= fade[:, None]
    x = highpass(x, 28, 1)
    rms_target = -22.0 if mood == "silencio" else -18.0
    return normalize(x, rms_target, -1.0), dur

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--out", default=str(ROOT / "public/assets/music"))
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    meta_path = ROOT / "src/data/music.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {"version": 1, "basePath": "/assets/music", "tracks": {}}
    with tempfile.TemporaryDirectory() as tmp:
        for tr in TRACKS:
            if args.only and args.only != tr[0]: continue
            x, dur = render(tr)
            wav = Path(tmp) / f"{tr[1]}.wav"; write_wav(wav, x)
            encode(wav, out / tr[1], ogg_q=4, mp3_bps="112k")
            meta["tracks"][tr[0]] = {"file": tr[1], "mood": tr[2], "loop": tr[5], "durationMs": int(dur * 1000), "seed": tr[6], "generator": "procedural-synth"}
            print(f"{tr[0]:14s} {tr[1]:32s} {dur:6.1f}s mood={tr[2]}", flush=True)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "public/data/music.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()
