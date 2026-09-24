import Phaser from 'phaser';

export interface PhaseHeaderOptions {
  phaseId: number;
  title: string;
}

export function createPhaseHeader(
  scene: Phaser.Scene,
  options: PhaseHeaderOptions
): Phaser.GameObjects.Text {
  return scene.add.text(40, 40, `FASE ${options.phaseId} — ${options.title}`, {
    fontFamily: 'monospace',
    fontSize: '20px',
    color: '#ffffff'
  });
}
