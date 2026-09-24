#!/usr/bin/env python3
"""
SFX procedurais — O Último Rastro. Determinístico por seed. Mono, OGG + MP3.
Uso: python tools/audio/sfx.py [--out public/assets/audio/sfx]
"""
import argparse, json, sys, tempfile
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from synth import *  # noqa

ROOT = Path(__file__).resolve().parents[2]

def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)

def footstep(rng, surface="wood"):
    n = int(0.35 * SR)
    if surface == "wood":
        x = lowpass(noise(n, rng), 900) * env_exp(n, 0.04)
        place(x, tom(0.25, 95, rng), 0.0, 0.6)
    elif surface == "stone":
        x = bandpass(noise(n, rng), 400, 3000) * env_exp(n, 0.03)
        place(x, tick(0.1, rng, 4000), 0.0, 0.4)
    else:  # gravel
        x = bandpass(noise(n, rng), 800, 6000) * env_exp(n, 0.06) * (0.5 + 0.5 * noise(n, rng, "pink").clip(-1, 1))
    return x

def steps_seq(rng, surface, count=4, gap=0.5):
    dur = gap * count + 0.5; out = np.zeros(int(dur * SR))
    for i in range(count):
        place(out, footstep(rng, surface), i * gap + rng.uniform(-0.03, 0.03), rng.uniform(0.7, 1.0))
    return out

def door_open(rng):
    n = int(1.6 * SR); t = np.arange(n) / SR
    creak = np.sin(2 * np.pi * (180 + 90 * np.sin(2 * np.pi * 1.3 * t)) * t) * env_exp(n, 0.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t))
    creak = bandpass(creak * lowpass(np.abs(noise(n, rng)), 30), 150, 2500)
    click = tick(0.12, rng, 2200); out = creak * 0.8
    place(out, click, 0.02, 0.6); place(out, tom(0.3, 70, rng), 1.1, 0.35)
    return out

def door_close(rng):
    n = int(0.9 * SR); out = np.zeros(n)
    place(out, tom(0.4, 60, rng), 0.0, 1.0); place(out, lowpass(noise(int(0.15 * SR), rng), 2500) * env_exp(int(0.15 * SR), 0.03), 0.0, 0.7)
    place(out, tick(0.1, rng, 3500), 0.06, 0.5)
    return out

def metal_gate(rng):
    n = int(2.2 * SR); out = np.zeros(n)
    place(out, bandpass(noise(int(0.6 * SR), rng), 1500, 7000) * env_exp(int(0.6 * SR), 0.15), 0, 0.5)
    for f, a in ((320, 1), (505, 0.6), (870, 0.4), (1290, 0.25)):
        place(out, osc_sine(f, int(1.8 * SR)) * env_exp(int(1.8 * SR), 0.35), 0.45, a * 0.5)
    place(out, tom(0.5, 55, rng), 0.45, 0.9)
    return out

def metal_clank(rng):
    n = int(1.2 * SR); out = np.zeros(n)
    for f, a, tau in ((720, 1, 0.3), (1130, 0.6, 0.25), (1840, 0.4, 0.2), (2900, 0.2, 0.12)):
        place(out, osc_sine(f, n) * env_exp(n, tau), 0, a * 0.4)
    place(out, tick(0.05, rng, 5000), 0, 0.8)
    return out

def wood_creak(rng):
    n = int(1.3 * SR); t = np.arange(n) / SR
    f = 90 + 40 * np.sin(2 * np.pi * 0.8 * t)
    x = signal.square(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    return lowpass(x, 1200) * env_exp(n, 0.4) * adsr(n, 0.15, 0.2, 0.7, 0.4)

def impact(rng):
    n = int(1.5 * SR); out = np.zeros(n)
    place(out, kick(0.8, 90, 30), 0, 1.0); place(out, lowpass(noise(int(0.4 * SR), rng, "pink"), 800) * env_exp(int(0.4 * SR), 0.08), 0, 0.8)
    return reverb(out, 1.5, 0.3, rng)

def paper(rng, kind="rustle"):
    n = int(0.9 * SR); t = np.arange(n) / SR
    mod = lowpass(np.abs(noise(n, rng)), 18) * 4
    x = bandpass(noise(n, rng), 1500, 9000) * mod * adsr(n, 0.05, 0.1, 0.6, 0.3)
    if kind == "turn":
        x = x * (1 + np.sin(2 * np.pi * 2.5 * t)) ; x[: int(0.3 * SR)] *= 0.4
    return x

def wind_gust(rng):
    n = int(3.5 * SR); t = np.arange(n) / SR
    env = np.sin(np.pi * t / 3.5) ** 2
    x = sweep_lowpass(noise(n, rng, "pink"), 200, 1400, 2, 40) * env
    return x

def rain_burst(rng):
    n = int(4.0 * SR)
    x = highpass(noise(n, rng), 1500) * 0.5
    drops = np.zeros(n)
    for _ in range(300):
        place(drops, tick(0.03, rng, rng.uniform(2500, 7000)), rng.uniform(0, 3.9), 0.4)
    return (x + drops) * adsr(n, 0.5, 0.5, 0.8, 1.0)

def object_pickup(rng):
    n = int(0.5 * SR); out = np.zeros(n)
    place(out, bandpass(noise(int(0.12 * SR), rng), 800, 5000) * env_exp(int(0.12 * SR), 0.03), 0, 0.7)
    place(out, tick(0.08, rng, 3000), 0.15, 0.5)
    return out

def suspense_sting(rng):
    n = int(3.0 * SR); out = np.zeros(n)
    for m in (38, 39, 45, 50.5):
        out += pad_note(midi_to_hz(m), 3.0, rng, detune=2, cutoff=1800, attack=0.6, release=1.4)[:n] * 0.4
    place(out, kick(0.8, 100, 35), 0.9, 0.9)
    return reverb(out, 2.5, 0.35, rng)

def creature_breath(rng):
    n = int(3.5 * SR); t = np.arange(n) / SR
    env = (0.5 + 0.5 * np.sin(2 * np.pi * 0.45 * t - np.pi / 2)) ** 2
    x = bandpass(noise(n, rng, "pink"), 200, 1500) * env
    x += 0.5 * lowpass(signal.square(2 * np.pi * 42 * t) * env, 300)
    return reverb(x, 1.8, 0.3, rng)

def troll_growl(rng):
    n = int(1.8 * SR); t = np.arange(n) / SR
    f = 55 + 15 * np.sin(2 * np.pi * 2.1 * t) - 10 * t
    x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 27 * t))
    x = sweep_lowpass(x, 700, 300, 2, 24) + 0.4 * bandpass(noise(n, rng, "pink"), 150, 900)
    return reverb(x * adsr(n, 0.1, 0.3, 0.8, 0.5), 2.0, 0.3, rng)

def troll_step(rng):
    n = int(1.2 * SR); out = np.zeros(n)
    place(out, kick(0.9, 70, 28), 0, 1.0); place(out, lowpass(noise(int(0.3 * SR), rng, "brown"), 400) * env_exp(int(0.3 * SR), 0.1), 0, 0.6)
    return reverb(out, 1.6, 0.3, rng)

def transformation_pulse(rng):
    n = int(4.0 * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in (38, 45, 50, 57, 62):
        x += osc_sine(midi_to_hz(m) * (1 + 0.003 * np.sin(2 * np.pi * 5 * t)), n) * 0.2
    x *= (0.4 + 0.6 * np.sin(2 * np.pi * 1.2 * t) ** 2) * adsr(n, 0.5, 0.5, 0.8, 1.5)
    x += 0.3 * bandpass(noise(n, rng, "pink"), 300, 2000) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.2 * t)) ** 4
    place(x, heartbeat(rng, 70, 4.0), 0, 0.6)
    return reverb(x, 2.5, 0.35, rng)

def cube_rotate(rng):
    n = int(0.8 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    place(out, bandpass(noise(int(0.5 * SR), rng), 500, 3000) * (0.3 + 0.7 * np.sin(np.pi * np.arange(int(0.5 * SR)) / (0.5 * SR))), 0, 0.5)
    place(out, tick(0.1, rng, 1800), 0.5, 0.9); place(out, osc_sine(660, int(0.3 * SR)) * env_exp(int(0.3 * SR), 0.06), 0.5, 0.3)
    return out

def cube_solve(rng):
    n = int(4.5 * SR); out = np.zeros(n)
    for i, m in enumerate((62, 66, 69, 74, 81)):
        place(out, bell(midi_to_hz(m), 3.5, rng), i * 0.22, 0.5)
    out += drone(midi_to_hz(38), 4.5, rng, cutoff=800)[:n] * 0.5 * adsr(n, 0.8, 0.5, 0.8, 1.5)
    return reverb(out, 3.0, 0.4, rng)

def cube_fail(rng):
    n = int(1.5 * SR); out = np.zeros(n)
    out += pad_note(midi_to_hz(41), 1.5, rng, detune=3, cutoff=900, attack=0.02, release=0.8)[:n] * 0.6
    out += pad_note(midi_to_hz(42), 1.5, rng, detune=3, cutoff=900, attack=0.02, release=0.8)[:n] * 0.5
    place(out, tom(0.5, 60, rng), 0, 0.7)
    return out

def ui_click(rng):
    n = int(0.12 * SR); return tick(0.12, rng, 2600) * 0.9 + osc_sine(1200, n) * env_exp(n, 0.015) * 0.3

def ui_hover(rng):
    n = int(0.08 * SR); return osc_sine(1800, n) * env_exp(n, 0.02) * 0.5

def ui_confirm(rng):
    n = int(0.5 * SR); out = np.zeros(n)
    place(out, osc_sine(880, int(0.25 * SR)) * env_exp(int(0.25 * SR), 0.08), 0, 0.5)
    place(out, osc_sine(1320, int(0.3 * SR)) * env_exp(int(0.3 * SR), 0.1), 0.1, 0.5)
    return out

def investigate(rng):
    n = int(1.8 * SR); out = np.zeros(n)
    for i, m in enumerate((69, 74, 76)):
        place(out, pluck(midi_to_hz(m), 1.2, rng, 0.3), i * 0.16, 0.6)
    return reverb(out, 1.5, 0.25, rng)

def clue_found(rng):
    n = int(2.2 * SR); out = np.zeros(n)
    for i, m in enumerate((62, 69, 74)):
        place(out, bell(midi_to_hz(m), 2.0, rng), i * 0.18, 0.45)
    return reverb(out, 2.0, 0.3, rng)

def symbol_found(rng):
    n = int(3.0 * SR); out = np.zeros(n)
    out += drone(midi_to_hz(50), 3.0, rng, cutoff=1200)[:n] * 0.5 * adsr(n, 0.05, 0.4, 0.6, 1.5)
    for i, m in enumerate((74, 81, 86)):
        place(out, bell(midi_to_hz(m), 2.5, rng), 0.3 + i * 0.25, 0.35)
    return reverb(out, 2.5, 0.35, rng)

def choice_wrong(rng):
    n = int(1.4 * SR); out = np.zeros(n)
    out += pad_note(midi_to_hz(43), 1.4, rng, detune=2, cutoff=1000, attack=0.02, release=0.7)[:n] * 0.5
    out += pad_note(midi_to_hz(49), 1.4, rng, detune=2, cutoff=1000, attack=0.02, release=0.7)[:n] * 0.4
    place(out, kick(0.5, 80, 35), 0, 0.6)
    return out

def bell_toll(rng):
    return reverb(bell(midi_to_hz(52), 5.0, rng) * 0.8, 3.5, 0.4, rng)

def clock_tick(rng):
    n = int(2.0 * SR); out = np.zeros(n)
    for i in range(2):
        place(out, tick(0.06, rng, 3200), i, 0.8); place(out, osc_sine(2400, int(0.05 * SR)) * env_exp(int(0.05 * SR), 0.01), i, 0.3)
    return out

def whisper(rng):
    n = int(2.2 * SR); t = np.arange(n) / SR
    mod = lowpass(np.abs(noise(n, rng)), 9) * 3
    x = bandpass(noise(n, rng), 1200, 5000) * mod * adsr(n, 0.2, 0.3, 0.7, 0.6)
    return reverb(x, 2.2, 0.4, rng)

def camera_static(rng):
    n = int(1.5 * SR); t = np.arange(n) / SR
    x = highpass(noise(n, rng), 3000) * (0.4 + 0.6 * (lowpass(np.abs(noise(n, rng)), 12) > 0.6)) * adsr(n, 0.05, 0.1, 0.8, 0.4)
    x += 0.2 * signal.square(2 * np.pi * 60 * t) * env_exp(n, 0.8)
    return lowpass(x, 8000)

def stone_grind(rng):
    n = int(3.0 * SR); t = np.arange(n) / SR
    x = lowpass(noise(n, rng, "brown"), 250) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t)) * adsr(n, 0.3, 0.3, 0.9, 0.8)
    x += 0.4 * bandpass(noise(n, rng), 300, 1500) * lowpass(np.abs(noise(n, rng)), 20) * 2
    return reverb(x, 2.5, 0.3, rng)

SFX = [
    ("sfx_step_wood", "passos (madeira)", lambda r: steps_seq(r, "wood"), 1),
    ("sfx_step_stone", "passos (pedra)", lambda r: steps_seq(r, "stone"), 2),
    ("sfx_step_gravel", "passos (cascalho)", lambda r: steps_seq(r, "gravel"), 3),
    ("sfx_door_open", "porta abrindo (rangido)", door_open, 4),
    ("sfx_door_close", "porta fechando", door_close, 5),
    ("sfx_metal_gate", "grade de metal fechando", metal_gate, 6),
    ("sfx_metal_clank", "metal (ferramenta/chave)", metal_clank, 7),
    ("sfx_wood_creak", "madeira rangendo", wood_creak, 8),
    ("sfx_impact_low", "impacto grave", impact, 9),
    ("sfx_paper_rustle", "papel (folhear)", lambda r: paper(r, "rustle"), 10),
    ("sfx_paper_turn", "papel (virar página)", lambda r: paper(r, "turn"), 11),
    ("sfx_wind_gust", "rajada de vento", wind_gust, 12),
    ("sfx_rain_burst", "chuva (rajada curta)", rain_burst, 13),
    ("sfx_object_pickup", "pegar objeto", object_pickup, 14),
    ("sfx_suspense_sting", "sting de suspense", suspense_sting, 15),
    ("sfx_creature_breath", "respiração de criatura", creature_breath, 16),
    ("sfx_troll_growl", "rosnado de troll", troll_growl, 17),
    ("sfx_troll_step", "passo pesado de troll", troll_step, 18),
    ("sfx_transformation_pulse", "pulso de transformação", transformation_pulse, 19),
    ("sfx_cube_rotate", "girar face do cubo", cube_rotate, 20),
    ("sfx_cube_solve", "cubo resolvido", cube_solve, 21),
    ("sfx_cube_fail", "cubo: sequência errada", cube_fail, 22),
    ("ui_click", "UI clique", ui_click, 23),
    ("ui_hover", "UI hover", ui_hover, 24),
    ("ui_confirm", "UI confirmar", ui_confirm, 25),
    ("sfx_investigate", "investigar (motivo curto)", investigate, 26),
    ("sfx_clue_found", "pista encontrada", clue_found, 27),
    ("sfx_symbol_found", "símbolo encontrado", symbol_found, 28),
    ("sfx_choice_wrong", "escolha errada", choice_wrong, 29),
    ("sfx_bell_toll", "sino da igreja", bell_toll, 30),
    ("sfx_clock_tick", "relógio (tique)", clock_tick, 31),
    ("sfx_whisper", "sussurro sob o chão", whisper, 32),
    ("sfx_camera_static", "estática de câmera", camera_static, 33),
    ("sfx_stone_grind", "pedra circular deslizando", stone_grind, 34),
    ("sfx_heartbeat", "batimento cardíaco", lambda r: heartbeat(r, 72, 4.0), 35),
]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "public/assets/audio/sfx")); ap.add_argument("--only")
    args = ap.parse_args(); out = Path(args.out)
    meta = {"version": 1, "basePath": "/assets/audio/sfx", "sfx": {}}
    with tempfile.TemporaryDirectory() as tmp:
        for sid, desc, fn, seed in SFX:
            if args.only and args.only != sid: continue
            x = fn(rng_for(1000 + seed))
            x = np.nan_to_num(x); x = normalize(x, -20.0, -3.0)
            fade = int(0.01 * SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
            wav = Path(tmp) / f"{sid}.wav"; write_wav(wav, x)
            encode(wav, out / sid, ogg_q=3, mp3_bps="64k", mono=True)
            meta["sfx"][sid] = {"file": sid, "desc": desc, "durationMs": int(len(x) / SR * 1000), "generator": "procedural-synth"}
            print(f"{sid:26s} {len(x)/SR:5.2f}s  {desc}", flush=True)
    (ROOT / "src/data/sfx.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "public/data/sfx.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()
