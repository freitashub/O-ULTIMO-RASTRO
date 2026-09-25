#!/usr/bin/env node
/**
 * Deriva todos os assets 2D do Theo a partir da arte de referência aprovada
 * (referencias/personagens/theo/theo_normal.webp), sem redesenhar nada:
 *   - public/assets/sprites/theo.png        recorte para o ator 2D (altura 580)
 *   - public/assets/characters/char_theo.webp  folha-fonte 480×720
 *   - public/images/portraits/theo.png      retrato 512×512 (busto)
 *   - tools/models/textures/theo_face.png   textura do rosto do modelo 3D (projeção frontal)
 * Nunca importado pelo runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { cutout } from './cutout-reference.mjs';

const REF = 'referencias/personagens/theo/theo_normal.webp';
const cutBuf = await sharp(await cutout(REF)).trim({ threshold: 0 }).png().toBuffer();
const meta = await sharp(cutBuf).metadata();
const W = meta.width, H = meta.height;
const out = (p) => { fs.mkdirSync(path.dirname(p), { recursive: true }); return p; };

// sprite 2D (mesma altura dos demais sprites do catálogo)
const sprite = await sharp(cutBuf).resize({ height: 580, kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
await sharp(sprite).toFile(out('public/assets/sprites/theo.png'));
const sm = await sharp(sprite).metadata();

// folha-fonte 480×720 (fundo branco original)
await sharp(REF).resize(480, 720, { fit: 'contain', background: '#ffffff' }).webp({ quality: 92 }).toFile(out('public/assets/characters/char_theo.webp'));

// retrato: cabeça + ombros sobre fundo escuro com vinheta
const bust = { left: 0, top: 0, width: Math.min(W, 330), height: 360 };
const bustImg = await sharp(cutBuf).extract(bust).resize({ width: 440, height: 480, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const vignette = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#2a2f36"/><stop offset="1" stop-color="#0c0d11"/></radialGradient></defs>
  <rect width="512" height="512" rx="18" fill="url(#g)"/>
  <rect x="3" y="3" width="506" height="506" rx="16" fill="none" stroke="#3b3f47" stroke-width="3"/></svg>`);
await sharp(vignette).composite([{ input: bustImg, left: 36, top: 32 }]).png({ compressionLevel: 9 }).toFile(out('public/images/portraits/theo.png'));

// textura do rosto: janela quadrada centrada entre os olhos; fora da elipse do rosto → cor de pele
const FACE = { cx: 153, cy: 196, half: 80 }; // px no recorte (olhos em y≈180, x≈117/190; queixo y≈268)
const SIZE = 256;
const faceCrop = await sharp(cutBuf)
  .extract({ left: FACE.cx - FACE.half, top: FACE.cy - FACE.half, width: FACE.half * 2, height: FACE.half * 2 })
  .resize(SIZE, SIZE, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
const { data } = faceCrop;
// cor de pele: mediana de uma área da bochecha
const skinSamples = [];
const sc = (x) => Math.round(((x - (FACE.cx - FACE.half)) / (FACE.half * 2)) * SIZE);
const scy = (y) => Math.round(((y - (FACE.cy - FACE.half)) / (FACE.half * 2)) * SIZE);
for (let y = scy(244); y < scy(254); y++) for (let x = sc(170); x < sc(184); x++) {
  const i = (y * SIZE + x) * 4;
  skinSamples.push([data[i], data[i + 1], data[i + 2]]);
}
const skin = [0, 1, 2].map((c) => skinSamples.map((p) => p[c]).sort((a, b) => a - b)[skinSamples.length >> 1]);
const ex = { cx: sc(155), cy: scy(194), rx: (66 / 160) * SIZE, ry: (74 / 160) * SIZE, fade: (12 / 160) * SIZE };
const tex = Buffer.alloc(SIZE * SIZE * 3);
for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
  const i = y * SIZE + x;
  const a = data[i * 4 + 3] / 255;
  const d = Math.hypot((x - ex.cx) / ex.rx, (y - ex.cy) / ex.ry); // 1 = borda da elipse
  const k = Math.max(0, Math.min(1, (1 - d) * (ex.rx / ex.fade) + 0.0)) * a;
  for (let c = 0; c < 3; c++) tex[i * 3 + c] = Math.round(data[i * 4 + c] * k + skin[c] * (1 - k));
}
await sharp(tex, { raw: { width: SIZE, height: SIZE, channels: 3 } }).png({ compressionLevel: 9 }).toFile(out('tools/models/textures/theo_face.png'));
fs.writeFileSync(out('tools/models/textures/theo_face.json'), JSON.stringify({ source: REF, window: FACE, skinSRGB: skin, cutoutSize: [W, H] }, null, 2) + '\n');

// catálogo de sprites
const catPath = 'src/data/sprites.json';
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
cat.sprites.theo = { ...cat.sprites.theo, width: sm.width, height: sm.height, desc: 'Theo, pose frontal (arte de referência aprovada)', source: `/${REF}`, generator: 'tools/art/build-theo-art.mjs (recorte por flood fill, sem redesenho)' };
fs.writeFileSync(catPath, JSON.stringify(cat, null, 2) + '\n');
console.log(`theo: sprite ${sm.width}×${sm.height}, retrato 512², textura rosto ${SIZE}², pele sRGB ${skin.join(',')}`);
