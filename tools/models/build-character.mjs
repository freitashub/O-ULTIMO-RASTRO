#!/usr/bin/env node
/**
 * Gera os GLBs dos personagens a partir da arte fornecida (assets_fornecidos/personagens_3d) e dos specs em
 * tools/models/characters/*.mjs. Saída: godot/assets/characters/<id>/<id>.glb
 * Uso: node tools/models/build-character.mjs theo clara ...   |   node tools/models/build-character.mjs all
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildCharacter } from './lib/humanoid.mjs';

const dir = path.resolve('tools/models/characters');
const all = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).map((f) => f.replace('.mjs', '')).sort();
const wanted = process.argv.slice(2);
const ids = wanted.length === 0 || wanted[0] === 'all' ? all : wanted;
for (const id of ids) {
  const spec = (await import(path.join(dir, `${id}.mjs`))).default;
  const out = path.resolve(`godot/assets/characters/${id}/${id}.glb`);
  const r = await buildCharacter(spec, out);
  console.log(`${id}: ${(r.bytes / 1024).toFixed(0)} KB, ${r.vertices} vértices, altura ${spec.height_m} m`);
}
