#!/usr/bin/env node
/**
 * Validação das cutscenes: codec, resolução, fps, faixa de áudio, duração esperada (cutscenes.json),
 * tamanho, e detecção de tela preta inesperada (blackdetect > 2.5 s fora dos fades).
 * Saída: docs/video-validation.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/cutscenes.json'), 'utf8'));
const dir = path.join(root, 'public/assets/video/cutscenes');
const files = fs.readdirSync(dir).filter((f) => /\.(webm|mp4)$/.test(f)).sort();
const rows = []; const problems = [];
for (const f of files) {
  const p = path.join(dir, f);
  const id = f.replace(/\.(pt-BR|en-US|es-ES)?\.?(webm|mp4)$/, '').replace(/\.(en-US|es-ES)$/, '');
  const cs = data.cutscenes.find((c) => c.id === id);
  const expected = cs ? cs.shots.reduce((a, s) => a + s.duration, 0) : null;
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]).toString());
  const v = probe.streams.find((s) => s.codec_type === 'video'); const a = probe.streams.find((s) => s.codec_type === 'audio');
  const dur = parseFloat(probe.format.duration);
  const black = execFileSync('ffmpeg', ['-nostats', '-i', p, '-vf', 'blackdetect=d=2.5:pix_th=0.08', '-an', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const blackErr = execFileSync('sh', ['-c', `ffmpeg -nostats -i "${p}" -vf blackdetect=d=2.5:pix_th=0.08 -an -f null - 2>&1 | grep -o "black_start:[0-9.]* black_end:[0-9.]*" || true`]).toString().trim();
  const row = { file: f, codec: v?.codec_name, width: v?.width, height: v?.height, fps: v?.r_frame_rate, audio: a?.codec_name, audioRate: a?.sample_rate, durationS: +dur.toFixed(2), expectedS: expected, sizeMB: +(fs.statSync(p).size / 1e6).toFixed(2), black: blackErr || null };
  const issues = [];
  if (!v || !(v.width === data.width && v.height === data.height)) issues.push('resolução');
  if (!a) issues.push('sem áudio');
  if (expected && Math.abs(dur - expected) > 0.6) issues.push(`duração ${dur.toFixed(1)} ≠ ${expected}`);
  if (blackErr) issues.push(`tela preta: ${blackErr}`);
  if (f.endsWith('.webm') && !(v?.codec_name === 'vp9' && a?.codec_name === 'opus')) issues.push('codec webm');
  if (f.endsWith('.mp4') && !(v?.codec_name === 'h264' && a?.codec_name === 'aac')) issues.push('codec mp4');
  row.ok = issues.length === 0; if (issues.length) problems.push(`${f}: ${issues.join(', ')}`);
  rows.push(row);
  console.log(`${f.padEnd(28)} ${row.codec}/${row.audio} ${row.width}x${row.height} ${row.durationS}s (esp. ${expected}s) ${row.sizeMB}MB ${row.ok ? 'OK' : 'PROBLEMA: ' + issues.join(', ')}`);
}
fs.writeFileSync(path.join(root, 'docs/video-validation.json'), JSON.stringify({ count: rows.length, ok: rows.filter((r) => r.ok).length, problems, files: rows }, null, 1) + '\n');
console.log(`\n${rows.length} arquivos, ${rows.filter((r) => r.ok).length} ok, problemas: ${problems.length}`);
process.exit(problems.length ? 1 : 0);
