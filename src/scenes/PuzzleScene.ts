import Phaser from 'phaser';
import { getState } from '@/game/GameState';
import { calculateEnding, applyEndingToState, EndingId } from '@/game/EndingSystem';
import { saveGame } from '@/game/SaveManager';
import { loadCubeConfig, CubeConfig } from '@/game/CubeConfig';
import { ensureImage } from '@/game/OptionalAssets';
import { t } from '@/i18n';
import { playAmbienceLoop, playMusicTrack, playSfxById, preloadSfx } from '@/game/SceneAudio';

const DEFAULT_FACES = ['olho', 'lua', 'mao', 'corvo', 'arvore', 'rosto'];
const DEFAULT_SOLUTION = ['olho', 'lua', 'mao', 'corvo', 'arvore'];

export class PuzzleScene extends Phaser.Scene {
  private selected: string[] = [];
  private buttons: Phaser.GameObjects.Text[] = [];
  private locked = false;
  private faces: string[] = DEFAULT_FACES;
  private solution: string[] = DEFAULT_SOLUTION;
  private cubeConfig: CubeConfig | null = null;

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');
    this.selected = [];
    this.buttons = [];
    this.locked = false;
    void playMusicTrack(this, 'cube', 1500);
    void playAmbienceLoop(this, 'amb_cube');
    void preloadSfx(this, ['sfx_cube_rotate', 'sfx_cube_solve', 'sfx_cube_fail', 'ui_click']);

    try {
      this.cubeConfig = await loadCubeConfig();
      this.faces = this.cubeConfig.faces;
      this.solution = this.cubeConfig.solution;
    } catch {
      this.cubeConfig = null;
      this.faces = DEFAULT_FACES;
      this.solution = DEFAULT_SOLUTION;
    }

    this.add
      .text(width / 2, 55, t('puzzle.title'), {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const inscription =
      this.cubeConfig?.inscription ??
      'Quem viu primeiro, lembra primeiro. Quem lembrou, girou. Quem girou, encontrou.';

    this.add
      .text(width / 2, 115, inscription, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5);

    const state = getState();
    const diaryOrder = state.cube.diarySymbols;
    if (diaryOrder.length > 0) {
      this.add
        .text(width / 2, 200, `Diário: ${diaryOrder.join(' → ')}`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#666666'
        })
        .setOrigin(0.5);
    }

    const startY = 260;
    const spacing = 58;

    for (let index = 0; index < this.faces.length; index++) {
      const face = this.faces[index];
      const y = startY + index * spacing;
      const facePath = `/images/cube/face_${face}.png`;
      await ensureImage(this, facePath, facePath);
      if (this.textures.exists(facePath)) {
        this.add.image(width / 2 - 140, y, facePath).setDisplaySize(40, 40);
      }

      const btn = this.add
        .text(width / 2 + (this.textures.exists(facePath) ? 20 : 0), y, `[ ${face.toUpperCase()} ]`, {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#dddddd',
          backgroundColor: '#1a1a22',
          padding: { x: 20, y: 8 },
          fixedWidth: 300,
          align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.selectFace(face));
      btn.on('pointerover', () => {
        if (!this.selected.includes(face)) btn.setColor('#ffffff');
      });
      btn.on('pointerout', () => {
        if (!this.selected.includes(face)) btn.setColor('#dddddd');
      });
      this.buttons.push(btn);
    }

    this.add
      .text(width / 2, height - 70, t('puzzle.hint'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#666666'
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .text(width - 80, height - 40, t('wip.menu'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#777777',
        backgroundColor: '#14141c',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    const keyHandler = (event: KeyboardEvent): void => {
      const idx = ['1', '2', '3', '4', '5', '6'].indexOf(event.key);
      if (idx >= 0 && this.faces[idx]) this.selectFace(this.faces[idx]);
    };
    this.input.keyboard?.on('keydown', keyHandler);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', keyHandler);
    });
  }

  private selectFace(face: string): void {
    if (this.locked || this.selected.includes(face)) return;
    void playSfxById(this, 'sfx_cube_rotate');
    this.selected.push(face);

    const idx = this.selected.length - 1;
    const isCorrect = this.selected[idx] === this.solution[idx];

    const btn = this.buttons[this.faces.indexOf(face)];
    btn.setColor(isCorrect ? '#88ff88' : '#ff8888');

    const state = getState();
    state.cube.attempts += 1;
    state.cube.symbolOrder = [...this.selected];

    if (!isCorrect) {
      void playSfxById(this, 'sfx_cube_fail');
      this.time.delayedCall(800, () => this.resetPuzzle());
      return;
    }

    if (this.selected.length === this.solution.length) {
      this.locked = true;
      void this.unlockFinalFace();
    }
  }

  private resetPuzzle(): void {
    this.selected = [];
    this.buttons.forEach((b) => b.setColor('#dddddd'));
  }

  private async unlockFinalFace(): Promise<void> {
    const { width, height } = this.cameras.main;
    void playSfxById(this, 'sfx_cube_solve');

    const msg = this.add
      .text(width / 2, height - 120, t('puzzle.sixthFace'), {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.tweens.add({ targets: msg, alpha: { from: 0, to: 1 }, duration: 1000 });

    const state = getState();
    state.cube.solved = true;
    state.cube.unlockedFace = true;

    if (state.errors === 0 && state.symbols.length === 5 && !state.clues.includes('hidden_truth')) {
      state.clues.push('hidden_truth');
    }

    const ending: EndingId = calculateEnding(state);
    applyEndingToState(ending);
    await saveGame(state);

    this.time.delayedCall(2200, () => {
      this.scene.start('EndingScene', { ending });
    });
  }
}
