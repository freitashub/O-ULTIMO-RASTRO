import Phaser from 'phaser';
import { ensureImage } from '@/game/OptionalAssets';
import { getState } from '@/game/GameState';
import { spritePath } from '@/game/SpriteCatalog';

export { spritePath, listSprites } from '@/game/SpriteCatalog';

export interface ActorOptions {
  /** altura em px do ator na "linha de frente" (y máximo) */
  height?: number;
  /** ator fantasmagórico (alfa oscilante, tinta fria) */
  ghost?: boolean;
  /** velocidade de caminhada (px/s) */
  speed?: number;
  /** silhueta (escurecido) */
  silhouette?: boolean;
  /** conversão de y em escala de perspectiva (0.7 no fundo → 1 na frente) */
  depthScale?: (y: number) => number;
}

/**
 * Ator 2D com rig procedural: sombra no chão, respiração ociosa, passo (bob + inclinação + squash),
 * flip horizontal, escala por profundidade e caminhada assíncrona até um ponto.
 * Sem spritesheet de animação: o movimento é gerado por código sobre um único recorte.
 */
export class ActorSprite extends Phaser.GameObjects.Container {
  readonly id: string;
  private image: Phaser.GameObjects.Image | null = null;
  private shadow: Phaser.GameObjects.Ellipse;
  private baseScale = 1;
  private facing: 1 | -1 = 1;
  private walking = false;
  private walkPhase = 0;
  private idlePhase = Math.random() * Math.PI * 2;
  private target: { x: number; y: number; resolve: () => void } | null = null;
  private opts: Required<Pick<ActorOptions, 'height' | 'speed'>> & ActorOptions;
  private stepCallback: (() => void) | null = null;
  private lastStepSign = 1;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, opts: ActorOptions = {}) {
    super(scene, x, y);
    this.id = id;
    this.opts = { height: 300, speed: 170, ...opts };
    this.shadow = scene.add.ellipse(0, 0, 90, 22, 0x000000, 0.35);
    this.add(this.shadow);
    scene.add.existing(this);
    this.setDepth(y);
  }

  /** Carrega a textura (manifest-gated). Retorna false se o sprite não existir. */
  async load(): Promise<boolean> {
    const path = spritePath(this.id);
    if (!path) return false;
    const ok = await ensureImage(this.scene, path, path);
    if (!ok || !this.scene.scene.isActive()) return false;
    const tex = this.scene.textures.get(path).getSourceImage() as { width: number; height: number };
    this.image = this.scene.add.image(0, 0, path).setOrigin(0.5, 1);
    this.baseScale = this.opts.height / tex.height;
    this.image.setScale(this.baseScale);
    this.shadow.setSize(tex.width * this.baseScale * 0.7, 22);
    if (this.opts.ghost) this.image.setTint(0xa9c6e6).setAlpha(0.75);
    if (this.opts.silhouette) this.image.setTint(0x2a2a33);
    this.add(this.image);
    this.applyDepthScale();
    return true;
  }

  hasImage(): boolean {
    return this.image !== null;
  }

  setFacing(dir: 1 | -1): this {
    this.facing = dir;
    this.image?.setFlipX(dir < 0);
    return this;
  }

  getFacing(): 1 | -1 {
    return this.facing;
  }

  onStep(cb: (() => void) | null): void {
    this.stepCallback = cb;
  }

  isWalking(): boolean {
    return this.walking;
  }

  /** Caminha até (x, y); resolve ao chegar. Uma nova chamada cancela a anterior. */
  walkTo(x: number, y: number): Promise<void> {
    this.target?.resolve();
    return new Promise<void>((resolve) => {
      this.target = { x, y, resolve };
      this.walking = true;
      if (Math.abs(x - this.x) > 2) this.setFacing(x < this.x ? -1 : 1);
    });
  }

  stop(): void {
    this.target?.resolve();
    this.target = null;
    this.walking = false;
  }

  /** Movimento direto por input (dx, dy normalizados). */
  move(dx: number, dy: number, dt: number, bounds?: { minX: number; maxX: number; minY: number; maxY: number }): void {
    this.target = null;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) {
      this.walking = false;
      return;
    }
    this.walking = true;
    const nx = dx / len;
    const ny = dy / len;
    let x = this.x + nx * this.opts.speed * dt;
    let y = this.y + ny * this.opts.speed * 0.55 * dt;
    if (bounds) {
      x = Phaser.Math.Clamp(x, bounds.minX, bounds.maxX);
      y = Phaser.Math.Clamp(y, bounds.minY, bounds.maxY);
    }
    if (Math.abs(nx) > 0.2) this.setFacing(nx < 0 ? -1 : 1);
    this.setPosition(x, y);
  }

  private applyDepthScale(): void {
    const s = this.opts.depthScale ? this.opts.depthScale(this.y) : 1;
    this.setScale(s);
    this.setDepth(this.y);
  }

  /** Chamar a cada frame (dt em segundos). */
  tick(dt: number): void {
    const reduce = getState().accessibilitySettings.reduceMotion;
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = this.opts.speed * dt;
      if (dist <= step) {
        this.setPosition(this.target.x, this.target.y);
        const r = this.target.resolve;
        this.target = null;
        this.walking = false;
        r();
      } else {
        this.setPosition(this.x + (dx / dist) * step, this.y + (dy / dist) * step);
      }
    }
    this.applyDepthScale();
    if (!this.image) return;
    if (this.walking && !reduce) {
      this.walkPhase += dt * 11;
      const s = Math.sin(this.walkPhase);
      const bob = Math.abs(s) * 6;
      this.image.setY(-bob);
      this.image.setRotation(s * 0.045 * this.facing);
      this.image.setScale(this.baseScale * (1 + Math.abs(s) * 0.02), this.baseScale * (1 - Math.abs(s) * 0.025));
      this.shadow.setScale(1 - Math.abs(s) * 0.08, 1);
      const sign = s >= 0 ? 1 : -1;
      if (sign !== this.lastStepSign) {
        this.lastStepSign = sign;
        this.stepCallback?.();
      }
    } else {
      this.idlePhase += dt * 1.6;
      const b = Math.sin(this.idlePhase);
      this.image.setY(0);
      this.image.setRotation(reduce ? 0 : b * 0.006);
      this.image.setScale(this.baseScale * (1 - b * 0.004), this.baseScale * (1 + b * 0.012));
      this.shadow.setScale(1, 1);
    }
    if (this.opts.ghost && !reduce) {
      this.image.setAlpha(0.62 + 0.18 * Math.sin(this.idlePhase * 2.3) * Math.sin(this.idlePhase * 0.7));
    }
  }
}
