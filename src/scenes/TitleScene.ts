import Phaser from 'phaser';
import { t } from '@/i18n';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    const title = this.add
      .text(width / 2, height / 2 - 60, t('menu.title'), {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const subtitle = this.add
      .text(width / 2, height / 2 + 20, t('title.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#888888'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const prompt = this.add
      .text(width / 2, height - 100, t('title.prompt'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#666666'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 1500 });
    this.tweens.add({ targets: subtitle, alpha: 1, delay: 800, duration: 1200 });
    this.tweens.add({
      targets: prompt,
      alpha: 1,
      delay: 1600,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const start = (): void => {
      this.scene.start('MenuScene');
    };

    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown', start);
  }
}
