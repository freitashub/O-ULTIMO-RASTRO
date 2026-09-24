import Phaser from 'phaser';
import { t } from '@/i18n';
import { playMusicTrack, preloadSfx } from '@/game/SceneAudio';
import { addBackdrop, FONT_BODY, FONT_TITLE } from '@/ui/Atmosphere';
import { createAudioHud, unlockAudioOnGesture } from '@/ui/AudioHud';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#07080c');
    void addBackdrop(this, '/assets/backgrounds/phase-01-casa.webp', { darken: 0.5, weather: 'dust' });
    void preloadSfx(this, ['ui_click', 'ui_hover']);

    const title = this.add
      .text(width / 2, height / 2 - 70, t('menu.title'), {
        fontFamily: FONT_TITLE,
        fontSize: '74px',
        color: '#e8e4dc',
        letterSpacing: 10,
        shadow: { offsetX: 0, offsetY: 6, color: '#000000', blur: 24, fill: true }
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    const rule = this.add.rectangle(width / 2, height / 2 - 14, 0, 1, 0xb8a06a, 0.9).setDepth(10);

    const subtitle = this.add
      .text(width / 2, height / 2 + 22, t('title.subtitle'), {
        fontFamily: FONT_BODY,
        fontSize: '20px',
        color: '#b9b4a8',
        letterSpacing: 2
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    const prompt = this.add
      .text(width / 2, height - 96, t('title.prompt'), {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: '#8e8a80'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    const audioHint = this.add
      .text(width / 2, height - 66, t('title.audioHint'), {
        fontFamily: FONT_BODY,
        fontSize: '13px',
        color: '#6f6b63'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 1600 });
    this.tweens.add({ targets: rule, width: 360, delay: 600, duration: 1200, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 1, delay: 900, duration: 1200 });
    this.tweens.add({ targets: audioHint, alpha: 1, delay: 1400, duration: 800 });
    this.tweens.add({ targets: prompt, alpha: 1, delay: 1600, duration: 800, yoyo: true, repeat: -1 });

    createAudioHud(this);

    let started = false;
    const start = (): void => {
      if (started) return;
      started = true;
      // o primeiro gesto desbloqueia o áudio no navegador; a música só começa depois
      unlockAudioOnGesture(this, () => {
        void playMusicTrack(this, 'menu', 1500);
      });
      const sm = this.sound as Phaser.Sound.BaseSoundManager & { unlock?: () => void };
      sm.unlock?.();
      if (!this.sound.locked) void playMusicTrack(this, 'menu', 1500);
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(360, () => this.scene.start('MenuScene'));
    };

    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown', start);
  }
}
