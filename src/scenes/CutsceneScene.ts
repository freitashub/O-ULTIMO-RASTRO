import Phaser from 'phaser';
import {
  CutsceneDef,
  CutsceneTrigger,
  cutscenesDisabled,
  findCutsceneForTrigger,
  getCutscene,
  markCutsceneSeen,
  wasCutsceneSeen
} from '@/game/Cutscenes';
import { stopAllAudio } from '@/game/AudioManager';
import { getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { StageDirector } from '@/systems/StageDirector';
import { createAudioHud } from '@/ui/AudioHud';
import { FONT_BODY } from '@/ui/Atmosphere';
import { t } from '@/i18n';

export interface CutsceneNext {
  scene: string;
  data?: object;
}

export interface CutsceneSceneData {
  cutsceneId: string;
  next: CutsceneNext;
}

/**
 * Inicia `next` passando antes pela cutscene do gatilho, se existir e ainda não tiver sido vista
 * (finais tocam sempre).
 */
export function startWithCutscene(scene: Phaser.Scene, trigger: CutsceneTrigger, next: CutsceneNext): void {
  const def = findCutsceneForTrigger(trigger);
  if (!def || cutscenesDisabled() || (trigger.type !== 'ending' && wasCutsceneSeen(def.id))) {
    scene.scene.start(next.scene, next.data);
    return;
  }
  scene.scene.start('CutsceneScene', { cutsceneId: def.id, next } satisfies CutsceneSceneData);
}

/** Cutscene em engine: cenários + sprites + vozes dirigidos pelo StageDirector. */
export class CutsceneScene extends Phaser.Scene {
  private director: StageDirector | null = null;
  private def: CutsceneDef | null = null;
  private next: CutsceneNext = { scene: 'MenuScene' };
  private pausedLabel: Phaser.GameObjects.Text | null = null;
  private finished = false;

  constructor() {
    super({ key: 'CutsceneScene' });
  }

  create(data: CutsceneSceneData): void {
    this.finished = false;
    this.director = null;
    this.next = data?.next ?? { scene: 'MenuScene' };
    this.def = getCutscene(data?.cutsceneId ?? '');
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.setZoom(1).centerOn(640, 360);
    if (!this.def) {
      this.goNext();
      return;
    }
    markCutsceneSeen(this.def.id);
    void saveGame(getState());
    this.buildUi(this.def);
    this.director = new StageDirector(this);
    // inicia no próximo tick: durante create() a cena ainda não está RUNNING (isActive() = false)
    const def = this.def;
    this.time.delayedCall(10, () => {
      if (!this.finished && this.director) void this.director.play(def.stage, () => this.goNext());
    });
  }

  private buildUi(def: CutsceneDef): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, 46, 0x000000, 0.35).setOrigin(0).setDepth(100).setScrollFactor(0);
    this.add.rectangle(0, height - 46, width, 46, 0x000000, 0.35).setOrigin(0).setDepth(100).setScrollFactor(0);
    this.add.text(24, 14, def.title, { fontFamily: FONT_BODY, fontSize: '14px', color: '#8e8a80' }).setDepth(101).setScrollFactor(0);
    const hint = this.add
      .text(width / 2, height - 24, t('cutscene.hint'), { fontFamily: FONT_BODY, fontSize: '13px', color: '#6f6b63' })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0);
    this.tweens.add({ targets: hint, alpha: 0.35, delay: 4000, duration: 1500 });
    const skip = this.add
      .text(width - 70, 22, t('cutscene.skip'), { fontFamily: FONT_BODY, fontSize: '14px', color: '#dddddd', backgroundColor: '#1a1a22', padding: { x: 12, y: 6 } })
      .setOrigin(1, 0.5)
      .setDepth(101)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.skip());
    this.pausedLabel = this.add
      .text(width / 2, height / 2, t('cutscene.paused'), { fontFamily: FONT_BODY, fontSize: '28px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 20, y: 10 } })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0)
      .setVisible(false);
    createAudioHud(this, 102);
    this.input.keyboard?.on('keydown-ESC', () => this.skip());
    this.input.keyboard?.on('keydown-SPACE', () => this.skip());
    this.input.keyboard?.on('keydown-ENTER', () => this.skip());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.keyboard?.on('keydown-R', () => this.replay());
  }

  update(_time: number, deltaMs: number): void {
    this.director?.tick(Math.min(0.05, deltaMs / 1000));
  }

  skip(): void {
    if (this.finished) return;
    if (this.director) this.director.skip();
    else this.goNext();
  }

  togglePause(): void {
    if (!this.director || this.finished) return;
    if (this.director.getState() === 'playing') {
      this.director.pause();
      this.pausedLabel?.setVisible(true);
    } else if (this.director.getState() === 'paused') {
      this.director.resume();
      this.pausedLabel?.setVisible(false);
    }
  }

  replay(): void {
    if (!this.def || this.finished) return;
    this.finished = true;
    this.director?.destroy();
    this.director = null;
    stopAllAudio();
    this.scene.restart({ cutsceneId: this.def.id, next: this.next } satisfies CutsceneSceneData);
  }

  /** Estado para QA/automação. */
  getDirectorState(): string {
    return this.director?.getState() ?? 'none';
  }

  private goNext(): void {
    if (this.finished) return;
    this.finished = true;
    this.director?.destroy();
    this.director = null;
    this.cameras.main.setZoom(1);
    this.time.delayedCall(50, () => this.scene.start(this.next.scene, this.next.data));
  }
}
