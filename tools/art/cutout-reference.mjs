#!/usr/bin/env node
/**
 * Recorta a arte de referência de um personagem (fundo branco liso, contorno preto) sem alterar o
 * desenho: remove só o branco conectado à borda (flood fill) e bolsões brancos grandes fechados
 * (entre braço e corpo). Brancos pequenos internos (olhos, brilhos) ficam intactos.
 * Nunca importado pelo runtime.
 *
 * Uso: node tools/art/cutout-reference.mjs <entrada> <saida.png>
 */
import sharp from 'sharp';

const WHITE = 232; // canal mínimo para considerar "fundo"
const ENCLOSED_MIN = 600; // px: bolsões fechados maiores que isso também são fundo

export async function cutout(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const isWhite = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return Math.min(r, g, b) >= WHITE && Math.max(r, g, b) - Math.min(r, g, b) < 18;
  };
  const label = new Int32Array(W * H).fill(-1);
  const bg = new Uint8Array(W * H);
  const stack = [];
  let region = 0;
  for (let start = 0; start < W * H; start++) {
    if (label[start] !== -1 || !isWhite(start)) continue;
    const pixels = [];
    let touchesBorder = false;
    stack.push(start);
    label[start] = region;
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      const x = p % W, y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesBorder = true;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && label[q] === -1 && isWhite(q)) { label[q] = region; stack.push(q); }
      }
    }
    if (touchesBorder || pixels.length >= ENCLOSED_MIN) for (const p of pixels) bg[p] = 1;
    region++;
  }
  // alfa: fundo = 0; pixels vizinhos do fundo recebem alfa pela "distância do branco" (antialias)
  const out = Buffer.from(data);
  for (let p = 0; p < W * H; p++) {
    if (bg[p]) { out[p * 4 + 3] = 0; continue; }
    const x = p % W, y = (p / W) | 0;
    const edge = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
    if (edge) {
      const m = Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
      const a = Math.max(0, Math.min(1, (255 - m) / (255 - 150)));
      out[p * 4 + 3] = Math.round(a * 255);
      // "despill": escurece a borda clara para não deixar halo branco
      if (a > 0) for (let c = 0; c < 3; c++) out[p * 4 + c] = Math.round(Math.max(0, (data[p * 4 + c] - 255 * (1 - a)) / a));
    }
  }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, output] = process.argv.slice(2);
  const buf = await cutout(input);
  await sharp(buf).trim({ threshold: 0 }).png().toFile(output);
  console.log(`recorte: ${output}`);
}
