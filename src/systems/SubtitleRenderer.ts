import Phaser from 'phaser';
import { getState } from '@/game/GameState';
import { t } from '@/i18n';

export interface SubtitleCue {
  textKey?: string;
  text?: string;
  speaker?: string;
  startMs: number;
  endMs: number;
  voiceAsset?: string;
}

export class SubtitleRenderer {
  private scene: Phaser.Scene;
  private textObject: Phaser.GameObjects.Text | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(cue: SubtitleCue): void {
    const settings = getState().subtitleSettings;
    if (!settings.enabled) return;

    this.clear();

    const raw = cue.textKey ? t(cue.textKey) : (cue.text ?? '');
    const speaker = cue.speaker ? `${t(`subtitle.speaker.${cue.speaker}`)}: ` : '';
    const content = `${speaker}${raw}`;

    const { width, height } = this.scene.cameras.main;
    const y = settings.position === 'top' ? 60 : height - 80;

    if (settings.background) {
      this.background = this.scene.add
        .rectangle(width / 2, y, Math.min(width - 80, 900), 48, 0x000000, 0.7)
        .setDepth(1000)
        .setOrigin(0.5);
    }

    this.textObject = this.scene.add
      .text(width / 2, y, content, {
        fontFamily: 'monospace',
        fontSize: `${settings.fontSize}px`,
        color: getState().accessibilitySettings.highContrast ? '#ffffff' : '#eeeeee',
        align: 'center',
        wordWrap: { width: width - 120 }
      })
      .setOrigin(0.5)
      .setDepth(1001);

    const duration = Math.max(500, cue.endMs - cue.startMs);
    this.timer = this.scene.time.delayedCall(duration, () => this.clear());
  }

  clear(): void {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
    this.textObject?.destroy();
    this.background?.destroy();
    this.textObject = null;
    this.background = null;
  }

  isEnabled(): boolean {
    return getState().subtitleSettings.enabled;
  }

  destroy(): void {
    this.clear();
  }
}

export function createSubtitleRenderer(scene: Phaser.Scene): SubtitleRenderer {
  return new SubtitleRenderer(scene);
}
