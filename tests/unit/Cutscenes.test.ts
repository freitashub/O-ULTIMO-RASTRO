import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { setLanguage } from '@/i18n';
import { resetState } from '@/game/GameState';
import {
  buildFallbackSteps,
  buildSubtitleCues,
  cutsceneDuration,
  findCutsceneForTrigger,
  getCutscene,
  getCutscenes,
  markCutsceneSeen,
  resolveLines,
  stageActors,
  wasCutsceneSeen
} from '@/game/Cutscenes';
import { hasVoiceLine } from '@/game/VoiceLines';
import { spritePath } from '@/game/SpriteCatalog';
import { listSfx, musicPath, ambiencePath } from '@/game/SceneAudio';

const PUBLIC = path.join(process.cwd(), 'public');

describe('Cutscenes (stage scripts)', () => {
  beforeEach(() => {
    setLanguage('pt-BR');
    resetState();
  });

  it('defines the 10 required cutscenes with triggers', () => {
    const ids = getCutscenes().map((c) => c.id);
    for (const id of ['opening', 'parents_gone', 'first_troll', 'revelations', 'boss', 'transformation', 'cube', 'ending_good', 'ending_bad', 'ending_secret']) {
      expect(ids).toContain(id);
    }
    expect(findCutsceneForTrigger({ type: 'beforePhase', phase: 1 })?.id).toBe('opening');
    expect(findCutsceneForTrigger({ type: 'beforePhase', phase: 3 })?.id).toBe('first_troll');
    expect(findCutsceneForTrigger({ type: 'beforePhase', phase: 5 })).toBeNull();
    expect(findCutsceneForTrigger({ type: 'beforePuzzle' })?.id).toBe('cube');
    expect(findCutsceneForTrigger({ type: 'ending', ending: 'secret' })?.id).toBe('ending_secret');
  });

  it('every stage action references real assets (voices, sprites, sfx, music, ambience, backgrounds)', () => {
    for (const cs of getCutscenes()) {
      expect(cs.stage.length).toBeGreaterThan(3);
      expect(cs.stage.some((a) => a.a === 'spawn')).toBe(true);
      expect(cs.stage.some((a) => a.a === 'say')).toBe(true);
      for (const a of cs.stage) {
        if (a.a === 'say') expect(hasVoiceLine(a.voice, 'pt-BR')).toBe(true);
        if (a.a === 'spawn') {
          const p = spritePath(a.actor);
          expect(p).not.toBeNull();
          expect(fs.existsSync(path.join(PUBLIC, p!))).toBe(true);
        }
        if (a.a === 'sfx') expect(listSfx()).toContain(a.id);
        if (a.a === 'music' && a.track) expect(musicPath(a.track)).not.toBeNull();
        if (a.a === 'ambience' && a.id) expect(ambiencePath(a.id)).not.toBeNull();
        if (a.a === 'bg' && a.image) expect(fs.existsSync(path.join(PUBLIC, a.image))).toBe(true);
      }
      expect(stageActors(cs)).toContain(cs.id === 'ending_bad' ? 'theo_t4' : 'theo');
    }
  });

  it('subtitle cues follow the estimated timeline and voice durations', () => {
    for (const cs of getCutscenes()) {
      const cues = buildSubtitleCues(cs);
      const lines = resolveLines(cs);
      expect(cues.length).toBe(lines.length);
      let prev = -1;
      for (const cue of cues) {
        expect(cue.endMs).toBeGreaterThan(cue.startMs);
        expect(cue.startMs).toBeGreaterThanOrEqual(prev);
        prev = cue.startMs;
        expect(cue.text).toBeTruthy();
        expect(cue.speaker).toBeTruthy();
      }
      expect(cutsceneDuration(cs)).toBeGreaterThan(5);
      expect(cutsceneDuration(cs)).toBeLessThan(120);
    }
  });

  it('fallback steps reproduce the script timing', () => {
    const cs = getCutscene('opening')!;
    const steps = buildFallbackSteps(cs);
    expect(steps.some((s) => s.type === 'dialogue')).toBe(true);
    for (const s of steps) if (s.type === 'dialogue') expect(s.line?.voiceAsset).toMatch(/^\/assets\/audio\/voice\//);
  });

  it('localized endings resolve voices in the current language', () => {
    setLanguage('en-US');
    const lines = resolveLines(getCutscene('ending_good')!);
    expect(lines[0].line.lang).toBe('en-US');
    const opening = resolveLines(getCutscene('opening')!);
    expect(opening.find((l) => l.line.id === 'intro_text')?.line.lang).toBe('en-US');
    expect(opening.find((l) => l.line.id === 'phase01_intro')?.line.lang).toBe('pt-BR');
  });

  it('seen flags persist in game state', () => {
    expect(wasCutsceneSeen('opening')).toBe(false);
    markCutsceneSeen('opening');
    expect(wasCutsceneSeen('opening')).toBe(true);
    resetState();
    expect(wasCutsceneSeen('opening')).toBe(false);
  });
});
