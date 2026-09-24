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
import { addBackdrop, FONT_BODY, FONT_TITLE } from '@/ui/Atmosphere';
import { createAudioHud } from '@/ui/AudioHud';
import { GameState } from '@/types/GameState';

type MenuLevel = 'main' | 'extras' | 'options';

interface MenuItem {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void;
}

interface MenuSceneData {
  level?: MenuLevel;
  index?: number;
}

const ACCENT = '#d9b46a';

export class MenuScene extends Phaser.Scene {
  private level: MenuLevel = 'main';
  private selectedIndex = 0;
  private items: MenuItem[] = [];
  private rows: Phaser.GameObjects.Text[] = [];
  private markers: Phaser.GameObjects.Text[] = [];
  private description: Phaser.GameObjects.Text | null = null;
  private save: GameState | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create(data: MenuSceneData): Promise<void> {
    const { width, height } = this.cameras.main;
    this.level = data?.level ?? 'main';
    this.selectedIndex = data?.index ?? 0;
    this.rows = [];
    this.markers = [];
    this.cameras.main.setBackgroundColor('#07080c');
    stopAmbience();
    void playMusicTrack(this, 'menu', 1500);
    void preloadSfx(this, ['ui_click', 'ui_hover']);
    void addBackdrop(this, '/assets/backgrounds/phase-01-casa.webp', { darken: 0.62, weather: 'dust' });
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // painel esquerdo translúcido
    this.add.rectangle(0, 0, 470, height, 0x07080c, 0.55).setOrigin(0).setDepth(5);
    this.add.rectangle(470, 0, 1, height, 0xb8a06a, 0.25).setOrigin(0).setDepth(5);

    this.add
      .text(56, 58, t('menu.title'), {
        fontFamily: FONT_TITLE,
        fontSize: '40px',
        color: '#e8e4dc',
        letterSpacing: 4,
        shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 14, fill: true }
      })
      .setDepth(10);
    this.add.rectangle(56, 112, 120, 1, 0xb8a06a, 0.9).setOrigin(0, 0.5).setDepth(10);
    this.add
      .text(56, 126, t('title.subtitle'), { fontFamily: FONT_BODY, fontSize: '14px', color: '#8e8a80' })
      .setDepth(10);

    this.save = (await hasSave()) ? await loadGame() : null;
    if (!this.scene.isActive()) return;

    this.items = this.buildItems();
    if (this.selectedIndex >= this.items.length) this.selectedIndex = 0;
    this.renderItems();

    // painel direito: descrição + estado do save
    this.description = this.add
      .text(520, height - 120, '', {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: '#b9b4a8',
        wordWrap: { width: width - 580 }
      })
      .setDepth(10);
    const saveInfo = this.save
      ? t('menu.saveInfo', { phase: this.save.currentPhase, clues: this.save.clues.length })
      : t('menu.noSave');
    this.add
      .text(520, height - 82, saveInfo, { fontFamily: FONT_BODY, fontSize: '14px', color: '#7d7970' })
      .setDepth(10);
    this.add
      .text(width - 24, height - 22, t('menu.version'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#55524c' })
      .setOrigin(1, 1)
      .setDepth(10);
    this.updateSelection();
    createAudioHud(this);

    this.input.keyboard?.on('keydown-UP', () => this.move(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.activate(this.selectedIndex));
    this.input.keyboard?.on('keydown-SPACE', () => this.activate(this.selectedIndex));
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.level !== 'main') this.goLevel('main');
    });
  }

  private goLevel(level: MenuLevel, index = 0): void {
    void playSfxById(this, 'ui_click');
    this.scene.restart({ level, index } satisfies MenuSceneData);
  }

  private async hydrateFromSave(): Promise<void> {
    const save = await loadGame();
    if (save) {
      setState(save);
      refreshVolumes();
      if (save.language) {
        setLanguage(save.language);
        setGameStateLanguage(save.language);
      }
    }
  }

  private buildItems(): MenuItem[] {
    if (this.level === 'extras') {
      return [
        {
          id: 'clues',
          label: t('menu.clues'),
          onSelect: () => void this.hydrateFromSave().then(() => this.scene.start('CluesScene', { from: 'MenuScene' }))
        },
        {
          id: 'diary',
          label: t('menu.diary'),
          onSelect: () => void this.hydrateFromSave().then(() => this.scene.start('DiaryScene', { from: 'MenuScene' }))
        },
        { id: 'credits', label: t('menu.credits'), onSelect: () => this.scene.start('CreditsScene', { from: 'MenuScene' }) },
        { id: 'testEnding', label: t('menu.testEnding'), onSelect: () => this.scene.start('EndingTestScene') },
        { id: 'back', label: t('menu.back'), onSelect: () => this.goLevel('main', 2) }
      ];
    }
    if (this.level === 'options') {
      return [
        {
          id: 'language',
          label: `${t('menu.language')}: ${getLanguage()}`,
          onSelect: () => {
            const idx = SUPPORTED_LANGUAGES.indexOf(getLanguage());
            const next = SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
            setLanguage(next);
            setGameStateLanguage(next);
            void saveGame(getState());
            this.goLevel('options', 0);
          }
        },
        { id: 'audio', label: t('menu.audio'), onSelect: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'audio' }) },
        { id: 'subtitles', label: t('menu.subtitles'), onSelect: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'subtitles' }) },
        {
          id: 'accessibility',
          label: t('menu.accessibility'),
          onSelect: () => this.scene.start('SettingsScene', { from: 'MenuScene', tab: 'accessibility' })
        },
        { id: 'back', label: t('menu.back'), onSelect: () => this.goLevel('main', this.save ? 3 : 2) }
      ];
    }
    const items: MenuItem[] = [
      {
        id: 'newGame',
        label: t('menu.newGame'),
        description: t('menu.desc.newGame'),
        onSelect: () => {
          resetState();
          this.scene.start('IntroScene');
        }
      }
    ];
    if (this.save) {
      items.push({
        id: 'continue',
        label: t('menu.continue'),
        description: t('menu.desc.continue'),
        onSelect: () => {
          void this.hydrateFromSave().then(() => {
            this.scene.start('StoryScene', { phaseId: getState().currentPhase });
          });
        }
      });
    }
    items.push(
      { id: 'extras', label: `${t('menu.extras')}  ›`, description: t('menu.desc.extras'), onSelect: () => this.goLevel('extras') },
      { id: 'options', label: `${t('menu.options')}  ›`, description: t('menu.desc.options'), onSelect: () => this.goLevel('options') },
      {
        id: 'deleteSave',
        label: t('menu.deleteSave'),
        description: t('menu.desc.deleteSave'),
        onSelect: () => void resetSave().then(() => this.goLevel('main', 0))
      }
    );
    return items;
  }

  private renderItems(): void {
    const startY = 190;
    const spacing = 52;
    this.items.forEach((item, index) => {
      const y = startY + index * spacing;
      const marker = this.add
        .text(56, y, '▸', { fontFamily: FONT_BODY, fontSize: '22px', color: ACCENT })
        .setOrigin(0, 0.5)
        .setDepth(10)
        .setAlpha(0);
      const row = this.add
        .text(84, y, item.label, {
          fontFamily: FONT_TITLE,
          fontSize: '24px',
          color: '#9c978c',
          letterSpacing: 2
        })
        .setOrigin(0, 0.5)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      row.on('pointerover', () => {
        if (this.selectedIndex !== index) void playSfxById(this, 'ui_hover');
        this.selectedIndex = index;
        this.updateSelection();
      });
      row.on('pointerdown', () => this.activate(index));
      this.rows.push(row);
      this.markers.push(marker);
    });
  }

  private move(delta: number): void {
    if (this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.items.length) % this.items.length;
    void playSfxById(this, 'ui_hover');
    this.updateSelection();
  }

  private activate(index: number): void {
    const item = this.items[index];
    if (!item) return;
    void playSfxById(this, 'ui_click');
    item.onSelect();
  }

  private updateSelection(): void {
    this.rows.forEach((row, index) => {
      const selected = index === this.selectedIndex;
      row.setColor(selected ? '#f0ece4' : '#9c978c');
      row.setX(selected ? 92 : 84);
      this.markers[index]?.setAlpha(selected ? 1 : 0);
    });
    const item = this.items[this.selectedIndex];
    this.description?.setText(item?.description ?? '');
  }
}
