import Phaser from 'phaser';
import {
  CutsceneDef,
  CutsceneTrigger,
  buildFallbackSteps,
  buildSubtitleCues,
  cutsceneDuration,
  cutscenesDisabled,
  cutsceneVideoBases,
  findCutsceneForTrigger,
  getCutscene,
  markCutsceneSeen,
  resolveLines,
  wasCutsceneSeen
} from '@/game/Cutscenes';
import { ensureImage, ensureVideo } from '@/game/OptionalAssets';
import { ensureVoiceLine, playAmbienceLoop, playMusicTrack, preloadSfx } from '@/game/SceneAudio';
import { channelVolume, isMuted, stopAllAudio, fadeOutMusic, stopAmbience } from '@/game/AudioManager';
import { getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { CutscenePlayer, CutsceneStep, createCutscenePlayer } from '@/systems/CutscenePlayer';
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

export class CutsceneScene extends Phaser.Scene {
  private player: CutscenePlayer | null = null;
  private def: CutsceneDef | null = null;
  private next: CutsceneNext = { scene: 'MenuScene' };
  private poster: Phaser.GameObjects.Image | null = null;
  private pausedLabel: Phaser.GameObjects.Text | null = null;
  private videoKey: string | null = null;
  private finished = false;
  private mode: 'video' | 'fallback' = 'fallback';

  constructor() {
    super({ key: 'CutsceneScene' });
  }

  async create(data: CutsceneSceneData): Promise<void> {
    this.finished = false;
    this.player = null;
    this.videoKey = null;
    this.next = data?.next ?? { scene: 'MenuScene' };
    this.def = getCutscene(data?.cutsceneId ?? '');
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#000000');

    if (!this.def) {
      this.goNext();
      return;
    }
    const def = this.def;
    markCutsceneSeen(def.id);
    void saveGame(getState());

    // poster (fallback visual + primeiro frame)
    if (def.poster) {
      await ensureImage(this, def.poster, def.poster);
      if (this.textures.exists(def.poster)) {
        this.poster = this.add.image(width / 2, height / 2, def.poster).setDepth(1);
        const tex = this.textures.get(def.poster).getSourceImage() as { width: number; height: number };
        const scale = Math.max(width / tex.width, height / tex.height);
        this.poster.setScale(scale).setAlpha(0.9);
      }
    }

    this.buildUi(def);

    const reduceMotion = getState().accessibilitySettings.reduceMotion;
    for (const base of cutsceneVideoBases(def)) {
      if (await ensureVideo(this, base, base)) {
        this.videoKey = base;
        break;
      }
    }
    if (!this.scene.isActive()) return;

    if (this.videoKey) {
      this.mode = 'video';
      // o vídeo já traz música/ambiência/voz mixadas
      fadeOutMusic(this, 600);
      stopAmbience();
      const volume = isMuted() ? 0 : Math.max(channelVolume('voice'), channelVolume('music'));
      const steps: CutsceneStep[] = [
        {
          type: 'video',
          key: this.videoKey,
          cues: buildSubtitleCues(def),
          duration: cutsceneDuration(def) * 1000,
          volume,
          onError: () => {
            // rede/codec falhou em tempo de execução → mesma cutscene em modo fallback
            console.warn(`Cutscene ${def.id}: vídeo indisponível, usando fallback.`);
            this.player?.destroy();
            this.player = null;
            void this.startFallback(def, reduceMotion);
          }
        }
      ];
      this.player = createCutscenePlayer(this);
      this.player.play(steps, { onEnd: () => this.goNext() });
      return;
    }
    await this.startFallback(def, reduceMotion);
  }

  /** Sem vídeo: música/ambiência do jogo + voz + legenda em passos, com zoom lento no poster. */
  private async startFallback(def: CutsceneDef, reduceMotion: boolean): Promise<void> {
    this.mode = 'fallback';
    await playMusicTrack(this, def.music ?? null);
    await playAmbienceLoop(this, def.ambience ?? null);
    for (const { line } of resolveLines(def)) await ensureVoiceLine(this, line.id);
    await preloadSfx(this, ['ui_click']);
    if (!this.scene.isActive() || this.finished) return;
    const steps = buildFallbackSteps(def);
    if (this.poster && !reduceMotion) {
      this.tweens.add({
        targets: this.poster,
        scale: this.poster.scale * 1.12,
        duration: cutsceneDuration(def) * 1000,
        ease: 'Sine.easeInOut'
      });
    }
    this.player = createCutscenePlayer(this);
    this.player.play(steps, { onEnd: () => this.goNext() });
  }

  private buildUi(def: CutsceneDef): void {
    const { width, height } = this.cameras.main;
    this.add
      .text(24, 18, def.title, { fontFamily: 'monospace', fontSize: '14px', color: '#777777' })
      .setDepth(100)
      .setAlpha(0.8);

    const hint = this.add
      .text(width / 2, height - 22, t('cutscene.hint'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#666666'
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.tweens.add({ targets: hint, alpha: 0.35, delay: 4000, duration: 1500 });

    const skip = this.add
      .text(width - 24, 18, t('cutscene.skip'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#dddddd',
        backgroundColor: '#1a1a22',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(1, 0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.skip());

    this.pausedLabel = this.add
      .text(width / 2, height / 2, t('cutscene.paused'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);

    this.input.keyboard?.on('keydown-ESC', () => this.skip());
    this.input.keyboard?.on('keydown-SPACE', () => this.skip());
    this.input.keyboard?.on('keydown-ENTER', () => this.skip());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.keyboard?.on('keydown-R', () => this.replay());
  }

  skip(): void {
    if (this.finished) return;
    if (this.player) this.player.skip();
    else this.goNext();
  }

  togglePause(): void {
    if (!this.player || this.finished) return;
    if (this.player.getState() === 'playing') {
      this.player.pause();
      this.tweens.pauseAll();
      this.pausedLabel?.setVisible(true);
    } else if (this.player.getState() === 'paused') {
      this.player.resume();
      this.tweens.resumeAll();
      this.pausedLabel?.setVisible(false);
    }
  }

  replay(): void {
    if (!this.def || this.finished) return;
    this.finished = true;
    this.player?.destroy();
    this.player = null;
    stopAllAudio();
    this.scene.restart({ cutsceneId: this.def.id, next: this.next } satisfies CutsceneSceneData);
  }

  getMode(): 'video' | 'fallback' {
    return this.mode;
  }

  private goNext(): void {
    if (this.finished) return;
    this.finished = true;
    this.player?.destroy();
    this.player = null;
    if (this.mode === 'video') stopAllAudio();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start(this.next.scene, this.next.data));
  }
}
