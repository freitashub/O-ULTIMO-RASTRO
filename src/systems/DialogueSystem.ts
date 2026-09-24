import Phaser from 'phaser';

export interface DialogueLine {
  id: string;
  character: string;
  textKey?: string;
  text?: string;
  voiceAsset?: string;
  emotion?: string;
  duration: number;
  subtitleTiming?: { startMs: number; endMs: number };
}

export type DialogueState = 'playing' | 'paused' | 'ended';

export class DialogueSystem {
  private scene: Phaser.Scene;
  private lines: DialogueLine[] = [];
  private index = 0;
  private state: DialogueState = 'ended';
  private timer: Phaser.Time.TimerEvent | null = null;
  private onLine?: (line: DialogueLine) => void;
  private onEnd?: () => void;
  private textSpeedMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(
    lines: DialogueLine[],
    callbacks: { onLine?: (line: DialogueLine) => void; onEnd?: () => void }
  ): void {
    this.lines = lines;
    this.index = 0;
    this.state = 'playing';
    this.onLine = callbacks.onLine;
    this.onEnd = callbacks.onEnd;
    this.playCurrent();
  }

  private playCurrent(): void {
    if (this.index >= this.lines.length) {
      this.state = 'ended';
      this.onEnd?.();
      return;
    }
    const line = this.lines[this.index];
    this.onLine?.(line);
    const registry = this.scene.game?.registry;
    const speed = registry?.get?.('textSpeedMs') as number | undefined;
    this.textSpeedMs = typeof speed === 'number' ? speed : 0;
    const duration = line.duration + this.textSpeedMs;
    this.timer = this.scene.time.delayedCall(duration, () => {
      this.index += 1;
      if (this.state === 'playing') this.playCurrent();
    });
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.timer?.remove(false);
    this.timer = null;
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.playCurrent();
  }

  skip(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.index = this.lines.length;
    this.state = 'ended';
    this.onEnd?.();
  }

  replay(): void {
    this.skip();
    this.state = 'playing';
    this.index = 0;
    this.playCurrent();
  }

  getState(): DialogueState {
    return this.state;
  }

  getCurrent(): DialogueLine | null {
    return this.lines[this.index] ?? null;
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.lines = [];
    this.state = 'ended';
  }
}

export function createDialogueSystem(scene: Phaser.Scene): DialogueSystem {
  return new DialogueSystem(scene);
}
