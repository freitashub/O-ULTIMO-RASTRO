import Phaser from 'phaser';
import { ensureImage } from '@/game/OptionalAssets';
import { getState } from '@/game/GameState';

/**
 * Elementos atmosféricos reutilizáveis: fundo com zoom lento, vinheta radial,
 * chuva/poeira/névoa em partículas e "luz" radial. Todas as texturas são geradas
 * em runtime (sem assets extras).
 */

export function ensureRadialTexture(scene: Phaser.Scene, key = 'fx-radial', size = 256): string {
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, size, size);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  return key;
}

export function ensureVignetteTexture(scene: Phaser.Scene, key = 'fx-vignette', w = 640, h = 360): string {
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  canvas.refresh();
  return key;
}

export function ensureParticleTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('fx-drop')) {
    const g = scene.add.graphics();
    g.fillStyle(0xbfd4ff, 1);
    g.fillRect(0, 0, 2, 14);
    g.generateTexture('fx-drop', 2, 14);
    g.destroy();
  }
  if (!scene.textures.exists('fx-dot')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('fx-dot', 6, 6);
    g.destroy();
  }
  if (!scene.textures.exists('fx-fog')) {
    const canvas = scene.textures.createCanvas('fx-fog', 192, 96);
    if (canvas) {
      const ctx = canvas.getContext();
      const g = ctx.createRadialGradient(96, 48, 4, 96, 48, 90);
      g.addColorStop(0, 'rgba(220,225,235,0.55)');
      g.addColorStop(1, 'rgba(220,225,235,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 192, 96);
      canvas.refresh();
    }
  }
}

export type WeatherKind = 'rain' | 'dust' | 'fog' | 'embers' | 'snowdust' | 'none';

export function addWeather(
  scene: Phaser.Scene,
  kind: WeatherKind,
  width: number,
  height: number,
  depth = 30
): Phaser.GameObjects.Particles.ParticleEmitter | null {
  if (kind === 'none' || getState().accessibilitySettings.reduceMotion) return null;
  ensureParticleTextures(scene);
  let emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  switch (kind) {
    case 'rain':
      emitter = scene.add.particles(0, 0, 'fx-drop', {
        x: { min: -100, max: width + 100 },
        y: -20,
        lifespan: 1100,
        speedY: { min: 650, max: 900 },
        speedX: { min: -60, max: -30 },
        scaleY: { min: 0.8, max: 1.6 },
        alpha: { start: 0.55, end: 0.15 },
        quantity: 4,
        frequency: 18,
        rotate: -4
      });
      break;
    case 'dust':
      emitter = scene.add.particles(0, 0, 'fx-dot', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: 6000,
        speedX: { min: -8, max: 8 },
        speedY: { min: -6, max: 6 },
        scale: { start: 0.15, end: 0.4 },
        alpha: { start: 0, end: 0.35, ease: 'Sine.easeInOut' },
        quantity: 1,
        frequency: 220
      });
      break;
    case 'fog':
      emitter = scene.add.particles(0, 0, 'fx-fog', {
        x: { min: -150, max: width + 150 },
        y: { min: height * 0.45, max: height + 20 },
        lifespan: 9000,
        speedX: { min: 10, max: 28 },
        speedY: { min: -3, max: 3 },
        scale: { start: 1.2, end: 2.4 },
        alpha: { start: 0, end: 0.22, ease: 'Sine.easeInOut' },
        quantity: 1,
        frequency: 500
      });
      break;
    case 'embers':
      emitter = scene.add.particles(0, 0, 'fx-dot', {
        x: { min: width * 0.3, max: width * 0.8 },
        y: height * 0.75,
        lifespan: 2600,
        speedY: { min: -90, max: -40 },
        speedX: { min: -25, max: 25 },
        scale: { start: 0.35, end: 0 },
        tint: [0xffb347, 0xff6a2b, 0xffd27f],
        alpha: { start: 0.9, end: 0 },
        quantity: 1,
        frequency: 90
      });
      break;
    default:
      emitter = scene.add.particles(0, 0, 'fx-dot', {
        x: { min: 0, max: width },
        y: -10,
        lifespan: 7000,
        speedY: { min: 15, max: 35 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.2, end: 0.3 },
        alpha: { start: 0.3, end: 0 },
        quantity: 1,
        frequency: 160
      });
  }
  emitter.setDepth(depth);
  return emitter;
}

export interface BackdropOptions {
  darken?: number;
  zoom?: boolean;
  weather?: WeatherKind;
  vignette?: boolean;
}

/** Fundo de cena (imagem opcional, manifest-gated) + vinheta + clima. */
export async function addBackdrop(
  scene: Phaser.Scene,
  imagePath: string | null,
  opts: BackdropOptions = {}
): Promise<Phaser.GameObjects.Image | null> {
  const { width, height } = scene.cameras.main;
  let image: Phaser.GameObjects.Image | null = null;
  if (imagePath && (await ensureImage(scene, imagePath, imagePath)) && scene.scene.isActive()) {
    image = scene.add.image(width / 2, height / 2, imagePath).setDepth(0);
    const tex = scene.textures.get(imagePath).getSourceImage() as { width: number; height: number };
    const base = Math.max(width / tex.width, height / tex.height) * 1.06;
    image.setScale(base);
    if (opts.zoom !== false && !getState().accessibilitySettings.reduceMotion) {
      scene.tweens.add({
        targets: image,
        scale: base * 1.08,
        x: width / 2 - 14,
        duration: 26000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  if (!scene.scene.isActive()) return image;
  if (opts.darken && opts.darken > 0) {
    scene.add.rectangle(width / 2, height / 2, width, height, 0x05060a, opts.darken).setDepth(1);
  }
  if (opts.vignette !== false) {
    const key = ensureVignetteTexture(scene);
    scene.add.image(width / 2, height / 2, key).setDisplaySize(width, height).setDepth(2);
  }
  if (opts.weather) addWeather(scene, opts.weather, width, height, 3);
  return image;
}

export const FONT_TITLE = 'Georgia, "Times New Roman", "DejaVu Serif", serif';
export const FONT_BODY = '"Segoe UI", Roboto, "Helvetica Neue", "DejaVu Sans", Arial, sans-serif';
export const FONT_MONO = 'Consolas, "DejaVu Sans Mono", monospace';
