import Phaser from 'phaser';
import { resetState, getState } from '@/game/GameState';
import { t } from '@/i18n';
import { EndingId } from '@/game/EndingSystem';

type ErrorMode = 0 | 1 | 2;

interface TestConfig {
  errors: ErrorMode;
  allSymbols: boolean;
  hiddenTruth: boolean;
}

export class EndingTestScene extends Phaser.Scene {
  private config: TestConfig = {
    errors: 0,
    allSymbols: true,
    hiddenTruth: true
  };

  private statusText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'EndingTestScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');
    this.config = { errors: 0, allSymbols: true, hiddenTruth: true };

    this.add
      .text(width / 2, 50, t('endingTest.title'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        95,
        t('endingTest.subtitle'),
        {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#777777'
        }
      )
      .setOrigin(0.5);

    let y = 160;

    this.add.text(width / 2 - 420, y, t('endingTest.errors'), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    });

    const errorButtons: Array<{ label: string; value: ErrorMode; btn: Phaser.GameObjects.Text }> = [];
    ([0, 1, 2] as ErrorMode[]).forEach((value, index) => {
      const btn = this.createToggle(
        width / 2 - 250 + index * 140,
        y,
        `${value}`,
        () => {
          this.config.errors = value;
          errorButtons.forEach((e) => e.btn.setColor(e.value === value ? '#88ff88' : '#999999'));
          this.refreshStatus();
        }
      );
      errorButtons.push({ label: `${value}`, value, btn });
    });
    errorButtons[0].btn.setColor('#88ff88');

    y += 70;
    const symbolsBtn = this.createToggle(
      width / 2 - 250,
      y,
      'SÍMBOLOS: ATIVOS',
      () => {
        this.config.allSymbols = !this.config.allSymbols;
        symbolsBtn.setColor(this.config.allSymbols ? '#88ff88' : '#999999');
        symbolsBtn.setText(this.config.allSymbols ? 'SÍMBOLOS: ATIVOS' : 'SÍMBOLOS: INCOMPLETOS');
        this.refreshStatus();
      },
      '#88ff88'
    );

    const truthBtn = this.createToggle(
      width / 2 + 50,
      y,
      'HIDDEN_TRUTH: ATIVO',
      () => {
        this.config.hiddenTruth = !this.config.hiddenTruth;
        truthBtn.setColor(this.config.hiddenTruth ? '#88ff88' : '#999999');
        truthBtn.setText(
          this.config.hiddenTruth ? 'HIDDEN_TRUTH: ATIVO' : 'HIDDEN_TRUTH: INATIVO'
        );
        this.refreshStatus();
      },
      '#88ff88'
    );

    y += 90;
    this.add.text(width / 2 - 420, y, t('endingTest.fire'), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    });

    const endings: EndingId[] = ['secret', 'good', 'bad'];
    endings.forEach((ending, index) => {
      const btn = this.add
        .text(width / 2 - 250 + index * 200, y, ending.toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff',
          backgroundColor: '#1a1a22',
          padding: { x: 28, y: 14 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#88ccff'));
      btn.on('pointerout', () => btn.setColor('#ffffff'));
      btn.on('pointerdown', () => this.applyAndFire(ending));
    });

    y += 80;
    this.add.text(width / 2 - 420, y, t('endingTest.validation'), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    });

    this.statusText = this.add.text(width / 2 - 420, y + 35, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#888888',
      wordWrap: { width: 840 }
    });

    this.refreshStatus();

    const backBtn = this.add
      .text(width / 2, height - 55, t('menu.backToMenu'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-ESCAPE', () => this.scene.start('MenuScene'));
  }

  private createToggle(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    color = '#999999'
  ): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color,
        backgroundColor: '#14141c',
        padding: { x: 18, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', onClick);
    return btn;
  }

  private applyState(): void {
    resetState();
    const state = getState();
    state.errors = this.config.errors;
    state.transformationLevel = Math.min(this.config.errors, 5);
    state.cube.solved = true;
    state.cube.unlockedFace = true;

    if (this.config.allSymbols) {
      state.symbols = ['olho', 'lua', 'mao', 'corvo', 'arvore'];
      state.cube.diarySymbols = ['olho', 'lua', 'mao', 'corvo', 'arvore'];
    } else {
      state.symbols = ['olho', 'lua'];
      state.cube.diarySymbols = ['olho', 'lua'];
    }

    if (this.config.hiddenTruth) {
      state.clues.push('hidden_truth');
    }
  }

  private refreshStatus(): void {
    if (!this.statusText) return;

    const preview: TestConfig = { ...this.config };
    let predicted: EndingId;
    if (preview.errors >= 2) {
      predicted = 'bad';
    } else if (
      preview.errors === 0 &&
      preview.allSymbols &&
      preview.hiddenTruth
    ) {
      predicted = 'secret';
    } else {
      predicted = 'good';
    }

    this.statusText.setText(
      [
        `Config atual → errors=${preview.errors}, symbols=${preview.allSymbols ? 5 : 2}, hidden_truth=${preview.hiddenTruth}`,
        `Final previsto: ${predicted.toUpperCase()}`,
        '',
        t('endingTest.rule')
      ].join('\n')
    );
  }

  private applyAndFire(ending: EndingId): void {
    this.applyState();
    this.scene.start('EndingScene', { ending });
  }
}
