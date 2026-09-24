#!/usr/bin/env python3
"""
Validação de áudio (formato, duração, pico real, loudness, clipping, corrupção).
Uso: python tools/audio/validate.py [--json docs/audio-validation.json]
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIRS = {
    "music": ROOT / "public/assets/music",
    "sfx": ROOT / "public/assets/audio/sfx",
    "ambience": ROOT / "public/assets/audio/ambience",
    "voice": ROOT / "public/assets/audio/voice",
}
LIMITS = {  # (LUFS min, LUFS max, TP max dBFS)
    "music": (-24, -14, -0.5), "ambience": (-30, -17, -0.5), "sfx": (-28, -12, -0.5), "voice": (-23, -15, -0.5),
}

def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,sample_rate,channels:format=duration", "-of", "json", str(path)], capture_output=True, text=True)
    if out.returncode != 0: return None
    j = json.loads(out.stdout); s = j["streams"][0]
    return {"codec": s["codec_name"], "sr": int(s["sample_rate"]), "ch": int(s["channels"]), "dur": float(j["format"]["duration"])}

def loudness(path):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    m_i = re.findall(r"I:\s+(-?[\d.]+) LUFS", out); m_p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)
    return (float(m_i[-1]) if m_i else None, float(m_p[-1]) if m_p else None)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--json", default=str(ROOT / "docs/audio-validation.json")); args = ap.parse_args()
    report = {"categories": {}, "problems": []}
    for cat, d in DIRS.items():
        files = sorted(d.rglob("*.ogg")) if d.exists() else []
        rows = []; lo, hi, tp_max = LIMITS[cat]
        for f in files:
            p = probe(f); mp3 = f.with_suffix(".mp3")
            if not p or p["dur"] < 0.05:
                report["problems"].append(f"{cat}: {f.name} corrompido/vazio"); continue
            lufs, peak = loudness(f)
            problems = []
            if peak is not None and peak > tp_max: problems.append(f"pico {peak:.1f} dBTP")
            if lufs is not None and p["dur"] >= 0.5 and not (lo <= lufs <= hi): problems.append(f"loudness {lufs:.1f} LUFS fora de [{lo},{hi}]")
            if not mp3.exists(): problems.append("sem fallback mp3")
            for pr in problems: report["problems"].append(f"{cat}: {f.name} — {pr}")
            rows.append({"file": str(f.relative_to(ROOT / "public")), **p, "lufs": lufs, "peak": peak, "mp3": mp3.exists(), "ok": not problems})
        n = len(rows)
        report["categories"][cat] = {"count": n, "ok": sum(r["ok"] for r in rows), "totalSeconds": round(sum(r["dur"] for r in rows), 1),
                                     "lufsRange": [min((r["lufs"] for r in rows if r["lufs"] is not None), default=None), max((r["lufs"] for r in rows if r["lufs"] is not None), default=None)],
                                     "peakMax": max((r["peak"] for r in rows if r["peak"] is not None), default=None), "files": rows}
        print(f"{cat:9s} {n:4d} arquivos  ok={report['categories'][cat]['ok']}  total={report['categories'][cat]['totalSeconds']}s  LUFS={report['categories'][cat]['lufsRange']}  peakMax={report['categories'][cat]['peakMax']}")
    Path(args.json).write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n")
    print("problemas:", len(report["problems"]))
    for p in report["problems"][:40]: print(" -", p)
    return 1 if report["problems"] else 0

if __name__ == "__main__":
    sys.exit(main())
