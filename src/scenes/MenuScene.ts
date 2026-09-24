import Phaser from 'phaser';
import { hasSave, loadGame, resetSave, saveGame } from '@/game/SaveManager';
import {
  setState,
  resetState,
  setLanguage as setGameStateLanguage,
  getState
} from '@/game/GameState';
import { t, setLanguage, getLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { playMusicTrack, playSfxById, preloadSfx } from '@/game/SceneAudio';
import { refreshVolumes, stopAmbience } from '@/game/AudioManager';

export class MenuScene extends Phaser.Scene {
  private selectedIndex = 0;
  private buttons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');
    this.buttons = [];
    this.selectedIndex = 0;
    stopAmbience();
    void playMusicTrack(this, 'menu', 1500);
    void preloadSfx(this, ['ui_click', 'ui_hover']);

    this.add.text(width / 2, 100, t('menu.title'), {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const canContinue = await hasSave();

    const items: Array<{ label: string; onClick: () => void }> = [
      {
        label: t('menu.newGame'),
        onClick: () => {
          resetState();
          this.scene.start('IntroScene');
        }
      }
    ];

    if (canContinue) {
      items.push({
        label: t('menu.continue'),
        onClick: () => {
          void (async () => {
            const save = await loadGame();
            if (save) {
              setState(save);
              refreshVolumes();
              if (save.language) {
                setLanguage(save.language);
                setGameStateLanguage(save.language);
              }
              this.scene.start('StoryScene', { phaseId: save.currentPhase });
            }
          })();
        }
      });
    }

    const hydrateFromSave = async (): Promise<void> => {
      const save = await loadGame();
      if (save) {
        setState(save);
        refreshVolumes();
        if (save.language) {
          setLanguage(save.language);
          setGameStateLanguage(save.language);
        }
      }
    };

    items.push(
      {
        label: t('menu.clues'),
        onClick: () => {
          void hydrateFromSave().then(() => {
            this.scene.start('CluesScene', { from: 'MenuScene' });
          });
        }
      },
      {
        label: t('menu.diary'),
        onClick: () => {
          void hydrateFromSave().then(() => {
            this.scene.start('DiaryScene', { from: 'MenuScene' });
          });
        }
      },
      {
        label: t('menu.language') + `: ${getLanguage()}`,
        onClick: () => {
          const idx = SUPPORTED_LANGUAGES.indexOf(getLanguage());
          const next = SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
          setLanguage(next);
          setGameStateLanguage(next);
          void saveGame(getState());
          this.scene.restart();
        }
      },
      {
        label: t('menu.audio'),
        onClick: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'audio' })
      },
      {
        label: t('menu.subtitles'),
        onClick: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'subtitles' })
      },
      {
        label: t('menu.accessibility'),
        onClick: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'accessibility' })
      },
      {
        label: t('menu.testEnding'),
        onClick: () => this.scene.start('EndingTestScene')
      },
      {
        label: t('menu.credits'),
        onClick: () => this.scene.start('CreditsScene', { from: 'MenuScene' })
      },
      {
        label: t('menu.deleteSave'),
        onClick: () => {
          void resetSave().then(() => this.scene.restart());
        }
      }
    );

    const startY = height / 2 - items.length * 30;
    const spacing = 60;

    items.forEach((item, index) => {
      const btn = this.createButton(width / 2, startY + index * spacing, item.label, item.onClick);
      this.buttons.push(btn);
    });

    this.updateSelection();

    this.input.keyboard?.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
      this.updateSelection();
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
      this.updateSelection();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.buttons[this.selectedIndex].emit('pointerdown');
    });
  }

  private updateSelection(): void {
    this.buttons.forEach((btn, index) => {
      btn.setColor(index === this.selectedIndex ? '#ffffff' : '#999999');
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#cccccc',
        backgroundColor: '#1a1a22',
        padding: { x: 24, y: 12 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffffff');
      void playSfxById(this, 'ui_hover');
    });
    btn.on('pointerout', () => {
      const idx = this.buttons.indexOf(btn);
      btn.setColor(idx === this.selectedIndex ? '#ffffff' : '#999999');
    });
    btn.on('pointerdown', () => {
      void playSfxById(this, 'ui_click');
      onClick();
    });

    return btn;
  }
}
