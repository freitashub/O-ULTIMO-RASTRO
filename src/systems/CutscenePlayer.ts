import Phaser from 'phaser';
import { SubtitleRenderer, createSubtitleRenderer, SubtitleCue } from '@/systems/SubtitleRenderer';
import { DialogueSystem, DialogueLine, createDialogueSystem } from '@/systems/DialogueSystem';
import { pauseVoice, playSfx, playVoice, resumeVoice, stopVoice } from '@/game/AudioManager';

export interface CutsceneStep {
  type: 'dialogue' | 'subtitle' | 'wait' | 'sfx' | 'voice' | 'camera' | 'video';
  duration?: number;
  line?: DialogueLine;
  cue?: SubtitleCue;
  key?: string;
  x?: number;
  y?: number;
  zoom?: number;
  /** passo 'video': cues de legenda sincronizadas com o áudio do vídeo */
  cues?: SubtitleCue[];
  /** passo 'video': volume (0-1) aplicado ao vídeo */
  volume?: number;
  /** passo 'video': chamado se o vídeo falhar (rede/codec) para a cena acionar o fallback */
  onError?: () => void;
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
  private video: Phaser.GameObjects.Video | null = null;
  private videoCues: SubtitleCue[] = [];
  private cueTimers: Phaser.Time.TimerEvent[] = [];

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
      case 'video':
        this.runVideo(step, advance);
        break;
      default:
        advance();
    }
  }

  private runVideo(step: CutsceneStep, done: () => void): void {
    const key = step.key ?? '';
    const cache = this.scene.cache?.video;
    if (!key || !cache || !cache.exists(key) || typeof this.scene.add?.video !== 'function') {
      done();
      return;
    }
    const { width, height } = this.scene.cameras.main;
    const video = this.scene.add.video(width / 2, height / 2, key);
    video.setDisplaySize(width, height).setDepth(50);
    if (typeof video.setVolume === 'function') video.setVolume(step.volume ?? 1);
    this.video = video;
    this.videoCues = step.cues ?? [];
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      this.clearCueTimers();
      this.destroyVideo();
      done();
    };
    const fail = (): void => {
      if (finished) return;
      finished = true;
      this.timer?.remove(false);
      this.timer = null;
      this.clearCueTimers();
      this.subtitles.clear();
      this.destroyVideo();
      if (step.onError) {
        this.state = 'ended';
        step.onError();
      } else {
        done();
      }
    };
    video.once('complete', finish);
    video.once('error', fail);
    video.once('unsupported', fail);
    this.scheduleCues(0);
    video.play(false);
    // guarda de segurança: se o vídeo não sinalizar 'complete', encerra após a duração prevista
    if (step.duration) this.timer = this.scene.time.delayedCall(step.duration + 1500, finish);
  }

  private scheduleCues(fromMs: number): void {
    this.clearCueTimers();
    for (const cue of this.videoCues) {
      if (cue.endMs <= fromMs) continue;
      const delay = Math.max(0, cue.startMs - fromMs);
      const shifted: SubtitleCue = { ...cue, startMs: Math.max(cue.startMs, fromMs), endMs: cue.endMs };
      this.cueTimers.push(this.scene.time.delayedCall(delay, () => this.subtitles.show(shifted)));
    }
  }

  private clearCueTimers(): void {
    for (const t of this.cueTimers) t.remove(false);
    this.cueTimers = [];
  }

  private destroyVideo(): void {
    if (this.video) {
      try {
        this.video.stop();
      } catch {
        /* ignore */
      }
      this.video.destroy();
      this.video = null;
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
    pauseVoice();
    if (this.video) {
      this.clearCueTimers();
      this.subtitles.clear();
      this.video.pause();
    }
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    if (this.video) {
      const ms = Math.round((this.video.getCurrentTime?.() ?? 0) * 1000);
      this.scheduleCues(ms);
      this.video.resume();
      resumeVoice();
      return;
    }
    resumeVoice();
    this.runCurrent();
  }

  skip(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.clearCueTimers();
    this.destroyVideo();
    this.dialogue.skip();
    stopVoice();
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

  isVideoPlaying(): boolean {
    return this.video !== null;
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.clearCueTimers();
    this.destroyVideo();
    this.dialogue.destroy();
    this.subtitles.destroy();
    this.steps = [];
    this.state = 'idle';
  }
}

export function createCutscenePlayer(scene: Phaser.Scene): CutscenePlayer {
  return new CutscenePlayer(scene);
}
