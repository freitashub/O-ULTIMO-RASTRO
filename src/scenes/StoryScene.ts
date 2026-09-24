import Phaser from 'phaser';
import { getPhase } from '@/systems/PhaseLoader';
import { setCurrentPhase, getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { getTransformationHint, getTransformationLevel, shouldShowTransformationEffect } from '@/game/TransformationSystem';
import {
  getCharacterPath,
  getPhaseCharacterId,
  getTransformedCharacterPath,
  getTransformationImagePath
} from '@/game/CharacterMap';
import { ensureImage } from '@/game/OptionalAssets';
import { createSubtitleRenderer, SubtitleRenderer } from '@/systems/SubtitleRenderer';
import { hasAssetPath, loadAssetsManifest } from '@/game/AssetsManifest';
import { t } from '@/i18n';
import { Phase } from '@/types/Phase';

interface StorySceneData {
  phaseId: number;
}

export class StoryScene extends Phaser.Scene {
  private phase: Phase | null = null;
  private subtitles: SubtitleRenderer | null = null;

  constructor() {
    super({ key: 'StoryScene' });
  }

  async create(data: StorySceneData): Promise<void> {
    const phaseId = data?.phaseId ?? 1;
    setCurrentPhase(phaseId);
    this.subtitles = createSubtitleRenderer(this);

    try {
      this.phase = await getPhase(phaseId);
      await saveGame(getState());
      await this.ensureBackground(this.phase);
      await this.ensureCharacterArt(this.phase);
      this.renderPhase(this.phase);
    } catch {
      this.phase = null;
      this.renderWorkInProgress(phaseId);
    }
  }

  private async ensureBackground(phase: Phase): Promise<void> {
    const key = phase.image;
    if (!key || this.textures.exists(key)) return;
    try {
      await loadAssetsManifest();
    } catch {
      return;
    }
    if (!hasAssetPath(key)) return;

    await new Promise<void>((resolve) => {
      const done = (): void => resolve();
      this.load.once('complete', done);
      this.load.once('loaderror', done);
      this.load.image(key, key);
      this.load.start();
    });
  }

  private async ensureCharacterArt(phase: Phase): Promise<void> {
    const level = getTransformationLevel();
    const baseId = getPhaseCharacterId(phase.id);
    let charPath = getCharacterPath(baseId);

    if (baseId === 'theo') {
      const transformed = getTransformedCharacterPath(level);
      if (transformed) charPath = transformed;
    }

    await ensureImage(this, charPath, charPath);

    if (shouldShowTransformationEffect(phase.id)) {
      const overlay = getTransformationImagePath(level);
      if (overlay) await ensureImage(this, overlay, overlay);
    }
  }

  private renderPhase(phase: Phase): void {
    const { width, height } = this.cameras.main;

    if (this.textures.exists(phase.image)) {
      this.add.image(width / 2, height / 2, phase.image).setDisplaySize(width, height);
    } else {
      this.cameras.main.setBackgroundColor('#0B0B10');
      const vignette = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);
      vignette.setDepth(0);
    }

    this.add.text(40, 36, `FASE ${phase.id} — ${phase.title}`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff'
    });

    this.add.text(40, 76, `ATO ${phase.act} · ${phase.objective}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#777777'
    });

    const panel = this.add.rectangle(width / 2, height / 2 + 40, width - 80, 300, 0x12121a, 0.92);
    panel.setStrokeStyle(1, 0x2a2a3a);

    this.add.text(80, 160, phase.intro, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#dddddd',
      wordWrap: { width: width - 320 }
    });

    this.add.text(80, 300, phase.scene, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa',
      wordWrap: { width: width - 320 }
    });

    this.renderCharacterArt(phase, width, height);

    this.subtitles?.show({
      text: phase.intro.split('\n')[0],
      startMs: 0,
      endMs: 3500
    });

    const hint = getTransformationHint(phase.id);
    if (hint) {
      this.add.text(40, height - 110, hint, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aa88ff'
      });
    }

    this.add.text(40, height - 70, t('story.continueHint'), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#555555'
    });

    const go = (): void => {
      this.scene.start('ChoiceScene', { phaseId: phase.id });
    };

    const btn = this.add
      .text(width / 2, height - 50, t('story.continue'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', go);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.input.keyboard?.once('keydown-SPACE', go);
    this.input.once('pointerdown', (pointer: Phaser.Input.Pointer, over: boolean[]) => {
      if (!over.length && pointer.y < height - 90) go();
    });
  }

  private renderCharacterArt(phase: Phase, width: number, height: number): void {
    const level = getTransformationLevel();
    const baseId = getPhaseCharacterId(phase.id);
    let charPath = getCharacterPath(baseId);
    if (baseId === 'theo') {
      const transformed = getTransformedCharacterPath(level);
      if (transformed) charPath = transformed;
    }

    const charX = width - 150;
    const charY = height / 2 + 10;

    if (this.textures.exists(charPath)) {
      this.add
        .image(charX, charY, charPath)
        .setDisplaySize(200, 300)
        .setDepth(5)
        .setAlpha(0.95);
    }

    if (shouldShowTransformationEffect(phase.id)) {
      const overlay = getTransformationImagePath(level);
      if (overlay && this.textures.exists(overlay)) {
        this.add
          .image(charX, charY, overlay)
          .setDisplaySize(200, 300)
          .setDepth(6)
          .setAlpha(0.55)
          .setTint(0xaa88ff);
      }
    }
  }

  private renderWorkInProgress(phaseId: number): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    this.add
      .text(width / 2, height / 2 - 80, `FASE ${phaseId}`, {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 20, t('wip.title'), {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#888888'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, t('wip.body'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#555555',
        align: 'center'
      })
      .setOrigin(0.5);

    const advance = (target: number): void => {
      if (target > 20) {
        this.scene.start('PuzzleScene');
      } else {
        this.scene.start('StoryScene', { phaseId: target });
      }
    };

    if (phaseId > 20) {
      advance(phaseId);
      return;
    }

    const nextBtn = this.add
      .text(width / 2, height / 2 + 130, t('wip.next'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    nextBtn.on('pointerdown', () => advance(phaseId + 1));
    this.input.keyboard?.once('keydown-ENTER', () => advance(phaseId + 1));

    const puzzleBtn = this.add
      .text(width / 2, height / 2 + 190, t('wip.puzzle'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#999999',
        backgroundColor: '#14141c',
        padding: { x: 16, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    puzzleBtn.on('pointerdown', () => this.scene.start('PuzzleScene'));

    const menuBtn = this.add
      .text(width / 2, height - 50, t('wip.menu'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#777777',
        backgroundColor: '#14141c',
        padding: { x: 16, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
