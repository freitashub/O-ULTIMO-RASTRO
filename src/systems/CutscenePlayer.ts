import Phaser from 'phaser';
import { SubtitleRenderer, createSubtitleRenderer, SubtitleCue } from '@/systems/SubtitleRenderer';
import { DialogueSystem, DialogueLine, createDialogueSystem } from '@/systems/DialogueSystem';
import { playSfx, playVoice } from '@/game/AudioManager';

export interface CutsceneStep {
  type: 'dialogue' | 'subtitle' | 'wait' | 'sfx' | 'voice' | 'camera';
  duration?: number;
  line?: DialogueLine;
  cue?: SubtitleCue;
  key?: string;
  x?: number;
  y?: number;
  zoom?: number;
}

export type CutsceneState = 'idle' | 'playing' | 'paused' | 'ended';

export class CutscenePlayer {
  private scene: Phaser.Scene;
  private steps: CutsceneStep[] = [];
  private index = 0;
  private state: CutsceneState = 'idle';
  private timer: Phaser.Time.TimerEvent | null = null;
  private subtitles: SubtitleRenderer;
  private dialogue: DialogueSystem;
  private onStep?: (step: CutsceneStep, index: number) => void;
  private onEnd?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.subtitles = createSubtitleRenderer(scene);
    this.dialogue = createDialogueSystem(scene);
  }

  play(
    steps: CutsceneStep[],
    callbacks: {
      onStep?: (step: CutsceneStep, index: number) => void;
      onEnd?: () => void;
    } = {}
  ): void {
    this.steps = steps;
    this.index = 0;
    this.state = 'playing';
    this.onStep = callbacks.onStep;
    this.onEnd = callbacks.onEnd;
    this.runCurrent();
  }

  private runCurrent(): void {
    if (this.index >= this.steps.length) {
      this.finish();
      return;
    }
    if (this.state !== 'playing') return;

    const step = this.steps[this.index];
    this.onStep?.(step, this.index);

    const advance = (): void => {
      if (this.state !== 'playing') return;
      this.index += 1;
      this.runCurrent();
    };

    switch (step.type) {
      case 'sfx':
        if (step.key) playSfx(this.scene, step.key);
        advance();
        break;
      case 'voice':
        if (step.key) playVoice(this.scene, step.key);
        this.timer = this.scene.time.delayedCall(step.duration ?? 500, advance);
        break;
      case 'subtitle':
        if (step.cue) this.subtitles.show(step.cue);
        this.timer = this.scene.time.delayedCall(
          step.duration ?? Math.max(500, (step.cue?.endMs ?? 1000) - (step.cue?.startMs ?? 0)),
          advance
        );
        break;
      case 'dialogue':
        if (step.line) {
          if (step.line.voiceAsset) playVoice(this.scene, step.line.voiceAsset);
          this.dialogue.play([step.line], {
            onLine: (line) => {
              this.subtitles.show({
                text: line.text,
                textKey: line.textKey,
                speaker: line.character,
                startMs: 0,
                endMs: line.duration,
                voiceAsset: line.voiceAsset
              });
            },
            onEnd: advance
          });
        } else {
          advance();
        }
        break;
      case 'wait':
        this.timer = this.scene.time.delayedCall(step.duration ?? 1000, advance);
        break;
      case 'camera':
        this.applyCamera(step, advance);
        break;
      default:
        advance();
    }
  }

  private applyCamera(step: CutsceneStep, done: () => void): void {
    const cam = this.scene.cameras.main;
    const duration = step.duration ?? 800;
    const targetX = step.x ?? cam.scrollX;
    const targetY = step.y ?? cam.scrollY;
    const targetZoom = step.zoom ?? cam.zoom;

    const proxy = { x: cam.scrollX, y: cam.scrollY, zoom: cam.zoom };
    this.scene.tweens.add({
      targets: proxy,
      x: targetX,
      y: targetY,
      zoom: targetZoom,
      duration,
      onUpdate: () => {
        cam.scrollX = proxy.x;
        cam.scrollY = proxy.y;
        cam.zoom = proxy.zoom;
      },
      onComplete: done
    });
  }

  private finish(): void {
    this.state = 'ended';
    this.subtitles.clear();
    this.onEnd?.();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.timer?.remove(false);
    this.timer = null;
    this.dialogue.pause();
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.runCurrent();
  }

  skip(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.dialogue.skip();
    this.subtitles.clear();
    this.state = 'ended';
    this.onEnd?.();
  }

  getState(): CutsceneState {
    return this.state;
  }

  getCurrentIndex(): number {
    return this.index;
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.dialogue.destroy();
    this.subtitles.destroy();
    this.steps = [];
    this.state = 'idle';
  }
}

export function createCutscenePlayer(scene: Phaser.Scene): CutscenePlayer {
  return new CutscenePlayer(scene);
}
