import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import phases from '@/data/phases.json';
import manifest from '@/data/assets-manifest.json';
import { ambiencePath, listAmbience, listMusicTracks, listSfx, musicPath, musicTrackForPhase, sfxPath } from '@/game/SceneAudio';
import { audioCandidates, videoCandidates } from '@/game/OptionalAssets';
import { setAssetsManifestForTests } from '@/game/AssetsManifest';

const PUBLIC = path.join(process.cwd(), 'public');
const onDisk = (p: string): boolean => fs.existsSync(path.join(PUBLIC, p));

describe('SceneAudio catalogs', () => {
  it('every phase music and ambience path exists on disk (ogg + mp3) and in the manifest', () => {
    for (const p of phases) {
      expect(p.music).toBeTruthy();
      expect(p.ambience).toBeTruthy();
      for (const file of [p.music!, p.ambience!]) {
        expect(onDisk(file)).toBe(true);
        expect(onDisk(file.replace(/\.ogg$/, '.mp3'))).toBe(true);
        expect(manifest.audio).toContain(file);
      }
      expect(musicPath(musicTrackForPhase(p.id))).toBe(p.music);
    }
  });

  it('music, sfx and ambience catalogs resolve to real files', () => {
    expect(listMusicTracks().length).toBeGreaterThanOrEqual(32);
    expect(listSfx().length).toBeGreaterThanOrEqual(30);
    expect(listAmbience().length).toBeGreaterThanOrEqual(12);
    for (const id of listMusicTracks()) expect(onDisk(musicPath(id)!)).toBe(true);
    for (const id of listSfx()) expect(onDisk(sfxPath(id)!)).toBe(true);
    for (const id of listAmbience()) expect(onDisk(ambiencePath(id)!)).toBe(true);
    for (const id of ['menu', 'credits', 'cube', 'transformation', 'ending_good', 'ending_bad', 'ending_secret', 'chase', 'trolls', 'cave']) {
      expect(musicPath(id)).not.toBeNull();
    }
    for (const id of ['ui_click', 'sfx_door_open', 'sfx_troll_growl', 'sfx_cube_solve', 'sfx_transformation_pulse']) {
      expect(sfxPath(id)).not.toBeNull();
    }
    expect(musicPath('nope')).toBeNull();
  });

  it('audio/video candidates are manifest-gated with format fallback', () => {
    setAssetsManifestForTests({ audio: ['/a/x.ogg', '/a/x.mp3', '/a/y.mp3'], video: ['/v/c.webm'], all: [] });
    expect(audioCandidates('/a/x.ogg')).toEqual(['/a/x.ogg', '/a/x.mp3']);
    expect(audioCandidates('/a/y.ogg')).toEqual(['/a/y.mp3']);
    expect(audioCandidates('/a/z.ogg')).toEqual([]);
    expect(videoCandidates('/v/c')).toEqual(['/v/c.webm']);
    expect(videoCandidates('/v/d')).toEqual([]);
    setAssetsManifestForTests(null);
  });
});
