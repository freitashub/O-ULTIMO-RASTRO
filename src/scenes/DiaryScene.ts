import Phaser from 'phaser';
import { loadSymbols, getDiarySymbols } from '@/game/SymbolSystem';
import { ensureImage } from '@/game/OptionalAssets';
import { t } from '@/i18n';
import { SymbolData } from '@/types/Symbol';

interface DiarySceneData {
  from?: string;
}

export class DiaryScene extends Phaser.Scene {
  private fromScene = 'MenuScene';

  constructor() {
    super({ key: 'DiaryScene' });
  }

  async create(data: DiarySceneData): Promise<void> {
    this.fromScene = data?.from ?? 'MenuScene';

    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    this.add
      .text(width / 2, 55, t('diary.title'), {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    let symbols: SymbolData[] = [];
    try {
      symbols = await loadSymbols();
    } catch (err) {
      console.error('Falha ao carregar símbolos:', err);
    }

    const collected = getDiarySymbols();

    if (collected.length === 0) {
      this.add
        .text(width / 2, height / 2, t('diary.empty'), {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#666666'
        })
        .setOrigin(0.5);
    } else {
      let y = 140;
      for (const id of collected) {
        const data = symbols.find((s) => s.id === id);
        if (!data) continue;
        const index = collected.indexOf(id);

        await ensureImage(this, data.assetPath, data.assetPath);
        if (this.textures.exists(data.assetPath)) {
          this.add.image(70, y + 18, data.assetPath).setDisplaySize(48, 48);
        }

        this.add.text(110, y, `${index + 1}. [${data.id.toUpperCase()}] ${data.name}`, {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff'
        });

        this.add.text(110, y + 30, data.diaryNote, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#aaaaaa'
        });

        y += 90;
      }

      this.add.text(width - 160, 140, t('diary.orderHint'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#555555',
        align: 'right'
      });
    }

    const btn = this.add
      .text(width / 2, height - 60, t('menu.back'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const back = (): void => {
      this.scene.start(this.fromScene);
    };
    btn.on('pointerdown', back);
    this.input.keyboard?.once('keydown-ESCAPE', back);
    this.input.keyboard?.once('keydown-ENTER', back);
  }
}
