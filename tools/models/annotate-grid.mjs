#!/usr/bin/env node
/**
 * Auxiliar de anotação: desenha uma grade numerada sobre a arte para ler coordenadas (px) dos pontos-chave.
 * Uso: node tools/models/annotate-grid.mjs <arte.jpg> <saida.png> [x0 y0 x1 y1] [passo]
 * Com janela (x0 y0 x1 y1) recorta e amplia 2× (detalhe de rosto/mãos).
 */
import sharp from 'sharp';

const [src, out, ax0, ay0, ax1, ay1, astep] = process.argv.slice(2);
const meta = await sharp(src).metadata();
const win = ax0 !== undefined ? { x0: +ax0, y0: +ay0, x1: +ax1, y1: +ay1 } : { x0: 0, y0: 0, x1: meta.width, y1: meta.height };
const step = astep ? +astep : ax0 !== undefined ? 25 : 50;
const scale = ax0 !== undefined ? 2 : 1;
const w = (win.x1 - win.x0) * scale, h = (win.y1 - win.y0) * scale;
let lines = '';
for (let x = Math.ceil(win.x0 / step) * step; x <= win.x1; x += step) {
  const X = (x - win.x0) * scale, major = x % (step * 2) === 0;
  lines += `<line x1="${X}" y1="0" x2="${X}" y2="${h}" stroke="${major ? '#ff2d55' : '#ff2d5566'}" stroke-width="1"/>`;
  if (major) lines += `<text x="${X + 2}" y="12" font-size="11" fill="#d00" font-family="sans-serif">${x}</text>`;
}
for (let y = Math.ceil(win.y0 / step) * step; y <= win.y1; y += step) {
  const Y = (y - win.y0) * scale, major = y % (step * 2) === 0;
  lines += `<line x1="0" y1="${Y}" x2="${w}" y2="${Y}" stroke="${major ? '#0a84ff' : '#0a84ff66'}" stroke-width="1"/>`;
  if (major) lines += `<text x="2" y="${Y - 2}" font-size="11" fill="#06c" font-family="sans-serif">${y}</text>`;
}
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lines}</svg>`);
await sharp(src).extract({ left: win.x0, top: win.y0, width: win.x1 - win.x0, height: win.y1 - win.y0 }).resize(w, h).composite([{ input: svg }]).png().toFile(out);
console.log(`${out} ${w}x${h}`);
