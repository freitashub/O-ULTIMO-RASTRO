import Phaser from 'phaser';
import { getState } from '@/game/GameState';
import { getPhase, loadAllPhases } from '@/systems/PhaseLoader';
import { t } from '@/i18n';

interface CreditsSceneData {
  from?: string;
  ending?: string;
}

export class CreditsScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private ending?: string;

  constructor() {
    super({ key: 'CreditsScene' });
  }

  async create(data: CreditsSceneData): Promise<void> {
    this.fromScene = data?.from ?? 'MenuScene';
    this.ending = data?.ending;

    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#000000');

    this.add
      .text(width / 2, 50, t('credits.title'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 95, t('credits.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#666666'
      })
      .setOrigin(0.5);

    if (this.ending === 'bad') {
      await this.showChoiceSummary();
    }

    const btn = this.add
      .text(width / 2, height - 50, t('menu.backToMenu'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const back = (): void => {
      this.scene.start(this.fromScene);
    };
    btn.on('pointerdown', back);
    this.input.keyboard?.once('keydown-ENTER', back);
    this.input.keyboard?.once('keydown-ESCAPE', back);
  }

  private async showChoiceSummary(): Promise<void> {
    const state = getState();
    const { width } = this.cameras.main;

    this.add
      .text(width / 2, 140, t('credits.choiceSummary'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const phaseIds = Object.keys(state.choices).map(Number).sort((a, b) => a - b);
    if (phaseIds.length === 0) {
      this.add.text(width / 2, 200, t('credits.noChoices'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#666666'
      }).setOrigin(0.5);
      return;
    }

    let y = 185;
    try {
      await loadAllPhases();
      for (const phaseId of phaseIds) {
        if (y > 600) break;
        const choiceId = state.choices[phaseId];
        let choice;
        let phaseJustification = '';
        try {
          const phase = await getPhase(phaseId);
          choice = phase.choices.find((c) => c.id === choiceId);
          phaseJustification = phase.justification;
        } catch {
          continue;
        }
        if (!choice) continue;

        const symbol = choice.correct ? '✓' : '✗';
        const color = choice.correct ? '#88ff88' : '#ff8888';

        this.add.text(100, y, `${symbol} FASE ${phaseId} — ${choice.text}`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color
        });

        if (!choice.correct) {
          this.add.text(120, y + 20, `Justificativa: ${phaseJustification}`, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#888888',
            wordWrap: { width: width - 240 }
          });
          y += 55;
        } else {
          y += 32;
        }
      }
    } catch (err) {
      console.error('Falha ao montar resumo:', err);
    }
  }
}
