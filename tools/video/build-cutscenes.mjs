#!/usr/bin/env node
/**
 * DEPRECATED (v0.4): as cutscenes passaram a rodar em engine (StageDirector, src/data/cutscenes.json
 * versão 2 com "stage"). Este montador lê o formato v1 ("shots"/"lines"/"sfx"), disponível no
 * histórico (tag v0.3.0-audiovisual-complete). Mantido apenas como referência.
 *
 * Montagem de cutscenes cinematográficas com FFmpeg a partir dos assets existentes.
 * (backgrounds, personagens, ícones) + zoom/pan (Ken Burns), xfade, vinheta, grão,
 * letterbox + mix de música/ambiência/voz/SFX. Legendas ficam a cargo do jogo.
 *
 * Saída: public/assets/video/cutscenes/<id>[.<lang>].webm (VP9+Opus) e .mp4 (H.264+AAC)
 * Uso:  node tools/video/build-cutscenes.mjs [--only opening] [--langs pt-BR,en-US,es-ES]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const pub = path.join(root, 'public');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const only = opt('--only', null);
const langs = opt('--langs', 'pt-BR,en-US,es-ES').split(',');

const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/cutscenes.json'), 'utf8'));
if (!data.cutscenes?.[0]?.shots) {
  console.error('cutscenes.json está no formato v2 (stage). Este montador de vídeo foi descontinuado; ver docs/FINAL_AUDIO_VIDEO_REPORT.md.');
  process.exit(2);
}
const voice = JSON.parse(fs.readFileSync(path.join(root, 'src/data/voiceLines.json'), 'utf8'));
const music = JSON.parse(fs.readFileSync(path.join(root, 'src/data/music.json'), 'utf8'));
const sfxMeta = JSON.parse(fs.readFileSync(path.join(root, 'src/data/sfx.json'), 'utf8'));
const ambMeta = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ambience.json'), 'utf8'));

const W = data.width, H = data.height, FPS = data.fps;
const PW = W * 2, PH = H * 2; // plate em 2x para zoompan suave
const XF = 1.0; // crossfade (s)
const OUT = path.join(pub, 'assets/video/cutscenes');
fs.mkdirSync(OUT, { recursive: true });

// cor de fundo das folhas de personagem (amostrada nos cantos) — usada só em "ghost"
const KEY_COLORS = { char_troll: '0x96a09a', char_silas: '0x88878a', char_theo: '0x6b6c73', char_clara: '0xe3eaf7', char_elias: '0xcdcbce', char_theo_t2: '0x707b8e', char_theo_t4: '0xbad5ff' };

const voiceIndex = new Map(voice.lines.map((l) => [`${l.id}|${l.lang}`, l]));
function voiceFor(id, lang) { return voiceIndex.get(`${id}|${lang}`) ?? null; }

function ff(argv, cwd) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
}
const abs = (p) => path.join(pub, p.replace(/^\//, ''));

function buildPlate(shot, out) {
  const grade = shot.warm ? ',colorbalance=rs=0.08:gs=0.02:bs=-0.08,eq=brightness=0.03' : shot.dark ? ',eq=brightness=-0.12:saturation=0.6' : '';
  if (shot.type === 'bg') {
    ff(['-i', abs(shot.image), '-vf', `scale=${PW}:${PH}:flags=lanczos${grade}`, '-frames:v', '1', out]);
  } else if (shot.type === 'figure') {
    ff(['-i', abs(shot.image), '-i', abs(shot.figure), '-filter_complex',
      `[0:v]scale=${PW}:${PH}:flags=lanczos,gblur=sigma=22,eq=brightness=-0.22:saturation=0.7${grade}[bg];` +
      `[1:v]crop=160:300:0:0,scale=-1:${Math.round(PH * 0.86)}:flags=lanczos,format=rgba,` +
      `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip(min(X,W-X)/(W*0.18),0,1)*clip(min(Y,H-Y)/(H*0.10),0,1)'[fg];` +
      `[bg][fg]overlay=x=(W-w)/2:y=(H-h)/2:format=auto`, '-frames:v', '1', out]);
  } else if (shot.type === 'ghost') {
    const key = KEY_COLORS[path.basename(shot.figure, '.webp')] ?? '0x96a09a';
    ff(['-i', abs(shot.image), '-i', abs(shot.figure), '-filter_complex',
      `[0:v]scale=${PW}:${PH}:flags=lanczos,eq=brightness=-0.15${grade}[bg];` +
      `[1:v]crop=200:720:150:0,format=rgba,colorkey=${key}:0.14:0.22,scale=-1:${Math.round(PH * 1.02)}:flags=lanczos,gblur=sigma=1.5,colorchannelmixer=aa=0.85[fg];` +
      `[bg][fg]overlay=x=W*0.66:y=-H*0.02:format=auto`, '-frames:v', '1', out]);
  } else if (shot.type === 'icon') {
    const tint = shot.tint ?? '0x0a0a12';
    const size = Math.round(PH * 0.62);
    ff(['-f', 'lavfi', '-i', `color=c=${tint}:s=${PW}x${PH}`, '-i', abs(shot.icon), '-filter_complex',
      `[1:v]scale=${size}:${size}:flags=lanczos,format=rgba[ic];[ic]split[ic1][ic2];` +
      `[ic2]gblur=sigma=60,colorchannelmixer=aa=0.55[glow];` +
      `[0:v][glow]overlay=x=(W-w)/2:y=(H-h)/2:format=auto[b1];[b1][ic1]overlay=x=(W-w)/2:y=(H-h)/2:format=auto`,
      '-frames:v', '1', out]);
  } else throw new Error(`shot type ${shot.type}`);
}

function buildSegment(shot, plate, out, len, isFirst, isLast, total) {
  const N = Math.round(len * FPS);
  const [z0, z1] = shot.zoom ?? [1, 1];
  const [cx0, cy0] = shot.from ?? [0.5, 0.5];
  const [cx1, cy1] = shot.to ?? [0.5, 0.5];
  const zoom = `zoompan=z='${z0}+(${z1}-${z0})*on/${N}':x='(iw-iw/zoom)*(${cx0}+(${cx1}-${cx0})*on/${N})':y='(ih-ih/zoom)*(${cy0}+(${cy1}-${cy0})*on/${N})':d=${N}:s=${W}x${H}:fps=${FPS}`;
  const bars = Math.round(H * 0.11);
  const vf = [zoom, 'vignette=angle=PI/4.6', 'noise=alls=7:allf=t+u',
    `drawbox=x=0:y=0:w=${W}:h=${bars}:color=black:t=fill`, `drawbox=x=0:y=${H - bars}:w=${W}:h=${bars}:color=black:t=fill`,
    isFirst ? `fade=t=in:st=0:d=1.2` : null, isLast ? `fade=t=out:st=${Math.max(0, len - 1.5)}:d=1.5` : null, 'format=yuv420p'].filter(Boolean).join(',');
  ff(['-i', plate, '-vf', vf, '-t', String(len), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', out]);
}

function buildAudio(cs, lang, total, out) {
  const inputs = []; const filters = []; const mixLabels = [];
  const add = (file, loop = false) => { if (loop) inputs.push('-stream_loop', '-1'); inputs.push('-i', file); return inputs.filter((a) => a === '-i').length - 1; };
  const trackFile = music.tracks[cs.music]?.file;
  if (trackFile) {
    const i = add(path.join(pub, 'assets/music', `${trackFile}.ogg`), true);
    filters.push(`[${i}:a]atrim=0:${total},asetpts=PTS-STARTPTS,volume=-13dB,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, total - 2.5)}:d=2.5[m]`); mixLabels.push('[m]');
  }
  if (cs.ambience && ambMeta.ambience[cs.ambience]) {
    const i = add(path.join(pub, 'assets/audio/ambience', `${cs.ambience}.ogg`), true);
    filters.push(`[${i}:a]atrim=0:${total},asetpts=PTS-STARTPTS,volume=-17dB,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0, total - 2)}:d=2[a]`); mixLabels.push('[a]');
  }
  let k = 0;
  for (const line of cs.lines ?? []) {
    const v = voiceFor(line.voice, lang) ?? voiceFor(line.voice, 'pt-BR');
    if (!v) { console.warn(`  (sem voz) ${line.voice}`); continue; }
    const i = add(path.join(pub, 'assets/audio/voice', v.lang, `${v.id}.ogg`));
    filters.push(`[${i}:a]aformat=channel_layouts=stereo,adelay=${Math.round(line.at * 1000)}:all=1,volume=0dB[v${k}]`); mixLabels.push(`[v${k}]`); k++;
  }
  for (const s of cs.sfx ?? []) {
    if (!sfxMeta.sfx[s.id]) { console.warn(`  (sem sfx) ${s.id}`); continue; }
    const i = add(path.join(pub, 'assets/audio/sfx', `${s.id}.ogg`));
    filters.push(`[${i}:a]aformat=channel_layouts=stereo,adelay=${Math.round(s.at * 1000)}:all=1,volume=${s.gain ?? -9}dB[s${k}]`); mixLabels.push(`[s${k}]`); k++;
  }
  filters.push(`${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=longest:normalize=0,atrim=0:${total},asetpts=PTS-STARTPTS,alimiter=limit=0.89,aresample=48000[mix]`);
  ff([...inputs, '-filter_complex', filters.join(';'), '-map', '[mix]', '-c:a', 'pcm_s16le', out]);
}

function buildCutscene(cs, lang) {
  const suffix = lang === 'pt-BR' ? '' : `.${lang}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `cs-${cs.id}-`));
  const shots = cs.shots; const n = shots.length;
  const total = shots.reduce((a, s) => a + s.duration, 0);
  const segs = [];
  shots.forEach((shot, i) => {
    const plate = path.join(tmp, `plate${i}.png`); buildPlate(shot, plate);
    const len = shot.duration + (i < n - 1 ? XF : 0);
    const seg = path.join(tmp, `seg${i}.mp4`); buildSegment(shot, plate, seg, len, i === 0, i === n - 1, total); segs.push(seg);
  });
  // xfade em cadeia
  const inputs = segs.flatMap((s) => ['-i', s]);
  let fc = ''; let prev = '[0:v]'; let offset = 0;
  for (let i = 1; i < n; i++) {
    offset += shots[i - 1].duration;
    const outL = i === n - 1 ? '[vout]' : `[x${i}]`;
    fc += `${prev}[${i}:v]xfade=transition=fade:duration=${XF}:offset=${offset}${outL};`; prev = outL;
  }
  const video = path.join(tmp, 'video.mp4');
  if (n === 1) fs.copyFileSync(segs[0], video);
  else ff([...inputs, '-filter_complex', fc.slice(0, -1), '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', video]);
  const audio = path.join(tmp, 'audio.wav'); buildAudio(cs, lang, total, audio);
  const webm = path.join(OUT, `${cs.id}${suffix}.webm`);
  const mp4 = path.join(OUT, `${cs.id}${suffix}.mp4`);
  ff(['-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-t', String(total), '-c:v', 'libvpx-vp9', '-crf', '33', '-b:v', '0', '-deadline', 'good', '-cpu-used', '2', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-b:a', '96k', webm]);
  ff(['-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-t', String(total), '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', mp4]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { id: cs.id, lang, total, webm: path.relative(pub, webm), mp4: path.relative(pub, mp4), bytes: fs.statSync(webm).size };
}

const results = [];
for (const cs of data.cutscenes) {
  if (only && cs.id !== only) continue;
  const csLangs = cs.localized ? langs : ['pt-BR'];
  for (const lang of csLangs) {
    if (lang !== 'pt-BR' && !(cs.lines ?? []).every((l) => voiceFor(l.voice, lang))) { console.log(`skip ${cs.id} ${lang}: sem vozes completas`); continue; }
    const t0 = Date.now();
    const r = buildCutscene(cs, lang);
    results.push(r);
    console.log(`${cs.id.padEnd(16)} ${lang}  ${r.total}s  ${(r.bytes / 1e6).toFixed(2)} MB  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
}
const metaPath = path.join(root, 'docs/video-build.json');
const prev = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
for (const r of results) prev[`${r.id}|${r.lang}`] = { ...r, builtAt: new Date().toISOString() };
fs.writeFileSync(metaPath, JSON.stringify(prev, null, 2) + '\n');
