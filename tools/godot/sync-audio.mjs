#!/usr/bin/env node
/**
 * Copia para godot/assets/audio somente os arquivos usados pelas fases já construídas e gera o catálogo
 * (godot/assets/audio/catalog.json). Regra do prompt: nada de biblioteca gigante antes da necessidade.
 * Uso: node tools/godot/sync-audio.mjs [phase=1 ...]
 */
import fs from 'node:fs';
import path from 'node:path';

const USED = {
  sfx: ['sfx_step_wood', 'sfx_step_stone', 'sfx_door_open', 'sfx_door_close', 'sfx_paper_rustle', 'ui_confirm', 'ui_hover', 'sfx_investigate', 'sfx_clue_found', 'sfx_choice_wrong'],
  ambience: ['amb_house', 'amb_interior'],
  music: [['music_phase01', 'phase01_casa_medo']]
};
const out = 'godot/assets/audio';
fs.mkdirSync(out, { recursive: true });
const catalog = {};
const copy = (id, src, dst, extra = {}) => {
  fs.copyFileSync(src, path.join(out, dst));
  catalog[id] = { file: `res://assets/audio/${dst}`, ...extra };
};
for (const id of USED.sfx) copy(id, `public/assets/audio/sfx/${id}.ogg`, `${id}.ogg`);
for (const id of USED.ambience) copy(id, `public/assets/audio/ambience/${id}.ogg`, `${id}.ogg`, { loop: true });
for (const [id, f] of USED.music) copy(id, `public/assets/music/${f}.ogg`, `${f}.ogg`, { loop: true });
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify(catalog, null, 1) + '\n');
const bytes = fs.readdirSync(out).reduce((s, f) => s + fs.statSync(path.join(out, f)).size, 0);
console.log(`audio: ${Object.keys(catalog).length} entradas, ${(bytes / 1e6).toFixed(1)} MB`);
