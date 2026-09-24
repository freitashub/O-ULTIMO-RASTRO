import Phaser from 'phaser';
import { getPreloadEntries, AssetEntry } from '@/game/AssetRegistry';
import { t } from '@/i18n';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bar = this.add.rectangle(width / 2, height / 2, 0, 20, 0xffffff);
    bar.setOrigin(0, 0.5);
    bar.x = width / 2 - 200;

    const text = this.add.text(width / 2, height / 2 - 40, t('loading'), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    });
    text.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 400 * value;
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('Asset falhou ao carregar (continuando):', file.key);
    });

    this.load.on('complete', () => {
      bar.destroy();
      text.destroy();
    });

    for (const entry of getPreloadEntries()) {
      this.loadEntry(entry);
    }
  }

  private loadEntry(entry: AssetEntry): void {
    switch (entry.kind) {
      case 'json':
        this.load.json(entry.id, entry.path);
        break;
      case 'image':
        this.load.image(entry.id, entry.path);
        break;
      case 'audio':
        this.load.audio(entry.id, entry.path);
        break;
      case 'atlas':
        break;
      case 'font':
        break;
      default:
        break;
    }
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
