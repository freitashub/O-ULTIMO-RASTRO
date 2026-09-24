import Phaser from 'phaser';
import { Clue } from '@/types/Clue';

export function createCluePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  clues: Clue[]
): Phaser.GameObjects.Text[] {
  const texts: Phaser.GameObjects.Text[] = [];
  let cursorY = y;

  for (const clue of clues) {
    const label = scene.add.text(x, cursorY, `[F${clue.phase}] ${clue.text}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#cccccc',
      wordWrap: { width: 1000 }
    });
    texts.push(label);
    cursorY += 40;
  }

  return texts;
}
