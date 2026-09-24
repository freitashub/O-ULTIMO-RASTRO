#!/usr/bin/env python3
"""
Gerador de vozes — O Último Rastro.

Pipeline 100% local (CPU):
  - Kokoro-82M ONNX (kokoro-onnx)        → pt-br / en-us / es
  - Piper VITS pt_BR via piper-tts       → timbres masculinos pt-BR
  - ffmpeg (rubberband, aecho, loudnorm) → caracterização + normalização

Nenhuma fala é inventada: as linhas vêm de src/data/phases.json,
src/i18n/*.json, src/data/cubeConfig.json e das perguntas centrais da bíblia.

Uso:
  python tools/audio/voices.py --models <dir> [--out public/assets/audio/voice] [--only pt-BR]

Saída:
  public/assets/audio/voice/<lang>/<lineId>.ogg + .mp3
  src/data/voiceLines.json (+ espelho em public/data)
"""
import argparse, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LANGS = ["pt-BR", "en-US", "es-ES"]
KOKORO_LANG = {"pt-BR": "pt-br", "en-US": "en-us", "es-ES": "es"}

# ---------------------------------------------------------------- identidades
# engine, voz base, velocidade, pitch (semitons), cadeia ffmpeg extra
VOICES = {
    "narrator": {
        "pt-BR": ("kokoro", "pm_santa", 0.90, 0, ""),
        "en-US": ("kokoro", "am_michael", 0.90, 0, ""),
        "es-ES": ("kokoro", "em_santa", 0.90, 0, ""),
        "desc": "voz grave, calma, ritmo lento; narração em terceira pessoa",
    },
    "theo": {
        "pt-BR": ("kokoro", "pm_alex", 1.04, 3.5, "highpass=f=120"),
        "en-US": ("kokoro", "am_puck", 1.04, 3.0, "highpass=f=120"),
        "es-ES": ("kokoro", "em_alex", 1.04, 3.5, "highpass=f=120"),
        "desc": "criança de 11 anos: timbre jovem (pitch +3,5 st), curioso, ritmo levemente rápido",
    },
    "clara": {
        "pt-BR": ("kokoro", "pf_dora", 0.95, 0, "lowpass=f=9000"),
        "en-US": ("kokoro", "af_heart", 0.95, 0, "lowpass=f=9000"),
        "es-ES": ("kokoro", "ef_dora", 0.95, 0, "lowpass=f=9000"),
        "desc": "mãe: voz feminina quente, calma, protetora",
    },
    "elias": {
        "pt-BR": ("piper", "pt_BR-faber-medium", 0.95, -1, ""),
        "en-US": ("kokoro", "am_eric", 0.95, -1, ""),
        "es-ES": ("kokoro", "em_alex", 0.95, -1, ""),
        "desc": "pai: voz masculina madura, firme (sem falas no roteiro atual)",
    },
    "silas": {
        "pt-BR": ("piper", "pt_BR-jeff-medium", 0.88, -1, "aecho=0.6:0.3:25:0.15"),
        "en-US": ("kokoro", "am_onyx", 0.88, -1, "aecho=0.6:0.3:25:0.15"),
        "es-ES": ("kokoro", "em_santa", 0.88, -1, "aecho=0.6:0.3:25:0.15"),
        "desc": "chefe de polícia: sempre calmo, lento, respostas prontas; leve reverb de sala",
    },
    "troll": {
        "pt-BR": ("piper", "pt_BR-edresson-low", 0.85, -5, "tremolo=f=35:d=0.35,aecho=0.8:0.6:40|80:0.3|0.2,lowpass=f=3500"),
        "en-US": ("kokoro", "am_fenrir", 0.85, -5, "tremolo=f=35:d=0.35,aecho=0.8:0.6:40|80:0.3|0.2,lowpass=f=3500"),
        "es-ES": ("kokoro", "em_santa", 0.85, -5, "tremolo=f=35:d=0.35,aecho=0.8:0.6:40|80:0.3|0.2,lowpass=f=3500"),
        "desc": "trolls (vigia, mensageiro, ferreiro, guardião): grave (−5 st), rosnado, eco de túnel",
    },
    "troll_boss": {
        "pt-BR": ("piper", "pt_BR-jeff-medium", 0.80, -6, "tremolo=f=28:d=0.3,aecho=0.8:0.7:60|130:0.4|0.25,lowpass=f=4000"),
        "en-US": ("kokoro", "am_onyx", 0.80, -6, "tremolo=f=28:d=0.3,aecho=0.8:0.7:60|130:0.4|0.25,lowpass=f=4000"),
        "es-ES": ("kokoro", "em_santa", 0.80, -6, "tremolo=f=28:d=0.3,aecho=0.8:0.7:60|130:0.4|0.25,lowpass=f=4000"),
        "desc": "chefe troll / Silas revelado: mesma base de Silas, −6 st, caverna",
    },
    "prisoner": {
        "pt-BR": ("piper", "pt_BR-cadu-medium", 0.95, 0, "highpass=f=300,lowpass=f=3200,aecho=0.5:0.2:15:0.1"),
        "en-US": ("kokoro", "am_liam", 0.95, 0, "highpass=f=300,lowpass=f=3200"),
        "es-ES": ("kokoro", "em_alex", 0.95, 0, "highpass=f=300,lowpass=f=3200"),
        "desc": "prisioneiro humano: sussurrado, abafado, cansado",
    },
}

# ---------------------------------------------------------------- roteiro
# falas de personagens já presentes em phases.json (entre aspas)
CHARACTER_LINES = [
    ("phase02_voice_01", "troll",      "Eles já estiveram aqui."),
    ("phase03_troll_01", "troll",      "Se eu fosse você, não procuraria seus pais aqui."),
    ("phase04_silas_01", "silas",      "Seus pais podem ter decidido ir embora."),
    ("phase04_silas_02", "silas",      "Você tem os olhos do seu pai. E algo mais."),
    ("phase06_clara_01", "clara",      "Filho, talvez tenhamos que partir."),
    ("phase07_clara_01", "clara",      "Se eu desaparecer, procure a sexta marca."),
    ("phase07_clara_02", "clara",      "Não confie no que estiver escrito. Confie no que você viu."),
    ("phase10_troll_01", "troll",      "Quantas marcas você já encontrou?"),
    ("phase11_prisoner_01", "prisoner","A polícia trabalha para eles."),
    ("phase12_prisoner_01", "prisoner","Você não devia estar aqui."),
    ("phase12_prisoner_02", "prisoner","Silas não é o que parece. Mas também não é o que você imagina."),
    ("phase13_silas_01", "silas",      "Você está procurando uma resposta que seus pais tentaram esconder de você."),
    ("phase13_silas_02", "silas",      "Crianças como você não deveriam investigar sozinhas. Mas você não é como as outras."),
    ("phase16_clara_01", "clara",      "Qual era o apelido que eu te dava quando você era pequeno?"),
    ("phase16_creature_01", "troll_boss", "Eles estão na última caverna."),
    ("phase19_silas_01", "silas",      "Você chegou até aqui porque seus pais queriam que você chegasse. Mas talvez eles não tenham contado tudo."),
    ("phase19_silas_02", "troll_boss", "Você sempre chegou a um lugar depois da hora certa."),
    # perguntas centrais de Theo (bíblia narrativa, §3)
    ("theo_q1", "theo", "Onde estão meus pais?"),
    ("theo_q2", "theo", "Por que meus pais sabiam dos trolls?"),
    ("theo_q3", "theo", "Quem é o verdadeiro sexto troll?"),
]

I18N_LINES = [  # (lineId, speaker, i18nKey)
    ("intro_text", "narrator", "intro.text"),
    ("title_subtitle", "narrator", "title.subtitle"),
    ("ending_good", "narrator", "ending.good.text"),
    ("ending_bad", "narrator", "ending.bad.text"),
    ("ending_secret", "narrator", "ending.secret.text"),
    ("puzzle_sixth_face", "narrator", "puzzle.sixthFace"),
    ("transform_hint_7", "narrator", "transform.hint.7"),
    ("transform_hint_11", "narrator", "transform.hint.11"),
    ("transform_hint_14", "narrator", "transform.hint.14"),
    ("transform_hint_17", "narrator", "transform.hint.17"),
    ("transform_hint_20", "narrator", "transform.hint.20"),
]

# ---------------------------------------------------------------- texto
UNITS = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"]
TENS = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"]

def pt_num(n: int) -> str:
    if n < 20: return UNITS[n]
    if n < 100:
        t, u = divmod(n, 10)
        return TENS[t] + (f" e {UNITS[u]}" if u else "")
    return str(n)

def normalize(text: str, lang: str) -> str:
    text = text.replace("\n", " ").replace("—", ", ").replace("–", ", ")
    text = re.sub(r"[‘’']", "", text)
    text = text.replace('"', "")
    if lang == "pt-BR":
        text = re.sub(r"(\d{1,2}):(\d{2})", lambda m: f"{pt_num(int(m.group(1)))} e {pt_num(int(m.group(2)))}", text)
        text = re.sub(r"\b(\d{1,2})\b", lambda m: pt_num(int(m.group(1))), text)
        text = text.replace("Clara V.", "Clara vê")
    return re.sub(r"\s+", " ", text).strip()

def build_lines():
    phases = json.loads((ROOT / "src/data/phases.json").read_text("utf-8"))
    cube = json.loads((ROOT / "src/data/cubeConfig.json").read_text("utf-8"))
    lines = []  # dict(id, speaker, lang, text)
    for p in phases:
        pid = f"phase{p['id']:02d}"
        lines.append((f"{pid}_intro", "narrator", "pt-BR", p["intro"]))
        lines.append((f"{pid}_scene", "narrator", "pt-BR", p["scene"]))
        if p.get("revelation"):
            lines.append((f"{pid}_revelation", "narrator", "pt-BR", p["revelation"]))
        lines.append((f"{pid}_cliffhanger", "narrator", "pt-BR", p["cliffhanger"]))
        for c in p["choices"]:
            lines.append((f"{pid}_choice_{c['id']}", "narrator", "pt-BR", c["consequence"]))
    lines.append(("cube_inscription", "narrator", "pt-BR", cube["inscription"]))
    for lid, spk, text in CHARACTER_LINES:
        lines.append((lid, spk, "pt-BR", text))
    for lang in LANGS:
        d = json.loads((ROOT / f"src/i18n/{lang}.json").read_text("utf-8"))
        for lid, spk, key in I18N_LINES:
            lines.append((lid, spk, lang, d[key]))
    return lines

# ---------------------------------------------------------------- engines
class Engines:
    def __init__(self, models: Path):
        self.models = models
        self._kokoro = None
        self._piper = {}

    def kokoro(self):
        if self._kokoro is None:
            from kokoro_onnx import Kokoro
            self._kokoro = Kokoro(str(self.models / "kokoro-v1.0.onnx"), str(self.models / "voices-v1.0.bin"))
        return self._kokoro

    def piper(self, name):
        if name not in self._piper:
            from piper import PiperVoice
            d = self.models / f"vits-piper-{name}"
            self._piper[name] = PiperVoice.load(str(d / f"{name}.onnx"), str(d / f"{name}.onnx.json"))
        return self._piper[name]

    def synth(self, engine, voice, text, speed, lang, wav_path):
        import soundfile as sf, numpy as np
        if engine == "kokoro":
            samples, sr = self.kokoro().create(text, voice=voice, speed=speed, lang=KOKORO_LANG[lang])
        else:
            from piper import SynthesisConfig
            chunks = list(self.piper(voice).synthesize(text, SynthesisConfig(length_scale=1.0 / speed)))
            samples = np.concatenate([np.frombuffer(c.audio_int16_bytes, dtype=np.int16) for c in chunks]).astype("float32") / 32768.0
            sr = chunks[0].sample_rate
        sf.write(wav_path, samples, sr)
        return len(samples) / sr

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def process(wav_in, pitch_st, extra, out_base: Path):
    chain = []
    if pitch_st:
        chain.append(f"rubberband=pitch={2 ** (pitch_st / 12):.4f}")
    if extra:
        chain.append(extra)
    chain += ["apad=pad_dur=0.25", "loudnorm=I=-18:TP=-1.5:LRA=11", "aresample=44100"]
    af = ",".join(chain)
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_in), "-af", af, "-ac", "1", "-ar", "44100", "-c:a", "libvorbis", "-q:a", "3", str(out_base) + ".ogg"])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out_base) + ".ogg", "-c:a", "libmp3lame", "-b:a", "64k", str(out_base) + ".mp3"])
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out_base) + ".ogg"], capture_output=True, text=True)
    return int(float(out.stdout.strip()) * 1000)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True)
    ap.add_argument("--out", default=str(ROOT / "public/assets/audio/voice"))
    ap.add_argument("--only", default=None, help="idioma único")
    ap.add_argument("--filter", default=None, help="regex de lineId")
    ap.add_argument("--speaker", default=None, help="regex de speaker")
    args = ap.parse_args()
    eng = Engines(Path(args.models))
    out_root = Path(args.out)
    meta_path = ROOT / "src/data/voiceLines.json"
    meta = json.loads(meta_path.read_text("utf-8")) if meta_path.exists() else {"version": 1, "basePath": "/assets/audio/voice", "speakers": {}, "lines": []}
    meta["speakers"] = {k: v["desc"] for k, v in VOICES.items()}
    existing = {(l["id"], l["lang"]): l for l in meta["lines"]}
    todo = build_lines()
    if args.only: todo = [l for l in todo if l[2] == args.only]
    if args.filter: todo = [l for l in todo if re.search(args.filter, l[0])]
    if args.speaker: todo = [l for l in todo if re.search(args.speaker, l[1])]
    print(f"{len(todo)} linhas")
    with tempfile.TemporaryDirectory() as tmp:
        for i, (lid, spk, lang, text) in enumerate(todo, 1):
            engine, voice, speed, pitch, extra = VOICES[spk][lang]
            norm = normalize(text, lang)
            wav = Path(tmp) / f"{lid}.wav"
            eng.synth(engine, voice, norm, speed, lang, wav)
            out_dir = out_root / lang
            out_dir.mkdir(parents=True, exist_ok=True)
            dur = process(wav, pitch, extra, out_dir / lid)
            existing[(lid, lang)] = {"id": lid, "speaker": spk, "lang": lang, "text": text, "engine": f"{engine}:{voice}", "durationMs": dur}
            print(f"[{i}/{len(todo)}] {lang} {spk:10s} {lid:26s} {dur/1000:5.1f}s", flush=True)
    meta["lines"] = sorted(existing.values(), key=lambda l: (l["lang"], l["id"]))
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", "utf-8")
    (ROOT / "public/data/voiceLines.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print("voiceLines.json:", len(meta["lines"]), "linhas")

if __name__ == "__main__":
    main()
