/**
 * Orquestração de áudio por cena: resolve ids dos catálogos (music/sfx/ambience/voice)
 * para paths, carrega sob demanda (manifest-gated) e delega ao AudioManager.
 * Único ponto onde paths de música/sfx/ambiência são montados.
 */
import Phaser from 'phaser';
import musicData from '@/data/music.json';
import sfxData from '@/data/sfx.json';
import ambienceData from '@/data/ambience.json';
import { ensureAudio } from '@/game/OptionalAssets';
import {
  fadeInMusic,
  fadeOutMusic,
  getCurrentAmbienceKey,
  getCurrentMusicKey,
  playAmbience,
  playSfx,
  playVoice,
  stopAmbience
} from '@/game/AudioManager';
import { getVoiceLine, getVoicePath, VoiceLine } from '@/game/VoiceLines';
import { Phase } from '@/types/Phase';

interface MusicShape {
  basePath: string;
  tracks: Record<string, { file: string; mood: string; loop: boolean; durationMs: number }>;
}
interface SfxShape {
  basePath: string;
  sfx: Record<string, { file: string; desc: string; durationMs: number }>;
}
interface AmbienceShape {
  basePath: string;
  ambience: Record<string, { file: string; desc: string; loop: boolean; durationMs: number }>;
}

const MUSIC = musicData as MusicShape;
const SFX = sfxData as SfxShape;
const AMB = ambienceData as AmbienceShape;

export function musicPath(trackId: string): string | null {
  const t = MUSIC.tracks[trackId];
  return t ? `${MUSIC.basePath}/${t.file}.ogg` : null;
}

export function musicTrackForPhase(phaseId: number): string {
  return `phase${String(phaseId).padStart(2, '0')}`;
}

export function sfxPath(id: string): string | null {
  const s = SFX.sfx[id];
  return s ? `${SFX.basePath}/${s.file}.ogg` : null;
}

export function ambiencePath(id: string): string | null {
  const a = AMB.ambience[id];
  return a ? `${AMB.basePath}/${a.file}.ogg` : null;
}

export function listMusicTracks(): string[] {
  return Object.keys(MUSIC.tracks);
}
export function listSfx(): string[] {
  return Object.keys(SFX.sfx);
}
export function listAmbience(): string[] {
  return Object.keys(AMB.ambience);
}

/** Troca a música com crossfade; ignora se a mesma trilha já toca. */
export async function playMusicTrack(
  scene: Phaser.Scene,
  trackId: string | null,
  fadeMs = 1200
): Promise<boolean> {
  const path = trackId ? musicPath(trackId) : null;
  if (!path) {
    fadeOutMusic(scene, fadeMs);
    return false;
  }
  if (getCurrentMusicKey() === path) return true;
  const ok = await ensureAudio(scene, path, path);
  if (!ok) {
    fadeOutMusic(scene, fadeMs);
    return false;
  }
  if (getCurrentMusicKey()) fadeOutMusic(scene, fadeMs);
  fadeInMusic(scene, path, fadeMs);
  return true;
}

/** Música por path direto (ex.: phase.music de phases.json). */
export async function playMusicPath(
  scene: Phaser.Scene,
  path: string | undefined,
  fadeMs = 1200
): Promise<boolean> {
  if (!path) {
    fadeOutMusic(scene, fadeMs);
    return false;
  }
  if (getCurrentMusicKey() === path) return true;
  const ok = await ensureAudio(scene, path, path);
  if (!ok) {
    fadeOutMusic(scene, fadeMs);
    return false;
  }
  if (getCurrentMusicKey()) fadeOutMusic(scene, fadeMs);
  fadeInMusic(scene, path, fadeMs);
  return true;
}

export async function playAmbienceLoop(
  scene: Phaser.Scene,
  idOrPath: string | null | undefined
): Promise<boolean> {
  if (!idOrPath) {
    stopAmbience();
    return false;
  }
  const path = idOrPath.startsWith('/') ? idOrPath : ambiencePath(idOrPath);
  if (!path) {
    stopAmbience();
    return false;
  }
  if (getCurrentAmbienceKey() === path) return true;
  const ok = await ensureAudio(scene, path, path);
  if (!ok) {
    stopAmbience();
    return false;
  }
  playAmbience(scene, path, true);
  return true;
}

export async function playSfxById(scene: Phaser.Scene, id: string): Promise<boolean> {
  const path = sfxPath(id);
  if (!path) return false;
  const ok = await ensureAudio(scene, path, path);
  if (!ok) return false;
  playSfx(scene, path);
  return true;
}

/** Pré-carrega SFX (sem tocar) para respostas de UI sem latência. */
export async function preloadSfx(scene: Phaser.Scene, ids: string[]): Promise<void> {
  for (const id of ids) {
    const path = sfxPath(id);
    if (path) await ensureAudio(scene, path, path);
  }
}

export interface PlayedVoice {
  line: VoiceLine;
  sound: Phaser.Sound.BaseSound | null;
}

/** Toca a linha de voz do idioma atual (fallback pt-BR). Retorna null se não houver arquivo. */
export async function playVoiceLine(scene: Phaser.Scene, lineId: string): Promise<PlayedVoice | null> {
  const line = getVoiceLine(lineId);
  if (!line) return null;
  const path = getVoicePath(line);
  const ok = await ensureAudio(scene, path, path);
  if (!ok) return null;
  return { line, sound: playVoice(scene, path) };
}

export async function ensureVoiceLine(scene: Phaser.Scene, lineId: string): Promise<VoiceLine | null> {
  const line = getVoiceLine(lineId);
  if (!line) return null;
  const path = getVoicePath(line);
  const ok = await ensureAudio(scene, path, path);
  return ok ? line : null;
}

export function voiceKey(line: VoiceLine): string {
  return getVoicePath(line);
}

/** Música + ambiência da fase (paths de phases.json). */
export async function playPhaseAudio(scene: Phaser.Scene, phase: Phase): Promise<void> {
  await playMusicPath(scene, phase.music);
  await playAmbienceLoop(scene, phase.ambience);
}
