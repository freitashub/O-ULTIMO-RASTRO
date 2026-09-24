import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('Asset falhou ao carregar (continuando):', file.key);
    });
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
