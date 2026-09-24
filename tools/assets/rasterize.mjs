/**
 * Rasterize project SVG assets to game-ready formats (webp/png) via sharp.
 * Never imported by game runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

async function convert(svgPath, outPath, width, height) {
  const abs = path.isAbsolute(svgPath) ? svgPath : path.join(root, svgPath);
  const out = path.isAbsolute(outPath) ? outPath : path.join(root, outPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(abs, { density: 192 }).resize(width, height, { fit: 'cover' }).png().toFile(out);
  // also webp sibling if requested extension is webp
  return out;
}

async function convertWebp(svgPath, outPath, width, height) {
  const abs = path.isAbsolute(svgPath) ? svgPath : path.join(root, svgPath);
  const out = path.isAbsolute(outPath) ? outPath : path.join(root, outPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(abs, { density: 192 }).resize(width, height, { fit: 'cover' }).webp({ quality: 90 }).toFile(out);
  return out;
}

async function convertPng(svgPath, outPath, width, height) {
  const abs = path.isAbsolute(svgPath) ? svgPath : path.join(root, svgPath);
  const out = path.isAbsolute(outPath) ? outPath : path.join(root, outPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(abs, { density: 192 }).resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);
  return out;
}

const symbols = ['olho', 'lua', 'mao', 'corvo', 'arvore', 'rosto'];
const meta = { convertedAt: new Date().toISOString(), files: [] };

for (const id of symbols) {
  const src = `public/assets/symbols/${id}.svg`;
  if (!fs.existsSync(src)) continue;
  await convertWebp(src, `public/assets/symbols/${id}.webp`, 256, 256);
  await convertPng(src, `public/images/symbols/${id}.png`, 256, 256);
  meta.files.push(`/assets/symbols/${id}.webp`, `/images/symbols/${id}.png`);
}

// cube faces
for (const id of symbols) {
  const src = `public/images/cube/face_${id}.svg`;
  if (!fs.existsSync(src)) continue;
  await convertPng(src, `public/images/cube/face_${id}.png`, 256, 256);
  meta.files.push(`/images/cube/face_${id}.png`);
}

// endings
for (const id of ['ending_good', 'ending_bad', 'ending_secret']) {
  const src = `public/images/endings/${id}.svg`;
  if (!fs.existsSync(src)) continue;
  await convertPng(src, `public/images/endings/${id}.png`, 640, 640);
  meta.files.push(`/images/endings/${id}.png`);
}

// portraits
for (const id of ['theo', 'clara', 'elias', 'silas', 'troll']) {
  const src = `public/images/portraits/${id}.svg`;
  if (!fs.existsSync(src)) continue;
  await convertPng(src, `public/images/portraits/${id}.png`, 512, 512);
  meta.files.push(`/images/portraits/${id}.png`);
}

// transformation
for (let s = 0; s <= 4; s++) {
  const src = `public/images/transformation/theo_t${s}.svg`;
  if (!fs.existsSync(src)) continue;
  await convertPng(src, `public/images/transformation/theo_t${s}.png`, 512, 512);
  meta.files.push(`/images/transformation/theo_t${s}.png`);
}

// clue icons
const clueDir = path.join(root, 'public', 'images', 'clues');
if (fs.existsSync(clueDir)) {
  for (const f of fs.readdirSync(clueDir).filter((x) => x.endsWith('.svg'))) {
    const id = f.replace(/\.svg$/, '');
    await convertPng(path.join('public/images/clues', f), `public/images/clues/${id}.png`, 256, 256);
    meta.files.push(`/images/clues/${id}.png`);
  }
}

fs.writeFileSync(path.join(root, 'comfyui', 'meta', 'rasterized.json'), JSON.stringify(meta, null, 2));
console.log('rasterized', meta.files.length, 'files');
