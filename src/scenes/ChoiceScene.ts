import Phaser from 'phaser';
import { getPhase } from '@/systems/PhaseLoader';
import { resolveChoice } from '@/game/ChoiceSystem';
import { getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { getPhasePortraitId, getPortraitPath } from '@/game/CharacterMap';
import { ensureImage } from '@/game/OptionalAssets';
import { t } from '@/i18n';
import { Phase } from '@/types/Phase';

interface ChoiceSceneData {
  phaseId: number;
}

export class ChoiceScene extends Phaser.Scene {
  private phase!: Phase;
  private chosen = false;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private headerTexts: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Image> = [];

  constructor() {
    super({ key: 'ChoiceScene' });
  }

  async create(data: ChoiceSceneData): Promise<void> {
    this.phase = await getPhase(data.phaseId);
    this.chosen = false;
    this.choiceButtons = [];
    this.headerTexts = [];

    const { width } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');

    const title = this.add
      .text(width / 2, 70, `FASE ${this.phase.id} — ${this.phase.title}`, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(width / 2, 120, t('choice.question'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#888888'
      })
      .setOrigin(0.5);

    this.headerTexts.push(title, subtitle);

    const portraitPath = getPortraitPath(getPhasePortraitId(this.phase.id));
    await ensureImage(this, portraitPath, portraitPath);
    if (this.textures.exists(portraitPath)) {
      const portrait = this.add
        .image(width - 90, 70, portraitPath)
        .setDisplaySize(80, 80)
        .setDepth(2);
      this.headerTexts.push(portrait);
    }

    const startY = 230;
    const spacing = 110;

    this.phase.choices.forEach((choice, index) => {
      const y = startY + index * spacing;
      const btn = this.createChoiceButton(width / 2, y, `${index + 1}. ${choice.text}`, () => {
        this.handleChoice(choice.id);
      });
      this.choiceButtons.push(btn);
    });

    const keyHandler = (event: KeyboardEvent): void => {
      const idx = ['1', '2', '3'].indexOf(event.key);
      if (idx >= 0 && this.phase.choices[idx]) {
        this.handleChoice(this.phase.choices[idx].id);
      }
    };
    this.input.keyboard?.on('keydown', keyHandler);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', keyHandler);
    });
  }

  private createChoiceButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#dddddd',
        backgroundColor: '#1a1a22',
        padding: { x: 24, y: 16 },
        fixedWidth: 620,
        align: 'center'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#dddddd'));
    btn.on('pointerdown', onClick);

    return btn;
  }

  private async handleChoice(choiceId: string): Promise<void> {
    if (this.chosen) return;
    this.chosen = true;

    const choice = this.phase.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    this.choiceButtons.forEach((b) => b.disableInteractive());
    this.headerTexts.forEach((t) => t.setVisible(false));
    this.choiceButtons.forEach((b) => b.setVisible(false));

    const result = resolveChoice(this.phase, choice);
    await saveGame(getState());

    if (!this.scene.isActive()) return;
    if (this.phase.revelation) {
      this.showRevelation(this.phase.revelation, result.consequence);
    } else {
      this.showConsequence(result.consequence);
    }
  }

  private showRevelation(revelation: string, consequence: string): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setDepth(10);

    const consequenceText = this.add
      .text(width / 2, height / 2 - 70, consequence, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5)
      .setDepth(11);

    const label = this.add
      .text(width / 2, height / 2 + 10, t('choice.revelationLabel'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#88ccff'
      })
      .setOrigin(0.5)
      .setDepth(11);

    const revelationText = this.add
      .text(width / 2, height / 2 + 50, revelation, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5)
      .setDepth(11);

    let skipped = false;
    const skip = (): void => {
      if (skipped) return;
      skipped = true;
      this.time.removeAllEvents();
      overlay.destroy();
      consequenceText.destroy();
      label.destroy();
      revelationText.destroy();
      this.showCliffhanger();
    };

    this.time.delayedCall(4000, skip);
    this.input.once('pointerdown', skip);
    this.input.keyboard?.once('keydown-ENTER', skip);
    this.input.keyboard?.once('keydown-SPACE', skip);
  }

  private showConsequence(text: string): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setDepth(10);

    const label = this.add
      .text(width / 2, height / 2 - 40, t('choice.consequenceLabel'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aaaaaa'
      })
      .setOrigin(0.5)
      .setDepth(11);

    const consequence = this.add
      .text(width / 2, height / 2 + 20, text, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5)
      .setDepth(11);

    let skipped = false;
    const skip = (): void => {
      if (skipped) return;
      skipped = true;
      this.time.removeAllEvents();
      overlay.destroy();
      label.destroy();
      consequence.destroy();
      this.showCliffhanger();
    };

    this.time.delayedCall(3000, skip);
    this.input.once('pointerdown', skip);
    this.input.keyboard?.once('keydown-ENTER', skip);
    this.input.keyboard?.once('keydown-SPACE', skip);
  }

  private showCliffhanger(): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#050508');
    this.choiceButtons.forEach((b) => b.setVisible(false));
    this.headerTexts.forEach((t) => t.setVisible(false));

    const cliff = this.add
      .text(width / 2, height / 2, this.phase.cliffhanger, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 200 }
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(11);

    this.tweens.add({
      targets: cliff,
      alpha: 1,
      duration: 1000
    });

    const btn = this.add
      .text(width / 2, height - 80, t('story.continue'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1a1a22',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0)
      .setDepth(11);

    this.tweens.add({
      targets: btn,
      alpha: 1,
      delay: 1500,
      duration: 500
    });

    let advancedOnce = false;
    const advance = (): void => {
      if (advancedOnce) return;
      advancedOnce = true;
      const nextPhase = this.phase.id + 1;
      if (nextPhase > 20) {
        this.scene.start('PuzzleScene');
      } else {
        this.scene.start('StoryScene', { phaseId: nextPhase });
      }
    };

    btn.on('pointerdown', advance);
    this.time.delayedCall(2000, () => {
      this.input.keyboard?.once('keydown-ENTER', advance);
      this.input.keyboard?.once('keydown-SPACE', advance);
    });
  }
}
