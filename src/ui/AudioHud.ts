import Phaser from 'phaser';
import { isMuted, toggleMute } from '@/game/AudioManager';
import { getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { FONT_BODY } from '@/ui/Atmosphere';
import { t } from '@/i18n';

/**
 * Indicador/controle de áudio presente em todas as cenas:
 * - mostra se o áudio está bloqueado pelo navegador (aguardando gesto), ativo ou mudo;
 * - clique alterna mudo e persiste no save.
 */
export function createAudioHud(scene: Phaser.Scene, depth = 500): Phaser.GameObjects.Container {
  const { width } = scene.cameras.main;
  const container = scene.add.container(width - 26, 26).setDepth(depth).setScrollFactor(0);
  const bg = scene.add.circle(0, 0, 18, 0x000000, 0.45).setStrokeStyle(1, 0x555566, 0.8);
  const icon = scene.add.graphics();
  const label = scene.add
    .text(-30, 0, '', { fontFamily: FONT_BODY, fontSize: '12px', color: '#9aa0b0' })
    .setOrigin(1, 0.5)
    .setAlpha(0.9);
  container.add([bg, icon, label]);

  const draw = (): void => {
    icon.clear();
    const locked = scene.sound.locked;
    const muted = isMuted();
    const color = locked ? 0xd9a441 : muted ? 0x7a7a88 : 0xd8dde8;
    icon.fillStyle(color, 1);
    // alto-falante
    icon.fillRect(-9, -4, 5, 8);
    icon.fillTriangle(-4, -4, 3, -9, 3, 9);
    icon.fillTriangle(-4, 4, 3, 9, 3, -9);
    icon.lineStyle(2, color, 1);
    if (muted) {
      icon.lineBetween(5, -6, 11, 6);
      icon.lineBetween(11, -6, 5, 6);
    } else if (!locked) {
      icon.beginPath();
      icon.arc(3, 0, 7, -0.9, 0.9);
      icon.strokePath();
      icon.beginPath();
      icon.arc(3, 0, 11, -0.9, 0.9);
      icon.strokePath();
    }
    label.setText(locked ? t('audio.locked') : muted ? t('audio.muted') : '');
  };
  draw();

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event?: Phaser.Types.Input.EventData) => {
    event?.stopPropagation?.();
    toggleMute();
    void saveGame(getState());
    draw();
  });
  const onUnlock = (): void => draw();
  scene.sound.once('unlocked', onUnlock);
  scene.events.once('shutdown', () => {
    scene.sound.off('unlocked', onUnlock);
  });
  return container;
}

/** Desbloqueia o contexto de áudio no primeiro gesto do usuário (política dos navegadores). */
export function unlockAudioOnGesture(scene: Phaser.Scene, onUnlocked?: () => void): void {
  if (!scene.sound.locked) {
    onUnlocked?.();
    return;
  }
  const done = (): void => {
    onUnlocked?.();
  };
  scene.sound.once('unlocked', done);
  const tryUnlock = (): void => {
    const sm = scene.sound as Phaser.Sound.BaseSoundManager & { unlock?: () => void };
    sm.unlock?.();
  };
  scene.input.once('pointerdown', tryUnlock);
  scene.input.keyboard?.once('keydown', tryUnlock);
}
