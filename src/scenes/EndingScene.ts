import Phaser from 'phaser';
import { EndingId } from '@/game/EndingSystem';
import { ensureImage } from '@/game/OptionalAssets';
import { t } from '@/i18n';

interface EndingSceneData {
  ending: EndingId;
}

const ENDING_KEYS: Record<EndingId, { title: string; text: string }> = {
  secret: { title: 'ending.secret.title', text: 'ending.secret.text' },
  good: { title: 'ending.good.title', text: 'ending.good.text' },
  bad: { title: 'ending.bad.title', text: 'ending.bad.text' }
};

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  async create(data: EndingSceneData): Promise<void> {
    const { width, height } = this.cameras.main;
    const ending = data?.ending ?? 'good';
    const keys = ENDING_KEYS[ending];

    this.cameras.main.setBackgroundColor('#000000');

    const artPath = `/images/endings/ending_${ending}.png`;
    await ensureImage(this, artPath, artPath);
    if (this.textures.exists(artPath)) {
      this.add.image(width / 2, height / 2 - 170, artPath).setDisplaySize(140, 140).setAlpha(0.9);
    }

    const title = this.add
      .text(width / 2, height / 2 - 80, t(keys.title), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const text = this.add
      .text(width / 2, height / 2 + 20, t(keys.text), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 1500 });
    this.tweens.add({ targets: text, alpha: 1, delay: 1500, duration: 1500 });

    const goCredits = (): void => {
      this.scene.start('CreditsScene', { from: 'EndingScene', ending });
    };

    this.time.delayedCall(5000, goCredits);
    this.time.delayedCall(3500, () => {
      this.input.once('pointerdown', goCredits);
      this.input.keyboard?.once('keydown-ENTER', goCredits);
    });
  }
}
