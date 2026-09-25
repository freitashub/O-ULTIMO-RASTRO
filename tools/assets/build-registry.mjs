/**
 * Regenera os packs `audio`, `voice` e `video` de src/data/assetRegistry.json (e espelho em public/data)
 * a partir dos catálogos gerados (music/sfx/ambience/voiceLines/cutscenes). Packs `core` e `images`
 * são preservados. Todas as entradas audiovisuais são opcionais (manifest-gated no runtime).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = read('src/data/assetRegistry.json');
const music = read('src/data/music.json');
const sfx = read('src/data/sfx.json');
const amb = read('src/data/ambience.json');
const voice = read('src/data/voiceLines.json');
const cuts = read('src/data/cutscenes.json');
const exists = (p) => fs.existsSync(path.join(root, 'public', p.replace(/^\//, '')));

const entry = (id, kind, p, pack, extra = {}) => ({ id, kind, path: p, pack, optional: true, preload: false, ...extra });

// aliases históricos (ids já referenciados no código/testes) → arquivos reais
const ALIASES = {
  bgm_main: 'menu', bgm_tension: 'suspense', bgm_credits: 'credits'
};
const SFX_ALIASES = { sfx_choice: 'ui_confirm', sfx_puzzle_ok: 'sfx_cube_solve', sfx_puzzle_fail: 'sfx_cube_fail' };
const AMB_ALIASES = { amb_room: 'amb_interior' };

const audio = [];
for (const [alias, track] of Object.entries(ALIASES)) audio.push(entry(alias, 'audio', `${music.basePath}/${music.tracks[track].file}.ogg`, 'audio', { alias: `music:${track}` }));
for (const [id, t] of Object.entries(music.tracks)) audio.push(entry(`music_${id}`, 'audio', `${music.basePath}/${t.file}.ogg`, 'audio', { loop: t.loop, durationMs: t.durationMs }));
for (const [id, s] of Object.entries(sfx.sfx)) audio.push(entry(id, 'audio', `${sfx.basePath}/${s.file}.ogg`, 'audio', { durationMs: s.durationMs }));
for (const [alias, id] of Object.entries(SFX_ALIASES)) audio.push(entry(alias, 'audio', `${sfx.basePath}/${sfx.sfx[id].file}.ogg`, 'audio', { alias: id }));
for (const [id, a] of Object.entries(amb.ambience)) audio.push(entry(id, 'audio', `${amb.basePath}/${a.file}.ogg`, 'audio', { loop: true, durationMs: a.durationMs }));
for (const [alias, id] of Object.entries(AMB_ALIASES)) audio.push(entry(alias, 'audio', `${amb.basePath}/${amb.ambience[id].file}.ogg`, 'audio', { alias: id }));

const voicePack = voice.lines.map((l) => entry(`voice_${l.lang}_${l.id}`, 'audio', `${voice.basePath}/${l.lang}/${l.id}.ogg`, 'voice', { speaker: l.speaker, lang: l.lang, durationMs: l.durationMs }));
// aliases históricos
voicePack.unshift(
  entry('voice_theo_01', 'audio', `${voice.basePath}/pt-BR/theo_q1.ogg`, 'voice', { alias: 'theo_q1' }),
  entry('voice_clara_01', 'audio', `${voice.basePath}/pt-BR/phase07_clara_02.ogg`, 'voice', { alias: 'phase07_clara_02' }),
  entry('voice_narrator_01', 'audio', `${voice.basePath}/pt-BR/intro_text.ogg`, 'voice', { alias: 'intro_text' })
);

// v0.4: cutscenes rodam em engine (sem arquivos de vídeo). Só entra no pack o que existir em disco.
const video = [];
// cutscenes externas (Google Flow) em public/cutscenes/<id>[.<lang>].webm|mp4
const videoBase = '/cutscenes';
for (const c of cuts.cutscenes) {
  for (const suffix of ['', '.en-US', '.es-ES']) {
    const webm = `${videoBase}/${c.id}${suffix}.webm`;
    const mp4 = `${videoBase}/${c.id}${suffix}.mp4`;
    const p = exists(webm) ? webm : exists(mp4) ? mp4 : null;
    if (p) video.push(entry(`cutscene_${c.id}${suffix.replace('.', '_')}`, 'video', p, 'video', { fallback: exists(mp4) && p !== mp4 ? mp4 : undefined, trigger: c.trigger }));
  }
}
// modelos 3D (GLB) do runtime espacial
const modelsDir = path.join(root, 'public/assets/models');
const modelPack = fs.existsSync(modelsDir) ? fs.readdirSync(modelsDir).filter((f) => /\.(glb|gltf)$/i.test(f)).map((f) => entry(`model_${f.replace(/\.(glb|gltf)$/i, '')}`, 'model', `/assets/models/${f}`, 'models')) : [];
// sprites recortados (public/assets/sprites) — opcionais, carregados sob demanda pelo ActorSprite
const spritesMeta = fs.existsSync(path.join(root, 'src/data/sprites.json')) ? read('src/data/sprites.json') : { basePath: '/assets/sprites', sprites: {} };
const spritePack = Object.entries(spritesMeta.sprites).map(([id, s]) => entry(`sprite_${id}`, 'image', `${spritesMeta.basePath}/${s.file}`, 'sprites', { width: s.width, height: s.height }));

const missing = [...audio, ...voicePack, ...video, ...spritePack].filter((e) => !exists(e.path)).map((e) => e.path);
registry.packs.audio = audio;
registry.packs.voice = voicePack;
registry.packs.video = video;
registry.packs.sprites = spritePack;
registry.packs.models = modelPack;
registry.metadata = {
  ...registry.metadata,
  sources: { ...registry.metadata.sources, audio: 'tools/audio/{voices,music,sfx,ambience}.py', video: 'tools/video/build-cutscenes.mjs', registry: 'tools/assets/build-registry.mjs' },
  notes: 'Audio/video entries are optional and manifest-gated; voices via Kokoro/Piper (local), music/sfx/ambience procedural, cutscenes via FFmpeg.',
  updatedAt: new Date().toISOString()
};
const out = JSON.stringify(registry, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'src/data/assetRegistry.json'), out);
fs.writeFileSync(path.join(root, 'public/data/assetRegistry.json'), out);
console.log(`registry: audio=${audio.length} voice=${voicePack.length} video=${video.length} sprites=${spritePack.length} models=${modelPack.length} missing=${missing.length}`);
if (missing.length) console.log(missing.slice(0, 10).join('\n'));
