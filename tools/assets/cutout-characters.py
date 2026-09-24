#!/usr/bin/env python3
"""
Recorta uma pose de cada folha de personagem (public/assets/characters/*.webp) em sprite transparente,
normaliza altura/contraste e adiciona contorno + sombra suave.
Modelo: rembg u2net (~176 MB, GitHub Releases danielgatis/rembg) — fora do repo (~/.u2net).

Uso: python tools/assets/cutout-characters.py [--height 560] [--only theo]
Saída: public/assets/sprites/<id>.png + src/data/sprites.json
"""
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/assets/characters"
OUT = ROOT / "public/assets/sprites"

# pose escolhida por personagem: índice do componente (ordenado por área, maior primeiro) ou bbox manual
POSES = {
    "theo":     {"pick": 0, "desc": "Theo, pose frontal"},
    "theo_t2":  {"pick": 0, "desc": "Theo, transformação nível 2"},
    "theo_t4":  {"pick": 0, "desc": "Theo, transformação nível 4"},
    "clara":    {"pick": 1, "crop": [88, 13, 221, 470], "desc": "Clara, pose em pé (figura esquerda)"},
    "elias":    {"pick": 0, "crop": [110, 0, 262, 470], "darken": 0.35, "desc": "Elias, silhueta (a folha original não tem rosto; usado como vulto)"},
    "silas":    {"pick": 0, "crop": [181, 28, 316, 400], "desc": "Silas, pose em pé (figura central superior)"},
    "troll":    {"pick": 0, "desc": "Troll, figura central"},
}

def components(alpha, thr=40, min_area=8000):
    lab, n = ndimage.label(alpha > thr)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if w * h < min_area: continue
        boxes.append({"area": w * h, "x0": sl[1].start, "y0": sl[0].start, "x1": sl[1].stop, "y1": sl[0].stop, "mask": lab == i})
    return sorted(boxes, key=lambda b: -b["area"])

def stylize(im: Image.Image, target_h: int) -> Image.Image:
    # normaliza altura
    scale = target_h / im.height
    im = im.resize((max(1, round(im.width * scale)), target_h), Image.LANCZOS)
    rgb, a = im.convert("RGB"), im.getchannel("A")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
    rgb = ImageEnhance.Color(rgb).enhance(0.85)
    im = Image.merge("RGBA", (*rgb.split(), a))
    # contorno escuro fino (dilatação do alpha) + sombra suave deslocada
    pad = 10
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    a_np = np.array(a) > 20
    outline = ndimage.binary_dilation(a_np, iterations=2) & ~a_np
    outline_img = Image.new("RGBA", im.size, (0, 0, 0, 0))
    outline_img.putalpha(Image.fromarray((outline * 200).astype("uint8")))
    outline_img = Image.merge("RGBA", (*Image.new("RGB", im.size, (14, 12, 18)).split(), outline_img.getchannel("A")))
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    shadow.putalpha(a.point(lambda v: int(v * 0.45)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    canvas.alpha_composite(shadow, (pad + 4, pad + 6))
    canvas.alpha_composite(outline_img, (pad, pad))
    canvas.alpha_composite(im, (pad, pad))
    return canvas

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--height", type=int, default=560); ap.add_argument("--only"); ap.add_argument("--list", action="store_true")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    sess = new_session("u2net")
    meta = {"version": 1, "basePath": "/assets/sprites", "sprites": {}}
    meta_path = ROOT / "src/data/sprites.json"
    if meta_path.exists(): meta = json.loads(meta_path.read_text())
    for cid, cfg in POSES.items():
        if args.only and args.only != cid: continue
        src = SRC / f"char_{cid}.webp"
        if not src.exists(): print("sem folha:", cid); continue
        im = Image.open(src).convert("RGBA")
        cut = remove(im, session=sess)
        alpha = np.array(cut)[:, :, 3]
        comps = components(alpha)
        if args.list:
            print(cid, [(c["area"], c["x0"], c["y0"], c["x1"], c["y1"]) for c in comps]); continue
        if not comps: print("nenhum componente:", cid); continue
        c = comps[min(cfg["pick"], len(comps) - 1)]
        arr = np.array(cut)
        if "crop" in cfg:
            x0, y0, x1, y1 = cfg["crop"]
            keep = np.zeros(arr.shape[:2], dtype=bool); keep[y0:y1, x0:x1] = True
            arr[:, :, 3] = np.where(keep, arr[:, :, 3], 0)
            ys, xs = np.where(arr[:, :, 3] > 20)
            c = {"x0": int(xs.min()), "y0": int(ys.min()), "x1": int(xs.max()) + 1, "y1": int(ys.max()) + 1}
        else:
            arr[:, :, 3] = np.where(c["mask"], arr[:, :, 3], 0)  # só a pose escolhida
        if cfg.get("darken"):
            k = 1 - cfg["darken"]; arr[:, :, :3] = (arr[:, :, :3] * k).astype("uint8")
        pose = Image.fromarray(arr).crop((c["x0"], c["y0"], c["x1"], c["y1"]))
        sprite = stylize(pose, args.height)
        out = OUT / f"{cid}.png"; sprite.save(out, optimize=True)
        meta["sprites"][cid] = {"file": f"{cid}.png", "width": sprite.width, "height": sprite.height, "desc": cfg["desc"], "source": f"/assets/characters/char_{cid}.webp", "generator": "rembg-u2net + PIL"}
        print(f"{cid:8s} {sprite.width}x{sprite.height} <- comp{cfg['pick']} bbox=({c['x0']},{c['y0']},{c['x1']},{c['y1']})")
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "public/data/sprites.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()
