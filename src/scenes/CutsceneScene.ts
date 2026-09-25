import Phaser from 'phaser';
import {
  CutsceneDef,
  CutsceneTrigger,
  cuesFromSidecar,
  externalVideoBases,
  cutscenesDisabled,
  findCutsceneForTrigger,
  getCutscene,
  markCutsceneSeen,
  wasCutsceneSeen
} from '@/game/Cutscenes';
import { channelVolume, isMuted, stopAllAudio } from '@/game/AudioManager';
import { ensureVideo } from '@/game/OptionalAssets';
import { hasAssetPath, loadAssetsManifest } from '@/game/AssetsManifest';
import { CutscenePlayer, createCutscenePlayer } from '@/systems/CutscenePlayer';
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

/**
 * Cutscene: vídeo externo (Google Flow, `public/cutscenes/<id>.webm|mp4`) quando existir no manifest;
 * senão, cutscene em engine (cenários + sprites + vozes dirigidos pelo StageDirector).
 */
export class CutsceneScene extends Phaser.Scene {
  private director: StageDirector | null = null;
  private videoPlayer: CutscenePlayer | null = null;
  private mode: 'video' | 'stage' | 'none' = 'none';
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
    this.videoPlayer = null;
    this.mode = 'none';
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
    const def = this.def;
    // inicia no próximo tick: durante create() a cena ainda não está RUNNING (isActive() = false)
    this.time.delayedCall(10, () => void this.start(def));
  }

  private async start(def: CutsceneDef): Promise<void> {
    if (this.finished) return;
    if (await this.tryExternalVideo(def)) return;
    this.startStage(def);
  }

  private startStage(def: CutsceneDef): void {
    if (this.finished) return;
    this.mode = 'stage';
    this.director = new StageDirector(this);
    void this.director.play(def.stage, () => this.goNext());
  }

  /** Vídeo externo + legendas do sidecar. Falha de rede/codec → cutscene em engine. */
  private async tryExternalVideo(def: CutsceneDef): Promise<boolean> {
    await loadAssetsManifest();
    let key: string | null = null;
    for (const base of externalVideoBases(def)) {
      if (await ensureVideo(this, base, base)) {
        key = base;
        break;
      }
    }
    if (!key || this.finished || !this.scene.isActive()) return false;
    let sidecar: { cues?: [] } | null = null;
    const cuesPath = `/cutscenes/${def.id}.cues.json`;
    if (hasAssetPath(cuesPath)) {
      try {
        sidecar = await (await fetch(cuesPath)).json();
      } catch {
        sidecar = null;
      }
    }
    stopAllAudio(); // o vídeo traz a própria trilha
    this.mode = 'video';
    this.videoPlayer = createCutscenePlayer(this);
    this.videoPlayer.play(
      [
        {
          type: 'video',
          key,
          cues: cuesFromSidecar(sidecar),
          volume: isMuted() ? 0 : Math.max(channelVolume('voice'), channelVolume('music')),
          onError: () => {
            console.warn(`Cutscene ${def.id}: vídeo externo falhou; usando cutscene em engine.`);
            this.videoPlayer?.destroy();
            this.videoPlayer = null;
            this.startStage(def);
          }
        }
      ],
      { onEnd: () => this.goNext() }
    );
    return true;
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
    if (this.videoPlayer) this.videoPlayer.skip();
    else if (this.director) this.director.skip();
    else this.goNext();
  }

  togglePause(): void {
    if (this.finished) return;
    if (this.videoPlayer) {
      if (this.videoPlayer.getState() === 'playing') {
        this.videoPlayer.pause();
        this.pausedLabel?.setVisible(true);
      } else if (this.videoPlayer.getState() === 'paused') {
        this.videoPlayer.resume();
        this.pausedLabel?.setVisible(false);
      }
      return;
    }
    if (!this.director) return;
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
    this.videoPlayer?.destroy();
    this.videoPlayer = null;
    stopAllAudio();
    this.scene.restart({ cutsceneId: this.def.id, next: this.next } satisfies CutsceneSceneData);
  }

  /** Estado para QA/automação. */
  getDirectorState(): string {
    if (this.videoPlayer) return this.videoPlayer.getState();
    return this.director?.getState() ?? 'none';
  }

  getMode(): 'video' | 'stage' | 'none' {
    return this.mode;
  }

  private goNext(): void {
    if (this.finished) return;
    this.finished = true;
    this.director?.destroy();
    this.director = null;
    this.videoPlayer?.destroy();
    this.videoPlayer = null;
    this.mode = 'none';
    this.cameras.main.setZoom(1);
    this.time.delayedCall(50, () => this.scene.start(this.next.scene, this.next.data));
  }
}
