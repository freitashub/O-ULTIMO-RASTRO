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

const video = [];
for (const c of cuts.cutscenes) {
  video.push(entry(`cutscene_${c.id}`, 'video', `${cuts.basePath}/${c.id}.webm`, 'video', { fallback: `${cuts.basePath}/${c.id}.mp4`, trigger: c.trigger }));
  if (c.localized) for (const lang of ['en-US', 'es-ES']) {
    const p = `${cuts.basePath}/${c.id}.${lang}.webm`;
    if (exists(p)) video.push(entry(`cutscene_${c.id}_${lang}`, 'video', p, 'video', { fallback: `${cuts.basePath}/${c.id}.${lang}.mp4`, lang }));
  }
}

const missing = [...audio, ...voicePack, ...video].filter((e) => !exists(e.path)).map((e) => e.path);
registry.packs.audio = audio;
registry.packs.voice = voicePack;
registry.packs.video = video;
registry.metadata = {
  ...registry.metadata,
  sources: { ...registry.metadata.sources, audio: 'tools/audio/{voices,music,sfx,ambience}.py', video: 'tools/video/build-cutscenes.mjs', registry: 'tools/assets/build-registry.mjs' },
  notes: 'Audio/video entries are optional and manifest-gated; voices via Kokoro/Piper (local), music/sfx/ambience procedural, cutscenes via FFmpeg.',
  updatedAt: new Date().toISOString()
};
const out = JSON.stringify(registry, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'src/data/assetRegistry.json'), out);
fs.writeFileSync(path.join(root, 'public/data/assetRegistry.json'), out);
console.log(`registry: audio=${audio.length} voice=${voicePack.length} video=${video.length} missing=${missing.length}`);
if (missing.length) console.log(missing.slice(0, 10).join('\n'));
