/**
 * Build public/data/assets-manifest.json listing asset files that actually exist on disk.
 * Game scenes consult this before loading to avoid 404 console errors.
 * Never imported by game runtime tools path — game fetches /data/assets-manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const EXT = /\.(png|webp|jpg|jpeg|svg|mp3|ogg|wav|webm|mp4)$/i;

function walkDeep(dir, urlPrefix, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    const rel = base ? `${base}/${f}` : f;
    if (fs.statSync(p).isDirectory()) out.push(...walkDeep(p, urlPrefix, rel));
    else if (EXT.test(f)) out.push(`${urlPrefix}/${rel}`);
  }
  return out;
}

const images = walkDeep(path.join(publicDir, 'images'), '/images');
const assets = walkDeep(path.join(publicDir, 'assets'), '/assets');

const backgrounds = assets.filter((p) => p.startsWith('/assets/backgrounds/'));
const symbols = assets.filter((p) => p.startsWith('/assets/symbols/') && p.endsWith('.webp'));
const portraits = images.filter((p) => p.startsWith('/images/portraits/') && p.endsWith('.png'));
const clueIcons = images.filter((p) => p.startsWith('/images/clues/') && p.endsWith('.png'));
const cubeFaces = images.filter((p) => p.startsWith('/images/cube/') && p.endsWith('.png'));
const endings = images.filter((p) => p.startsWith('/images/endings/') && p.endsWith('.png'));
const transformation = images.filter((p) => p.startsWith('/images/transformation/') && p.endsWith('.png'));
const characters = assets.filter((p) => p.startsWith('/assets/characters/'));
const audio = assets.filter((p) => /\.(ogg|mp3|wav)$/i.test(p));
const video = assets.filter((p) => /\.(webm|mp4)$/i.test(p));

const manifest = {
  version: 2,
  generatedAt: new Date().toISOString(),
  backgrounds,
  symbols,
  portraits,
  clueIcons,
  cubeFaces,
  endings,
  transformation,
  characters,
  audio,
  video,
  all: [...images, ...assets]
};

const out = path.join(publicDir, 'data', 'assets-manifest.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
// also mirror to src for tests if needed
const out2 = path.join(root, 'src', 'data', 'assets-manifest.json');
fs.mkdirSync(path.dirname(out2), { recursive: true });
fs.writeFileSync(out2, JSON.stringify(manifest, null, 2));
console.log(
  'manifest:',
  'bg=' + backgrounds.length,
  'sym=' + symbols.length,
  'portrait=' + portraits.length,
  'clues=' + clueIcons.length,
  'cube=' + cubeFaces.length,
  'endings=' + endings.length,
  'tr=' + transformation.length,
  'chars=' + characters.length,
  'audio=' + audio.length,
  'video=' + video.length
);
