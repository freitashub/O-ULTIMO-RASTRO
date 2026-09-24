/**
 * Load optional image/audio assets by path only if they exist on disk (manifest-gated).
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

export async function ensureAudio(
  scene: Phaser.Scene,
  path: string,
  key: string = path
): Promise<boolean> {
  if (!path) return false;
  if (scene.cache.audio.exists(key)) return true;
  await loadAssetsManifest();
  if (!hasAssetPath(path)) return false;

  await new Promise<void>((resolve) => {
    const done = (): void => resolve();
    scene.load.once('complete', done);
    scene.load.once('loaderror', done);
    scene.load.audio(key, path);
    scene.load.start();
  });
  return scene.cache.audio.exists(key);
}
