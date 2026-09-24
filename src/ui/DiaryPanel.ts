import Phaser from 'phaser';
import { SymbolData } from '@/types/Symbol';

export function createDiaryPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  symbols: SymbolData[]
): Phaser.GameObjects.Text[] {
  const texts: Phaser.GameObjects.Text[] = [];
  let cursorY = y;

  for (const data of symbols) {
    const title = scene.add.text(x, cursorY, `[${data.id.toUpperCase()}] ${data.name}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    });
    const note = scene.add.text(x, cursorY + 30, data.diaryNote, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa'
    });
    texts.push(title, note);
    cursorY += 90;
  }

  return texts;
}
