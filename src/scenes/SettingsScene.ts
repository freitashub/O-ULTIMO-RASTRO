import Phaser from 'phaser';
import { getState, setState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { t } from '@/i18n';
import { playSfx, setChannelVolume, setMasterVolume, toggleMute } from '@/game/AudioManager';
import { preloadSfx, sfxPath } from '@/game/SceneAudio';

interface SettingsSceneData {
  from?: string;
  tab?: 'audio' | 'subtitles' | 'accessibility';
}

export class SettingsScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private tab: 'audio' | 'subtitles' | 'accessibility' = 'audio';
  private statusText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(data: SettingsSceneData): void {
    void preloadSfx(this, ['ui_click']);
    this.fromScene = data?.from ?? 'MenuScene';
    this.tab = data?.tab ?? 'audio';

    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    this.add
      .text(width / 2, 50, t('menu.settings'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const tabs: Array<{ id: 'audio' | 'subtitles' | 'accessibility'; label: string }> = [
      { id: 'audio', label: t('menu.audio') },
      { id: 'subtitles', label: t('menu.subtitles') },
      { id: 'accessibility', label: t('menu.accessibility') }
    ];

    tabs.forEach((tab, i) => {
      const btn = this.add
        .text(width / 2 - 220 + i * 220, 100, tab.label, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: tab.id === this.tab ? '#ffffff' : '#777777',
          backgroundColor: '#14141c',
          padding: { x: 16, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.restart({ from: this.fromScene, tab: tab.id });
      });
    });

    let y = 160;
    const state = getState();

    const addSlider = (
      label: string,
      get: () => number,
      set: (v: number) => void
    ): void => {
      this.add.text(width / 2 - 400, y, `${label}: ${Math.round(get() * 100)}%`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cccccc'
      });
      const dec = this.add
        .text(width / 2 + 100, y, '−', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 12, y: 4 }
        })
        .setInteractive({ useHandCursor: true });
      const inc = this.add
        .text(width / 2 + 160, y, '+', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 12, y: 4 }
        })
        .setInteractive({ useHandCursor: true });
      dec.on('pointerdown', () => {
        set(Math.max(0, Math.round((get() - 0.1) * 10) / 10));
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      inc.on('pointerdown', () => {
        set(Math.min(1, Math.round((get() + 0.1) * 10) / 10));
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      y += 50;
    };

    const addToggle = (label: string, get: () => boolean, set: (v: boolean) => void): void => {
      const btn = this.add
        .text(width / 2 - 200, y, `${label}: ${get() ? 'ON' : 'OFF'}`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: get() ? '#88ff88' : '#999999',
          backgroundColor: '#14141c',
          padding: { x: 16, y: 8 }
        })
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        set(!get());
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      y += 50;
    };

    if (this.tab === 'audio') {
      addSlider(t('settings.masterVolume'), () => state.audioSettings.masterVolume, (v) => {
        setMasterVolume(v);
      });
      addSlider(t('settings.musicVolume'), () => state.audioSettings.musicVolume, (v) => {
        setChannelVolume('music', v);
      });
      addSlider(t('settings.ambienceVolume'), () => state.audioSettings.ambienceVolume, (v) => {
        setChannelVolume('ambience', v);
      });
      addSlider(t('settings.sfxVolume'), () => state.audioSettings.sfxVolume, (v) => {
        setChannelVolume('sfx', v);
      });
      addSlider(t('settings.voiceVolume'), () => state.audioSettings.voiceVolume, (v) => {
        setChannelVolume('voice', v);
      });
      addToggle(t('settings.muted'), () => state.audioSettings.muted, () => {
        toggleMute();
      });
    } else if (this.tab === 'subtitles') {
      addToggle(
        t('settings.subtitlesOn'),
        () => state.subtitleSettings.enabled,
        (v) => {
          state.subtitleSettings.enabled = v;
        }
      );
      addToggle('Background', () => state.subtitleSettings.background, (v) => {
        state.subtitleSettings.background = v;
      });
      this.add.text(
        width / 2 - 400,
        y,
        `${t('settings.subtitleSize')}: ${state.subtitleSettings.fontSize}px`,
        { fontFamily: 'monospace', fontSize: '16px', color: '#cccccc' }
      );
      const smaller = this.add
        .text(width / 2 + 100, y, 'A−', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 10, y: 4 }
        })
        .setInteractive({ useHandCursor: true });
      const bigger = this.add
        .text(width / 2 + 160, y, 'A+', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 10, y: 4 }
        })
        .setInteractive({ useHandCursor: true });
      smaller.on('pointerdown', () => {
        state.subtitleSettings.fontSize = Math.max(12, state.subtitleSettings.fontSize - 2);
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      bigger.on('pointerdown', () => {
        state.subtitleSettings.fontSize = Math.min(32, state.subtitleSettings.fontSize + 2);
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      y += 50;
    } else {
      addToggle(t('settings.highContrast'), () => state.accessibilitySettings.highContrast, (v) => {
        state.accessibilitySettings.highContrast = v;
      });
      addToggle(t('settings.reduceMotion'), () => state.accessibilitySettings.reduceMotion, (v) => {
        state.accessibilitySettings.reduceMotion = v;
      });
      this.add.text(
        width / 2 - 400,
        y,
        `${t('settings.textSpeed')}: ${state.accessibilitySettings.textSpeed}`,
        { fontFamily: 'monospace', fontSize: '16px', color: '#cccccc' }
      );
      const speeds: Array<'slow' | 'normal' | 'fast'> = ['slow', 'normal', 'fast'];
      const cycle = this.add
        .text(width / 2 + 100, y, '→', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 12, y: 4 }
        })
        .setInteractive({ useHandCursor: true });
      cycle.on('pointerdown', () => {
        const idx = speeds.indexOf(state.accessibilitySettings.textSpeed);
        state.accessibilitySettings.textSpeed = speeds[(idx + 1) % speeds.length];
        this.persist();
        this.scene.restart({ from: this.fromScene, tab: this.tab });
      });
      y += 50;
    }

    this.statusText = this.add.text(width / 2, y + 20, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888'
    });
    this.statusText.setOrigin(0.5);

    const back = this.add
      .text(width / 2, height - 55, t('menu.back'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(this.fromScene));
    this.input.keyboard?.once('keydown-ESCAPE', () => this.scene.start(this.fromScene));
  }

  private async persist(): Promise<void> {
    const state = getState();
    await saveGame(state);
    setState(state);
    const click = sfxPath('ui_click');
    if (click) playSfx(this, click);
    if (this.statusText) {
      this.statusText.setText(t('settings.saved'));
    }
  }
}
