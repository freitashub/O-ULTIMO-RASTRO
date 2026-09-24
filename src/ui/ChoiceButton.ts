import Phaser from 'phaser';

export interface ChoiceButtonOptions {
  x: number;
  y: number;
  width: number;
  label: string;
  onClick: () => void;
}

export function createChoiceButton(
  scene: Phaser.Scene,
  options: ChoiceButtonOptions
): Phaser.GameObjects.Text {
  const btn = scene.add
    .text(options.x, options.y, options.label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#dddddd',
      backgroundColor: '#1a1a22',
      padding: { x: 24, y: 16 },
      fixedWidth: options.width,
      align: 'center'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => btn.setColor('#ffffff'));
  btn.on('pointerout', () => btn.setColor('#dddddd'));
  btn.on('pointerdown', options.onClick);

  return btn;
}
