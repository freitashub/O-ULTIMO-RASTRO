import Phaser from 'phaser';
import { getPhase } from '@/systems/PhaseLoader';
import { setCurrentPhase, getState } from '@/game/GameState';
import { saveGame } from '@/game/SaveManager';
import { getTransformationHint, getTransformationLevel } from '@/game/TransformationSystem';
import { getTransformationImagePath } from '@/game/CharacterMap';
import { ensureImage } from '@/game/OptionalAssets';
import { CutscenePlayer, CutsceneStep, createCutscenePlayer } from '@/systems/CutscenePlayer';
import { ensureVoiceLine, playPhaseAudio, playSfxById, preloadSfx, voiceKey } from '@/game/SceneAudio';
import { phaseLineId } from '@/game/VoiceLines';
import { stopVoice } from '@/game/AudioManager';
import { ActorSprite } from '@/game/ActorSprite';
import { SceneLayout, SceneObject, depthScaleFor, getSceneLayout } from '@/game/SceneLayouts';
import { addBackdrop, ensureRadialTexture, FONT_BODY, FONT_TITLE } from '@/ui/Atmosphere';
import { createAudioHud } from '@/ui/AudioHud';
import { t } from '@/i18n';
import { Phase } from '@/types/Phase';
import { spatialEnabled } from '@/scenes/SpatialScene';

interface StorySceneData {
  phaseId: number;
  /** força a exploração 2D (fallback quando o runtime 3D falha) */
  force2d?: boolean;
}

/** Fases já migradas para o runtime espacial (vertical slice). */
const SPATIAL_PHASES = new Set([1]);

interface Hotspot {
  obj: SceneObject;
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  near: boolean;
}

const ACCENT = 0xd9b46a;
const INTERACT_RADIUS = 120;

/**
 * Cena de exploração 2D da fase: Theo anda pelo cenário, objetos da narrativa são hotspots,
 * escolhas são lugares/pessoas para investigar. Substitui o painel de texto estático.
 */
export class StoryScene extends Phaser.Scene {
  private phase: Phase | null = null;
  private layout: SceneLayout | null = null;
  private theo: ActorSprite | null = null;
  private npc: ActorSprite | null = null;
  private hotspots: Hotspot[] = [];
  private narration: CutscenePlayer | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key> | null = null;
  private panel: Phaser.GameObjects.Container | null = null;
  private light: Phaser.GameObjects.Image | null = null;
  private bg: Phaser.GameObjects.Image | null = null;
  private busy = false;
  private nearText: Phaser.GameObjects.Text | null = null;
  private lastStepAt = 0;

  constructor() {
    super({ key: 'StoryScene' });
  }

  async create(data: StorySceneData): Promise<void> {
    const phaseId = data?.phaseId ?? 1;
    if (SPATIAL_PHASES.has(phaseId) && !data?.force2d && spatialEnabled()) {
      this.scene.start('SpatialScene', { phaseId });
      return;
    }
    setCurrentPhase(phaseId);
    this.cameras.main.setBackgroundColor('#07080c');
    this.hotspots = [];
    this.panel = null;
    this.busy = false;
    this.theo = null;
    this.npc = null;
    this.narration = null;

    try {
      this.phase = await getPhase(phaseId);
    } catch {
      this.phase = null;
    }
    if (!this.phase) {
      this.renderWorkInProgress(phaseId);
      return;
    }
    const phase = this.phase;
    await saveGame(getState());
    this.layout = getSceneLayout(phase.id) ?? this.defaultLayout(phase.id);
    const layout = this.layout;

    this.cameras.main.setBackgroundColor('#07080c');
    this.bg = await addBackdrop(this, phase.image, { zoom: false, weather: layout.weather, darken: this.darkenFor(layout) });
    if (!this.scene.isActive()) return;
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.addLight(layout);

    await this.spawnActors(phase, layout);
    if (!this.scene.isActive()) return;
    this.buildHotspots(phase, layout);
    this.buildHud(phase);
    this.bindInput();
    void this.startAudio(phase);
  }

  // ------------------------------------------------------------ setup
  private defaultLayout(phaseId: number): SceneLayout {
    return {
      phase: phaseId,
      weather: 'dust',
      light: 'moon',
      walk: { minX: 80, maxX: 1200, minY: 580, maxY: 690 },
      spawn: [200, 670],
      objects: []
    };
  }

  private darkenFor(layout: SceneLayout): number {
    switch (layout.light) {
      case 'dark':
        return 0.45;
      case 'moon':
      case 'cube':
        return 0.25;
      case 'lamp':
      case 'fire':
        return 0.2;
      case 'illusion':
        return 0.1;
      default:
        return 0.12;
    }
  }

  private addLight(layout: SceneLayout): void {
    const key = ensureRadialTexture(this);
    const tint: Record<string, number> = {
      lamp: 0xffd9a0,
      moon: 0x9fb8e8,
      dark: 0xd0d8ff,
      neon: 0xcfe8ff,
      day: 0xffffff,
      fire: 0xffa050,
      illusion: 0xd8b8ff,
      cube: 0x8fe0ff
    };
    this.light = this.add
      .image(640, 600, key)
      .setDisplaySize(720, 720)
      .setTint(tint[layout.light] ?? 0xffffff)
      .setAlpha(layout.light === 'day' ? 0.08 : 0.28)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4);
  }

  private async spawnActors(phase: Phase, layout: SceneLayout): Promise<void> {
    const depthScale = depthScaleFor(layout);
    const level = getTransformationLevel();
    const theoId = level >= 4 ? 'theo_t4' : level >= 2 ? 'theo_t2' : 'theo';
    this.theo = new ActorSprite(this, theoId, layout.spawn[0], layout.spawn[1], { height: 270, depthScale, speed: 190 });
    await this.theo.load();
    this.theo.onStep(() => {
      const now = this.time.now;
      if (now - this.lastStepAt < 180) return;
      this.lastStepAt = now;
      void playSfxById(this, this.stepSfx(phase.id));
    });
    if (layout.npc) {
      this.npc = new ActorSprite(this, layout.npc.id, layout.npc.x, layout.npc.y, {
        height: layout.npc.id === 'troll' ? 330 : 285,
        depthScale,
        ghost: layout.npc.ghost,
        silhouette: layout.npc.silhouette
      });
      await this.npc.load();
      this.npc.setFacing(layout.npc.facing ?? -1);
    }
  }

  private stepSfx(phaseId: number): string {
    if ([1, 4, 5, 7, 9, 13, 16].includes(phaseId)) return 'sfx_step_wood';
    if ([3, 6, 8, 10, 11, 12, 14, 15].includes(phaseId)) return 'sfx_step_gravel';
    return 'sfx_step_stone';
  }

  private buildHotspots(phase: Phase, layout: SceneLayout): void {
    for (const obj of layout.objects) {
      const label = obj.kind === 'choice' ? phase.choices.find((c) => c.id === obj.choice)?.text ?? obj.label ?? '' : obj.label ?? '';
      const container = this.add.container(obj.x, obj.y).setDepth(obj.y + 1);
      const ring = this.add.circle(0, 0, obj.kind === 'choice' ? 16 : 11, ACCENT, 0).setStrokeStyle(2, obj.kind === 'choice' ? ACCENT : 0xcfd6e6, 0.85);
      const core = this.add.circle(0, 0, obj.kind === 'choice' ? 5 : 3, obj.kind === 'choice' ? ACCENT : 0xcfd6e6, 0.9);
      const text = this.add
        .text(0, -30, label, {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: '#f0ece4',
          backgroundColor: '#07080ccc',
          padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5, 1)
        .setAlpha(0);
      container.add([ring, core, text]);
      if (!getState().accessibilitySettings.reduceMotion) {
        this.tweens.add({ targets: ring, scale: { from: 1, to: 1.6 }, alpha: { from: 0.9, to: 0 }, duration: 1600, repeat: -1, ease: 'Sine.easeOut' });
      }
      const zone = this.add.zone(obj.x, obj.y, 70, 70).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => text.setAlpha(1));
      zone.on('pointerout', () => { if (!this.isNear(obj)) text.setAlpha(0); });
      zone.on('pointerdown', () => void this.approachAndInteract(obj));
      this.hotspots.push({ obj, container, ring, label: text, near: false });
    }
    if (layout.npc?.talk && this.npc) {
      const npc = layout.npc;
      const zone = this.add.zone(npc.x, npc.y - 130, 140, 280).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => void this.approachAndTalk());
    }
  }

  private buildHud(phase: Phase): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, 64, 0x07080c, 0.55).setOrigin(0).setDepth(200);
    this.add
      .text(24, 14, `${phase.id} · ${phase.title}`, { fontFamily: FONT_TITLE, fontSize: '22px', color: '#e8e4dc', letterSpacing: 1 })
      .setDepth(201);
    this.add
      .text(24, 42, phase.objective, { fontFamily: FONT_BODY, fontSize: '13px', color: '#9c978c' })
      .setDepth(201);
    const clues = getState().clues.length;
    this.add
      .text(width - 70, 22, `${clues} ${t('explore.clues')}`, { fontFamily: FONT_BODY, fontSize: '13px', color: '#9c978c' })
      .setOrigin(1, 0.5)
      .setDepth(201);
    // marca da transformação (nível atual) ao lado do contador
    const level = getTransformationLevel();
    const markPath = level > 0 ? getTransformationImagePath(level) : '/images/transformation/theo_t0.png';
    if (markPath) {
      void ensureImage(this, markPath, markPath).then((ok) => {
        if (ok && this.scene.isActive()) this.add.image(width - 200, 32, markPath).setDisplaySize(36, 36).setDepth(201).setAlpha(level > 0 ? 0.95 : 0.45);
      });
    }
    const menuBtn = this.add
      .text(width - 70, 44, t('explore.menu'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#7d7970' })
      .setOrigin(1, 0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.leaveToMenu());
    this.add
      .text(width / 2, height - 14, t('explore.hint'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#6f6b63' })
      .setOrigin(0.5, 1)
      .setDepth(201);
    const hint = getTransformationHint(phase.id);
    if (hint) {
      this.add
        .text(width / 2, 84, hint, { fontFamily: FONT_BODY, fontSize: '14px', color: '#b59cff', fontStyle: 'italic' })
        .setOrigin(0.5, 0)
        .setDepth(201)
        .setAlpha(0.9);
    }
    this.nearText = this.add
      .text(0, 0, t('explore.near'), { fontFamily: FONT_BODY, fontSize: '12px', color: '#d9b46a' })
      .setOrigin(0.5)
      .setDepth(202)
      .setVisible(false);
    createAudioHud(this, 300);
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    kb.on('keydown-E', () => this.interactNearest());
    kb.on('keydown-ENTER', () => this.interactNearest());
    kb.on('keydown-ESC', () => (this.panel ? this.closePanel() : this.leaveToMenu()));
    ['ONE', 'TWO', 'THREE'].forEach((key, i) => {
      kb.on(`keydown-${key}`, () => {
        if (this.busy || !this.phase) return;
        const choice = this.phase.choices[i];
        if (!choice) return;
        this.closePanel();
        this.chooseDirectly(choice.id);
      });
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.panel || this.busy || over.length > 0 || !this.layout || !this.theo) return;
      if (pointer.y < 70) return;
      const { minX, maxX, minY, maxY } = this.layout.walk;
      const x = Phaser.Math.Clamp(pointer.worldX, minX, maxX);
      const y = Phaser.Math.Clamp(pointer.worldY, minY, maxY);
      void this.theo.walkTo(x, y);
    });
  }

  // ------------------------------------------------------------ audio / narration
  private async startAudio(phase: Phase): Promise<void> {
    await playPhaseAudio(this, phase);
    await preloadSfx(this, ['ui_click', 'sfx_step_wood', 'sfx_step_gravel', 'sfx_step_stone', 'sfx_object_pickup', 'sfx_paper_rustle']);
    const steps: CutsceneStep[] = [];
    for (const part of ['intro', 'scene'] as const) {
      const line = await ensureVoiceLine(this, phaseLineId(phase.id, part));
      if (line) {
        steps.push({
          type: 'dialogue',
          line: { id: line.id, character: line.speaker, text: line.text, voiceAsset: voiceKey(line), duration: line.durationMs + 300 }
        });
      }
    }
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

  // ------------------------------------------------------------ interaction
  private isNear(obj: SceneObject): boolean {
    if (!this.theo) return false;
    return Phaser.Math.Distance.Between(this.theo.x, this.theo.y, obj.x, Math.max(obj.y, this.layout?.walk.minY ?? obj.y)) < INTERACT_RADIUS;
  }

  private nearestHotspot(): Hotspot | null {
    if (!this.theo || !this.layout) return null;
    let best: Hotspot | null = null;
    let bestD = INTERACT_RADIUS;
    for (const h of this.hotspots) {
      const d = Phaser.Math.Distance.Between(this.theo.x, this.theo.y, h.obj.x, Math.max(h.obj.y, this.layout.walk.minY));
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  }

  private npcNear(): boolean {
    if (!this.theo || !this.npc || !this.layout?.npc?.talk) return false;
    return Phaser.Math.Distance.Between(this.theo.x, this.theo.y, this.npc.x, this.npc.y) < INTERACT_RADIUS + 40;
  }

  private interactNearest(): void {
    if (this.panel || this.busy) return;
    const h = this.nearestHotspot();
    if (h) {
      this.openObject(h.obj);
      return;
    }
    if (this.npcNear()) this.openTalk();
  }

  private standPointFor(x: number, y: number): { x: number; y: number } {
    const w = this.layout?.walk ?? { minX: 80, maxX: 1200, minY: 580, maxY: 690 };
    return { x: Phaser.Math.Clamp(x, w.minX, w.maxX), y: Phaser.Math.Clamp(Math.max(y, w.minY + 20), w.minY, w.maxY) };
  }

  private async approachAndInteract(obj: SceneObject): Promise<void> {
    if (this.panel || this.busy || !this.theo) return;
    this.busy = true;
    const p = this.standPointFor(obj.x, obj.y);
    await this.theo.walkTo(p.x, p.y);
    this.busy = false;
    if (this.scene.isActive()) this.openObject(obj);
  }

  private async approachAndTalk(): Promise<void> {
    if (this.panel || this.busy || !this.theo || !this.npc) return;
    this.busy = true;
    const side = this.theo.x < this.npc.x ? -1 : 1;
    const p = this.standPointFor(this.npc.x + side * 110, this.npc.y);
    await this.theo.walkTo(p.x, p.y);
    this.theo.setFacing(side < 0 ? 1 : -1);
    this.busy = false;
    if (this.scene.isActive()) this.openTalk();
  }

  private openObject(obj: SceneObject): void {
    if (!this.phase) return;
    this.stopNarration();
    void playSfxById(this, obj.kind === 'choice' ? 'sfx_investigate' : 'sfx_object_pickup');
    if (obj.kind === 'detail') {
      this.showPanel(obj.label ?? '', obj.text ?? '', [{ label: t('explore.close'), onClick: () => this.closePanel() }], obj.icon);
      return;
    }
    const choice = this.phase.choices.find((c) => c.id === obj.choice);
    if (!choice) return;
    this.showPanel(choice.text, t('choice.question'), [
      { label: t('explore.investigate'), primary: true, onClick: () => this.chooseDirectly(choice.id) },
      { label: t('explore.back'), onClick: () => this.closePanel() }
    ]);
  }

  private openTalk(): void {
    if (!this.phase || !this.layout?.npc) return;
    this.stopNarration();
    const npcName = t(`subtitle.speaker.${this.layout.npc.name}`);
    const quote = this.phase.scene;
    this.showPanel(
      npcName,
      quote,
      [
        ...this.phase.choices.map((c) => ({ label: c.text, primary: true, onClick: () => this.chooseDirectly(c.id) })),
        { label: t('explore.back'), onClick: () => this.closePanel() }
      ],
      undefined
    );
  }

  private chooseDirectly(choiceId: string): void {
    if (!this.phase) return;
    this.stopNarration();
    void playSfxById(this, 'ui_confirm');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    const phaseId = this.phase.id;
    this.time.delayedCall(320, () => this.scene.start('ChoiceScene', { phaseId, choiceId }));
  }

  private showPanel(
    title: string,
    body: string,
    buttons: Array<{ label: string; primary?: boolean; onClick: () => void }>,
    icon?: string
  ): void {
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
    buttons.forEach((b) => {
      const btn = this.add
        .text(120, by, b.label, {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          color: b.primary ? '#0b0c12' : '#e8e4dc',
          backgroundColor: b.primary ? '#d9b46a' : '#1c1e28',
          padding: { x: 14, y: 6 }
        })
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setAlpha(0.85));
      btn.on('pointerout', () => btn.setAlpha(1));
      btn.on('pointerdown', () => b.onClick());
      c.add(btn);
      by += 34;
    });
    this.panel = c;
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  private leaveToMenu(): void {
    this.stopNarration();
    void saveGame(getState()).then(() => this.scene.start('MenuScene'));
  }

  // ------------------------------------------------------------ loop
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    if (!this.theo || !this.layout) return;
    if (!this.panel && !this.busy && this.cursors && this.wasd) {
      const left = this.cursors.left.isDown || this.wasd.A.isDown;
      const right = this.cursors.right.isDown || this.wasd.D.isDown;
      const up = this.cursors.up.isDown || this.wasd.W.isDown;
      const down = this.cursors.down.isDown || this.wasd.S.isDown;
      const dx = (right ? 1 : 0) - (left ? 1 : 0);
      const dy = (down ? 1 : 0) - (up ? 1 : 0);
      if (dx !== 0 || dy !== 0) this.theo.move(dx, dy, dt, this.layout.walk);
      else if (!this.theo.isWalking()) this.theo.move(0, 0, dt);
    }
    this.theo.tick(dt);
    this.npc?.tick(dt);
    // luz segue Theo; fundo com leve parallax
    if (this.light) this.light.setPosition(this.theo.x, this.theo.y - 120);
    if (this.bg) this.bg.setX(640 - (this.theo.x - 640) * 0.03);
    // rótulos dos hotspots próximos
    let nearAny: Hotspot | null = null;
    for (const h of this.hotspots) {
      const near = this.isNear(h.obj);
      if (near !== h.near) {
        h.near = near;
        h.label.setAlpha(near ? 1 : 0);
      }
      if (near) nearAny = h;
    }
    if (this.nearText) {
      const showNpc = this.npcNear();
      const show = !this.panel && (nearAny !== null || showNpc);
      this.nearText.setVisible(show);
      if (show) this.nearText.setPosition(this.theo.x, this.theo.y - 300 * this.theo.scale);
    }
  }

  // ------------------------------------------------------------ fallback
  private renderWorkInProgress(phaseId: number): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0B0B10');
    this.add.text(width / 2, height / 2 - 40, `FASE ${phaseId}`, { fontFamily: FONT_TITLE, fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 10, t('wip.title'), { fontFamily: FONT_BODY, fontSize: '20px', color: '#888888' }).setOrigin(0.5);
    const btn = this.add
      .text(width / 2, height / 2 + 80, t('wip.menu'), { fontFamily: FONT_BODY, fontSize: '18px', color: '#ffffff', backgroundColor: '#1a1a22', padding: { x: 20, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
