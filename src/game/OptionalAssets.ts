/**
 * Load optional image/audio/video assets by path only if they exist on disk (manifest-gated).
 * Avoids 404 console errors when assets are missing.
 */
import Phaser from 'phaser';
import { hasAssetPath, loadAssetsManifest } from '@/game/AssetsManifest';

export async function ensureImage(
  scene: Phaser.Scene,
  path: string,
  key: string = path
): Promise<boolean> {
  if (!path) return false;
  if (scene.textures.exists(key)) return true;
  await loadAssetsManifest();
  if (!hasAssetPath(path)) return false;

  await new Promise<void>((resolve) => {
    const done = (): void => resolve();
    scene.load.once('complete', done);
    scene.load.once('loaderror', done);
    scene.load.image(key, path);
    scene.load.start();
  });
  return scene.textures.exists(key);
}

/**
 * Candidatos de URL para um áudio: o path informado + irmãos de formato (ogg ↔ mp3),
 * filtrados pelo manifest. O Phaser escolhe o primeiro suportado pelo navegador.
 */
export function audioCandidates(path: string): string[] {
  const base = path.replace(/\.(ogg|mp3|wav)$/i, '');
  const candidates = [`${base}.ogg`, `${base}.mp3`];
  if (!/\.(ogg|mp3|wav)$/i.test(path)) candidates.unshift(path);
  return Array.from(new Set(candidates)).filter((p) => hasAssetPath(p));
}

export async function ensureAudio(
  scene: Phaser.Scene,
  path: string,
  key: string = path
): Promise<boolean> {
  if (!path) return false;
  if (scene.cache.audio.exists(key)) return true;
  await loadAssetsManifest();
  const urls = audioCandidates(path);
  if (urls.length === 0) return false;

  await new Promise<void>((resolve) => {
    const done = (): void => resolve();
    scene.load.once('complete', done);
    scene.load.once('loaderror', done);
    scene.load.audio(key, urls);
    scene.load.start();
  });
  return scene.cache.audio.exists(key);
}

/** Candidatos de vídeo: base.webm (VP9) + base.mp4 (H.264), filtrados pelo manifest. */
export function videoCandidates(path: string): string[] {
  const base = path.replace(/\.(webm|mp4)$/i, '');
  return [`${base}.webm`, `${base}.mp4`].filter((p) => hasAssetPath(p));
}

export async function ensureVideo(
  scene: Phaser.Scene,
  path: string,
  key: string = path
): Promise<boolean> {
  if (!path) return false;
  if (scene.cache.video.exists(key)) return true;
  await loadAssetsManifest();
  const urls = videoCandidates(path);
  if (urls.length === 0) return false;

  await new Promise<void>((resolve) => {
    const done = (): void => resolve();
    scene.load.once('complete', done);
    scene.load.once('loaderror', done);
    scene.load.video(key, urls);
    scene.load.start();
  });
  return scene.cache.video.exists(key);
}
