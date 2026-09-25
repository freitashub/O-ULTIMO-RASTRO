import Phaser from 'phaser';
import { getPhase } from '@/systems/PhaseLoader';
import { getState, setCurrentPhase } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { ensureImage } from '@/game/OptionalAssets';
import { hasAssetPath, loadAssetsManifest } from '@/game/AssetsManifest';
import { ensureVoiceLine, playPhaseAudio, playSfxById, preloadSfx, voiceKey } from '@/game/SceneAudio';
import { phaseLineId } from '@/game/VoiceLines';
import { stopVoice } from '@/game/AudioManager';
import { CutscenePlayer, CutsceneStep, createCutscenePlayer } from '@/systems/CutscenePlayer';
import { createAudioHud } from '@/ui/AudioHud';
import { FONT_BODY, FONT_TITLE } from '@/ui/Atmosphere';
import { t } from '@/i18n';
import { Phase } from '@/types/Phase';
import type { SpatialWorld, SpatialDebugState } from '@/spatial/SpatialWorld';
import type { InteractableSpec } from '@/spatial/garageLayout';

interface SpatialSceneData {
  phaseId: number;
}

const THEO_MODEL = '/assets/models/theo.glb';
const CANVAS_ID = 'spatial-canvas';

/** `?spatial=0` desativa o runtime 3D (volta à exploração 2D). */
export function spatialEnabled(): boolean {
  try {
    return !(typeof location !== 'undefined' && /[?&]spatial=0/.test(location.search));
  } catch {
    return true;
  }
}

/**
 * Vertical slice espacial (Fase 1 — garagem). O mundo 3D (Babylon.js) é renderizado num canvas
 * por baixo do canvas do Phaser, que fica transparente e desenha HUD, legendas e painéis.
 * Toda a camada narrativa (fases, escolhas, pistas, save, áudio, legendas) continua a mesma.
 */
export class SpatialScene extends Phaser.Scene {
  private world: SpatialWorld | null = null;
  private phase: Phase | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private panel: Phaser.GameObjects.Container | null = null;
  private prompt: Phaser.GameObjects.Text | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private narration: CutscenePlayer | null = null;
  private ready = false;
  private leaving = false;
  private lastStepAt = 0;
  private onResize = (): void => this.syncCanvas();
  private resizeTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'SpatialScene' });
  }

  async create(data: SpatialSceneData): Promise<void> {
    const phaseId = data?.phaseId ?? 1;
    this.ready = false;
    this.leaving = false;
    this.panel = null;
    this.world = null;
    this.narration = null;
    setCurrentPhase(phaseId);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.loadingText = this.add
      .text(640, 360, t('loading'), { fontFamily: FONT_BODY, fontSize: '18px', color: '#8e8a80' })
      .setOrigin(0.5)
      .setDepth(50);
    this.events.once('shutdown', () => this.teardown());
    this.events.once('destroy', () => this.teardown());

    try {
      this.phase = await getPhase(phaseId);
      await saveGame(getState());
      this.createCanvas();
      const [{ SpatialWorld }, { GARAGE_LAYOUT }] = await Promise.all([import('@/spatial/SpatialWorld'), import('@/spatial/garageLayout')]);
      await loadAssetsManifest();
      const world = new SpatialWorld(GARAGE_LAYOUT, {
        canvas: this.canvas!,
        theoModelUrl: hasAssetPath(THEO_MODEL) ? THEO_MODEL : undefined,
        reduceMotion: getState().accessibilitySettings.reduceMotion
      });
      await world.build();
      if (!this.scene.isActive() || this.leaving) {
        world.dispose();
        return;
      }
      this.world = world;
    } catch (err) {
      console.warn('Runtime 3D indisponível; usando exploração 2D:', err);
      this.teardown();
      this.scene.start('StoryScene', { phaseId, force2d: true });
      return;
    }
    this.loadingText?.destroy();
    this.loadingText = null;
    this.buildHud(this.phase);
    this.bindInput();
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.ready = true;
    void this.startAudio(this.phase);
  }

  // ------------------------------------------------------------------ canvas 3D sob o Phaser
  private createCanvas(): void {
    document.getElementById(CANVAS_ID)?.remove();
    const c = document.createElement('canvas');
    c.id = CANVAS_ID;
    c.width = 1280;
    c.height = 720;
    c.style.position = 'fixed';
    c.style.zIndex = '0';
    c.style.pointerEvents = 'none';
    c.style.background = '#050507';
    document.body.appendChild(c);
    this.canvas = c;
    const phaserCanvas = this.game.canvas;
    phaserCanvas.style.position = 'relative';
    phaserCanvas.style.zIndex = '1';
    this.syncCanvas();
    window.addEventListener('resize', this.onResize);
    this.scale.on('resize', this.onResize);
    this.resizeTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => this.syncCanvas() });
  }

  private syncCanvas(): void {
    if (!this.canvas) return;
    const r = this.game.canvas.getBoundingClientRect();
    Object.assign(this.canvas.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  }

  private teardown(): void {
    window.removeEventListener('resize', this.onResize);
    this.scale.off('resize', this.onResize);
    this.resizeTimer?.remove(false);
    this.resizeTimer = null;
    this.narration?.destroy();
    this.narration = null;
    this.world?.dispose();
    this.world = null;
    this.canvas?.remove();
    this.canvas = null;
    this.ready = false;
  }

  // ------------------------------------------------------------------ HUD
  private buildHud(phase: Phase): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, 64, 0x07080c, 0.6).setOrigin(0).setDepth(200);
    this.add.text(24, 14, `${phase.id} · ${phase.title} — ${t('spatial.garage')}`, { fontFamily: FONT_TITLE, fontSize: '22px', color: '#e8e4dc' }).setDepth(201);
    this.add.text(24, 42, phase.objective, { fontFamily: FONT_BODY, fontSize: '13px', color: '#9c978c' }).setDepth(201);
    this.add
      .text(width - 70, 22, `${getState().clues.length} ${t('explore.clues')}`, { fontFamily: FONT_BODY, fontSize: '13px', color: '#9c978c' })
      .setOrigin(1, 0.5)
      .setDepth(201);
    const menu = this.add
      .text(width - 70, 44, t('explore.menu'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#7d7970' })
      .setOrigin(1, 0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.leaveToMenu());
    this.add
      .text(width / 2, height - 12, t('spatial.hint'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#77736a' })
      .setOrigin(0.5, 1)
      .setDepth(201);
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '15px', color: '#f0ece4', backgroundColor: '#07080ccc', padding: { x: 10, y: 5 } })
      .setOrigin(0.5, 1)
      .setDepth(300)
      .setVisible(false);
    createAudioHud(this, 400);
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: kb.addKey(K.UP), down: kb.addKey(K.DOWN), left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT),
      w: kb.addKey(K.W), a: kb.addKey(K.A), s: kb.addKey(K.S), d: kb.addKey(K.D)
    };
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-ENTER', () => this.interact());
    kb.on('keydown-SPACE', () => this.interact());
    kb.on('keydown-ESC', () => (this.panel ? this.closePanel() : this.leaveToMenu()));
    ['ONE', 'TWO', 'THREE'].forEach((key, i) => {
      kb.on(`keydown-${key}`, () => {
        const choice = this.phase?.choices[i];
        if (!choice || this.leaving) return;
        this.closePanel();
        this.choose(choice.id);
      });
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (!this.world || this.panel || over.length > 0 || pointer.y < 70) return;
      const p = this.world.pickFloor(pointer.x, pointer.y);
      if (p) this.world.setWalkTarget(p.x, p.z);
    });
  }

  // ------------------------------------------------------------------ narrativa
  private async startAudio(phase: Phase): Promise<void> {
    await playPhaseAudio(this, phase);
    await preloadSfx(this, ['sfx_step_stone', 'sfx_object_pickup', 'sfx_investigate', 'ui_confirm', 'ui_click']);
    const steps: CutsceneStep[] = [];
    const line = await ensureVoiceLine(this, phaseLineId(phase.id, 'scene'));
    if (line) steps.push({ type: 'dialogue', line: { id: line.id, character: line.speaker, text: line.text, voiceAsset: voiceKey(line), duration: line.durationMs + 300 } });
    if (!this.scene.isActive() || steps.length === 0) return;
    this.narration = createCutscenePlayer(this);
    this.narration.play(steps);
  }

  private stopNarration(): void {
    this.narration?.skip();
    this.narration?.destroy();
    this.narration = null;
    stopVoice();
  }

  private interact(): void {
    if (!this.world || this.panel || this.leaving) return;
    const focus = this.world.getFocus();
    if (!focus) return;
    this.stopNarration();
    this.world.startInteract();
    void playSfxById(this, focus.kind === 'choice' ? 'sfx_investigate' : 'sfx_object_pickup');
    this.time.delayedCall(320, () => this.openPanel(focus));
  }

  private openPanel(it: InteractableSpec): void {
    if (!this.phase || this.leaving) return;
    if (it.kind === 'detail') {
      this.showPanel(it.label, it.text ?? '', [{ label: t('explore.close'), onClick: () => this.closePanel() }], it.icon);
      return;
    }
    const choice = this.phase.choices.find((c) => c.id === it.choice);
    if (!choice) return;
    this.showPanel(choice.text, t('choice.question'), [
      { label: t('explore.investigate'), primary: true, onClick: () => this.choose(choice.id) },
      { label: t('explore.back'), onClick: () => this.closePanel() }
    ], it.icon);
  }

  private choose(choiceId: string): void {
    if (!this.phase || this.leaving) return;
    this.leaving = true;
    this.stopNarration();
    void playSfxById(this, 'ui_confirm');
    const phaseId = this.phase.id;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(370, () => this.scene.start('ChoiceScene', { phaseId, choiceId }));
  }

  private showPanel(title: string, body: string, buttons: Array<{ label: string; primary?: boolean; onClick: () => void }>, icon?: string): void {
    this.closePanel();
    const { width, height } = this.cameras.main;
    const panelH = 150 + buttons.length * 34;
    const y = height - panelH - 34;
    const c = this.add.container(0, 0).setDepth(900);
    const box = this.add.rectangle(width / 2, y + panelH / 2, width - 160, panelH, 0x0b0c12, 0.94).setStrokeStyle(1, 0xb8a06a, 0.5);
    const ttl = this.add.text(120, y + 16, title, { fontFamily: FONT_TITLE, fontSize: '22px', color: '#e8e4dc' });
    const txt = this.add.text(120, y + 52, body, { fontFamily: FONT_BODY, fontSize: '16px', color: '#c9c4b8', wordWrap: { width: width - 380 }, lineSpacing: 4 });
    c.add([box, ttl, txt]);
    if (icon) {
      void ensureImage(this, icon, icon).then((ok) => {
        if (ok && this.panel === c && this.scene.isActive()) c.add(this.add.image(width - 150, y + 70, icon).setDisplaySize(96, 96));
      });
    }
    let by = y + 52 + Math.min(txt.height, 60) + 18;
    for (const b of buttons) {
      const btn = this.add
        .text(120, by, b.label, { fontFamily: FONT_BODY, fontSize: '15px', color: b.primary ? '#0b0c12' : '#e8e4dc', backgroundColor: b.primary ? '#d9b46a' : '#1c1e28', padding: { x: 14, y: 6 } })
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => b.onClick());
      c.add(btn);
      by += 34;
    }
    this.panel = c;
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  private leaveToMenu(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.stopNarration();
    void saveGame(getState()).then(() => this.scene.start('MenuScene'));
  }

  // ------------------------------------------------------------------ loop
  update(_time: number, deltaMs: number): void {
    if (!this.ready || !this.world) return;
    const dt = Math.min(0.25, deltaMs / 1000);
    const k = this.keys;
    const blocked = !!this.panel || this.leaving;
    const x = blocked ? 0 : (k.right?.isDown || k.d?.isDown ? 1 : 0) - (k.left?.isDown || k.a?.isDown ? 1 : 0);
    const y = blocked ? 0 : (k.up?.isDown || k.w?.isDown ? 1 : 0) - (k.down?.isDown || k.s?.isDown ? 1 : 0);
    const ev = this.world.step(dt, { x, y });
    if (ev.footstep && this.time.now - this.lastStepAt > 180) {
      this.lastStepAt = this.time.now;
      void playSfxById(this, 'sfx_step_stone');
    }
    this.world.render();
    const focus = this.world.getFocus();
    if (this.prompt) {
      const show = !!focus && !this.panel && !this.leaving;
      this.prompt.setVisible(show);
      if (show && focus) {
        const p = this.world.projectTheoHead();
        this.prompt.setText(`E · ${focus.kind === 'choice' ? this.phase?.choices.find((c) => c.id === focus.choice)?.text ?? focus.label : focus.label}`);
        if (p) this.prompt.setPosition(Phaser.Math.Clamp(p.x, 120, 1160), Phaser.Math.Clamp(p.y, 110, 620));
      }
    }
  }

  /** Ponto do mundo → tela (QA: clicar em pontos reais do piso). */
  debugProject(x: number, y: number, z: number): { x: number; y: number } | null {
    return this.world ? this.world.projectPoint(x, y, z) : null;
  }

  /** Estado para QA/automação (Playwright). */
  getDebugState(): (SpatialDebugState & { ready: true; panel: string[] }) | { ready: false } {
    if (!this.ready || !this.world) return { ready: false };
    const panel = this.panel ? this.panel.list.filter((o) => o.type === 'Text').map((o) => (o as Phaser.GameObjects.Text).text) : [];
    return { ...this.world.getDebugState(), ready: true, panel };
  }
}
