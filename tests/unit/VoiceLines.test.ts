import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { setLanguage } from '@/i18n';
import {
  getVoiceLine,
  getVoicePath,
  hasVoiceLine,
  countVoiceLines,
  phaseLineId,
  choiceLineId,
  getVoiceSpeakers
} from '@/game/VoiceLines';
import phases from '@/data/phases.json';

const PUBLIC = path.join(process.cwd(), 'public');

describe('VoiceLines', () => {
  beforeEach(() => setLanguage('pt-BR'));

  it('has pt-BR narration for every phase field and choice', () => {
    for (const p of phases) {
      for (const part of ['intro', 'scene', 'revelation', 'cliffhanger'] as const) {
        expect(hasVoiceLine(phaseLineId(p.id, part), 'pt-BR')).toBe(true);
      }
      for (const c of p.choices) expect(hasVoiceLine(choiceLineId(p.id, c.id), 'pt-BR')).toBe(true);
    }
  });

  it('falls back to pt-BR when the current language has no dub', () => {
    setLanguage('en-US');
    const line = getVoiceLine('phase01_intro');
    expect(line?.lang).toBe('pt-BR');
    const intro = getVoiceLine('intro_text');
    expect(intro?.lang).toBe('en-US');
    setLanguage('es-ES');
    expect(getVoiceLine('ending_good')?.lang).toBe('es-ES');
  });

  it('every catalogued line has a real ogg + mp3 on disk with sane duration', () => {
    const all = countVoiceLines();
    expect(all).toBeGreaterThanOrEqual(190);
    const langs = ['pt-BR', 'en-US', 'es-ES'];
    for (const lang of langs) expect(countVoiceLines(lang)).toBeGreaterThan(0);
    const sample = ['phase01_intro', 'theo_q1', 'phase04_silas_01', 'phase03_troll_01', 'ending_bad'];
    for (const id of sample) {
      const line = getVoiceLine(id, 'pt-BR')!;
      const ogg = path.join(PUBLIC, getVoicePath(line));
      expect(fs.existsSync(ogg)).toBe(true);
      expect(fs.existsSync(ogg.replace(/\.ogg$/, '.mp3'))).toBe(true);
      expect(line.durationMs).toBeGreaterThan(500);
      expect(line.durationMs).toBeLessThan(20000);
    }
  });

  it('exposes the 8 voice identities', () => {
    const speakers = Object.keys(getVoiceSpeakers());
    for (const s of ['narrator', 'theo', 'clara', 'elias', 'silas', 'troll', 'troll_boss', 'prisoner']) {
      expect(speakers).toContain(s);
    }
  });
});
