#!/usr/bin/env node
/**
 * Copia os dados narrativos da fonte única (src/data, src/i18n) para godot/data.
 * A versão Godot lê exatamente os mesmos JSON da versão Phaser: nunca edite godot/data/*.json à mão
 * (exceto godot/data/layouts, que é específico do 3D).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'godot/data');
fs.mkdirSync(out, { recursive: true });
const FILES = ['phases', 'clues', 'symbols', 'cubeConfig', 'voiceLines', 'sfx', 'music', 'ambience'];
for (const f of FILES) fs.copyFileSync(path.join(root, `src/data/${f}.json`), path.join(out, `${f}.json`));
fs.mkdirSync(path.join(out, 'i18n'), { recursive: true });
for (const l of ['pt-BR', 'en-US', 'es-ES']) fs.copyFileSync(path.join(root, `src/i18n/${l}.json`), path.join(out, `i18n/${l}.json`));
console.log(`godot/data sincronizado (${FILES.length} arquivos + 3 idiomas)`);
