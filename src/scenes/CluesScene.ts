import Phaser from 'phaser';
import { getDiscoveredClues } from '@/game/ClueSystem';
import { ensureImage } from '@/game/OptionalAssets';
import { t } from '@/i18n';
import { Clue } from '@/types/Clue';

interface CluesSceneData {
  from?: string;
}

export class CluesScene extends Phaser.Scene {
  private fromScene = 'MenuScene';

  constructor() {
    super({ key: 'CluesScene' });
  }

  async create(data: CluesSceneData): Promise<void> {
    this.fromScene = data?.from ?? 'MenuScene';

    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    this.add
      .text(width / 2, 55, t('clues.title'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    let clues: Clue[] = [];
    try {
      clues = await getDiscoveredClues();
    } catch (err) {
      console.error('Falha ao carregar pistas:', err);
    }

    if (clues.length === 0) {
      this.add
        .text(width / 2, height / 2, t('clues.empty'), {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#666666'
        })
        .setOrigin(0.5);
    } else {
      let y = 140;
      for (const clue of clues) {
        const index = clues.indexOf(clue);
        const num = String(index + 1).padStart(2, '0');
        const iconPath = `/images/clues/${clue.id}.png`;
        await ensureImage(this, iconPath, iconPath);
        if (this.textures.exists(iconPath)) {
          this.add.image(70, y + 16, iconPath).setDisplaySize(40, 40);
        }
        this.add.text(110, y, `[${num}] ${clue.text}`, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#cccccc',
          wordWrap: { width: width - 240 }
        });
        this.add.text(110, y + 28, `Fase ${clue.phase} · ${clue.importance} · ${clue.type}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#666666'
        });
        y += 70;
      }
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
