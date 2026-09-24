import Phaser from 'phaser';
import { ActorSprite } from '@/game/ActorSprite';
import { ensureVoiceLine, playAmbienceLoop, playMusicTrack, playSfxById, voiceKey } from '@/game/SceneAudio';
import { pauseVoice, playVoice, resumeVoice, stopVoice } from '@/game/AudioManager';
import { SubtitleRenderer, createSubtitleRenderer } from '@/systems/SubtitleRenderer';
import { addBackdrop, addWeather, ensureRadialTexture, WeatherKind } from '@/ui/Atmosphere';
import { getState } from '@/game/GameState';

/**
 * Ações de uma cutscene "em engine": os mesmos cenários e sprites da jogabilidade,
 * com personagens que entram, andam e falam, câmera, luz e clima.
 */
export type StageAction =
  | { a: 'bg'; image: string | null; weather?: WeatherKind; darken?: number; light?: number }
  | { a: 'spawn'; actor: string; x: number; y: number; facing?: 1 | -1; ghost?: boolean; silhouette?: boolean; height?: number; alpha?: number }
  | { a: 'walk'; actor: string; x: number; y: number; wait?: boolean }
  | { a: 'face'; actor: string; dir: 1 | -1 }
  | { a: 'show' | 'hide'; actor: string; ms?: number }
  | { a: 'say'; voice: string; wait?: boolean }
  | { a: 'wait'; ms: number }
  | { a: 'sfx'; id: string }
  | { a: 'music'; track: string | null }
  | { a: 'ambience'; id: string | null }
  | { a: 'camera'; zoom?: number; x?: number; y?: number; ms?: number }
  | { a: 'shake'; ms?: number; intensity?: number }
  | { a: 'fade'; to: 'black' | 'in'; ms?: number }
  | { a: 'flash'; ms?: number; color?: number }
  | { a: 'light'; x: number; y: number; tint?: number; alpha?: number };

export type StageState = 'idle' | 'playing' | 'paused' | 'ended';

export class StageDirector {
  private scene: Phaser.Scene;
  private actors = new Map<string, ActorSprite>();
  private subtitles: SubtitleRenderer;
  private state: StageState = 'idle';
  private cancelled = false;
  private light: Phaser.GameObjects.Image | null = null;
  private weather: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private onEnd?: () => void;
  private pauseGate: Promise<void> | null = null;
  private releasePause: (() => void) | null = null;
  private pendingTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.subtitles = createSubtitleRenderer(scene);
  }

  getState(): StageState {
    return this.state;
  }

  async play(actions: StageAction[], onEnd?: () => void): Promise<void> {
    this.onEnd = onEnd;
    this.state = 'playing';
    this.cancelled = false;
    for (const action of actions) {
      if (this.cancelled || !this.scene.scene.isActive()) break;
      if (this.pauseGate) await this.pauseGate;
      if (this.cancelled) break;
      await this.run(action);
    }
    if (!this.cancelled) this.finish();
  }

  private finish(): void {
    if (this.state === 'ended') return;
    this.state = 'ended';
    this.subtitles.clear();
    stopVoice();
    this.onEnd?.();
  }

  /** Chamar a cada frame para animar os atores. */
  tick(dt: number): void {
    if (this.state === 'paused') return;
    for (const actor of this.actors.values()) actor.tick(dt);
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.pauseGate = new Promise<void>((resolve) => {
      this.releasePause = resolve;
    });
    this.scene.tweens.pauseAll();
    this.scene.time.paused = true;
    pauseVoice();
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.scene.tweens.resumeAll();
    this.scene.time.paused = false;
    resumeVoice();
    this.releasePause?.();
    this.pauseGate = null;
    this.releasePause = null;
  }

  skip(): void {
    this.cancelled = true;
    this.pendingTimer?.remove(false);
    this.scene.time.paused = false;
    this.releasePause?.();
    this.pauseGate = null;
    this.finish();
  }

  destroy(): void {
    this.cancelled = true;
    this.pendingTimer?.remove(false);
    this.scene.time.paused = false;
    for (const actor of this.actors.values()) actor.destroy();
    this.actors.clear();
    this.subtitles.destroy();
    this.weather?.destroy();
    this.light?.destroy();
  }

  private delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pendingTimer = this.scene.time.delayedCall(ms, () => resolve());
    });
  }

  private async run(action: StageAction): Promise<void> {
    const cam = this.scene.cameras.main;
    const { width, height } = cam;
    switch (action.a) {
      case 'bg': {
        await addBackdrop(this.scene, action.image, { zoom: false, weather: 'none', darken: action.darken ?? 0.2 });
        if (action.weather) this.weather = addWeather(this.scene, action.weather, width, height, 3);
        break;
      }
      case 'spawn': {
        const actor = new ActorSprite(this.scene, action.actor, action.x, action.y, {
          height: action.height ?? (action.actor === 'troll' ? 330 : 285),
          ghost: action.ghost,
          silhouette: action.silhouette,
          depthScale: (y) => 0.8 + 0.2 * Phaser.Math.Clamp((y - 540) / 160, 0, 1)
        });
        await actor.load();
        actor.setFacing(action.facing ?? 1);
        if (action.alpha !== undefined) actor.setAlpha(action.alpha);
        this.actors.get(action.actor)?.destroy();
        this.actors.set(action.actor, actor);
        break;
      }
      case 'walk': {
        const actor = this.actors.get(action.actor);
        if (!actor) break;
        const p = actor.walkTo(action.x, action.y);
        if (action.wait !== false) await p;
        break;
      }
      case 'face':
        this.actors.get(action.actor)?.setFacing(action.dir);
        break;
      case 'show':
      case 'hide': {
        const actor = this.actors.get(action.actor);
        if (!actor) break;
        const target = action.a === 'show' ? 1 : 0;
        if (getState().accessibilitySettings.reduceMotion || !action.ms) {
          actor.setAlpha(target);
        } else {
          this.scene.tweens.add({ targets: actor, alpha: target, duration: action.ms });
          await this.delay(action.ms);
        }
        break;
      }
      case 'say': {
        const line = await ensureVoiceLine(this.scene, action.voice);
        if (!line) break;
        playVoice(this.scene, voiceKey(line));
        this.subtitles.show({ text: line.text, speaker: line.speaker, startMs: 0, endMs: line.durationMs });
        if (action.wait !== false) await this.delay(line.durationMs + 350);
        break;
      }
      case 'wait':
        await this.delay(action.ms);
        break;
      case 'sfx':
        void playSfxById(this.scene, action.id);
        break;
      case 'music':
        void playMusicTrack(this.scene, action.track, 1200);
        break;
      case 'ambience':
        void playAmbienceLoop(this.scene, action.id);
        break;
      case 'camera': {
        const ms = action.ms ?? 1500;
        if (getState().accessibilitySettings.reduceMotion) {
          if (action.zoom) cam.setZoom(action.zoom);
          if (action.x !== undefined || action.y !== undefined) cam.centerOn(action.x ?? cam.midPoint.x, action.y ?? cam.midPoint.y);
          break;
        }
        if (action.zoom) cam.zoomTo(action.zoom, ms, 'Sine.easeInOut');
        if (action.x !== undefined || action.y !== undefined) cam.pan(action.x ?? cam.midPoint.x, action.y ?? cam.midPoint.y, ms, 'Sine.easeInOut');
        await this.delay(ms);
        break;
      }
      case 'shake':
        if (!getState().accessibilitySettings.reduceMotion) cam.shake(action.ms ?? 400, action.intensity ?? 0.006);
        break;
      case 'fade': {
        const ms = action.ms ?? 600;
        if (action.to === 'black') cam.fadeOut(ms, 0, 0, 0);
        else cam.fadeIn(ms, 0, 0, 0);
        await this.delay(ms);
        break;
      }
      case 'flash':
        cam.flash(action.ms ?? 300, ...(action.color !== undefined ? [(action.color >> 16) & 255, (action.color >> 8) & 255, action.color & 255] : [255, 255, 255]));
        break;
      case 'light': {
        const key = ensureRadialTexture(this.scene);
        this.light?.destroy();
        this.light = this.scene.add
          .image(action.x, action.y, key)
          .setDisplaySize(760, 760)
          .setTint(action.tint ?? 0xffd9a0)
          .setAlpha(action.alpha ?? 0.3)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(4);
        break;
      }
      default:
        break;
    }
  }
}
