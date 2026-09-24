import Phaser from 'phaser';
import { t } from '@/i18n';
import { startWithCutscene } from '@/scenes/CutsceneScene';
import { fadeOutMusic, stopAmbience } from '@/game/AudioManager';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');
    fadeOutMusic(this, 1200);
    stopAmbience();

    const text = this.add
      .text(width / 2, height / 2, t('intro.text'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    let advanced = false;
    const advance = (): void => {
      if (advanced) return;
      advanced = true;
      startWithCutscene(this, { type: 'beforePhase', phase: 1 }, { scene: 'StoryScene', data: { phaseId: 1 } });
    };

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 1500,
      onComplete: () => {
        this.time.delayedCall(2500, advance);
      }
    });

    this.input.once('pointerdown', advance);
    this.input.keyboard?.once('keydown', advance);
  }
}
