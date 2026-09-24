import Phaser from 'phaser';

export function createDialogueBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  text: string
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: '18px',
    color: '#dddddd',
    wordWrap: { width }
  });
}
