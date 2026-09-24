import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { setLanguage } from '@/i18n';
import { resetState } from '@/game/GameState';
import {
  buildFallbackSteps,
  buildSubtitleCues,
  cutsceneDuration,
  cutsceneVideoBases,
  findCutsceneForTrigger,
  getCutscene,
  getCutscenes,
  markCutsceneSeen,
  wasCutsceneSeen
} from '@/game/Cutscenes';

const PUBLIC = path.join(process.cwd(), 'public');

describe('Cutscenes catalog', () => {
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

  it('subtitle cues are synced to voice durations and within the video length', () => {
    for (const cs of getCutscenes()) {
      const total = cutsceneDuration(cs) * 1000;
      const cues = buildSubtitleCues(cs);
      expect(cues.length).toBe((cs.lines ?? []).length);
      for (const cue of cues) {
        expect(cue.endMs).toBeGreaterThan(cue.startMs);
        expect(cue.endMs).toBeLessThanOrEqual(total + 1500);
        expect(cue.text).toBeTruthy();
        expect(cue.speaker).toBeTruthy();
      }
    }
  });

  it('fallback steps reproduce the script timing without video', () => {
    const cs = getCutscene('opening')!;
    const steps = buildFallbackSteps(cs);
    expect(steps.some((s) => s.type === 'dialogue')).toBe(true);
    const total = steps.reduce((acc, s) => acc + (s.type === 'wait' ? s.duration ?? 0 : s.line?.duration ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(cutsceneDuration(cs) * 1000 - 1);
    for (const s of steps) if (s.type === 'dialogue') expect(s.line?.voiceAsset).toMatch(/^\/assets\/audio\/voice\//);
  });

  it('every cutscene has a real webm + mp4 on disk', () => {
    for (const cs of getCutscenes()) {
      const [base] = cutsceneVideoBases(cs, 'pt-BR');
      expect(fs.existsSync(path.join(PUBLIC, `${base}.webm`))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC, `${base}.mp4`))).toBe(true);
    }
  });

  it('localized endings prefer the language video and fall back to pt-BR', () => {
    const cs = getCutscene('ending_good')!;
    expect(cutsceneVideoBases(cs, 'en-US')).toEqual([
      '/assets/video/cutscenes/ending_good.en-US',
      '/assets/video/cutscenes/ending_good'
    ]);
    expect(cutsceneVideoBases(getCutscene('opening')!, 'en-US')).toEqual(['/assets/video/cutscenes/opening']);
  });

  it('seen flags persist in game state', () => {
    expect(wasCutsceneSeen('opening')).toBe(false);
    markCutsceneSeen('opening');
    expect(wasCutsceneSeen('opening')).toBe(true);
    resetState();
    expect(wasCutsceneSeen('opening')).toBe(false);
  });
});
