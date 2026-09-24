import { describe, it, expect } from 'vitest';
import phases from '@/data/phases.json';
import clues from '@/data/clues.json';
import symbols from '@/data/symbols.json';

describe('data integrity', () => {
  it('phases.json: 20 valid phases', () => {
    expect(phases).toHaveLength(20);
    expect(phases.map((p) => p.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
    for (const phase of phases) {
      expect(typeof phase.id).toBe('number');
      expect(typeof phase.title).toBe('string');
      expect(phase.choices).toHaveLength(3);
      expect(phase.choices.filter((c) => c.correct)).toHaveLength(1);
      const correct = phase.choices.find((c) => c.correct)!;
      expect(correct.justification.trim()).not.toBe('');
      expect(typeof phase.respiroPhase).toBe('boolean');
      expect(typeof phase.cliffhanger).toBe('string');
      expect(typeof phase.justification).toBe('string');
    }
  });

  it('respiro phases are 4, 6, 8, 10', () => {
    const respiros = phases.filter((p) => p.respiroPhase).map((p) => p.id);
    expect(respiros).toEqual([4, 6, 8, 10]);
  });

  it('symbol rewards match spec phases 2,3,5,9,14', () => {
    const byPhase = new Map(phases.map((p) => [p.id, p.symbolReward]));
    expect(byPhase.get(2)).toBe('olho');
    expect(byPhase.get(3)).toBe('lua');
    expect(byPhase.get(5)).toBe('mao');
    expect(byPhase.get(9)).toBe('corvo');
    expect(byPhase.get(14)).toBe('arvore');
  });

  it('every phase has revelation and cliffhanger', () => {
    for (const phase of phases) {
      expect(phase.revelation).toBeTruthy();
      expect(phase.cliffhanger).toBeTruthy();
    }
  });

  it('phases 1-3 clueRewards exist in clues.json', () => {
    for (const phase of phases) {
      const correct = phase.choices.find((c) => c.correct)!;
      if (correct.clueReward) {
        expect(clues.map((c) => c.id)).toContain(correct.clueReward);
      }
    }
  });

  it('all clueRewards across 20 phases exist in clues.json', () => {
    const clueIds = clues.map((c) => c.id);
    for (const phase of phases) {
      const correct = phase.choices.find((c) => c.correct)!;
      if (correct.clueReward) {
        expect(clueIds).toContain(correct.clueReward);
      }
    }
  });

  it('symbolRewards exist in symbols.json', () => {
    for (const phase of phases) {
      if (phase.symbolReward) {
        expect(symbols.map((s) => s.id)).toContain(phase.symbolReward);
      }
    }
  });

  it('symbols.json has 6 symbols (5 collectible + rosto)', () => {
    expect(symbols).toHaveLength(6);
    expect(symbols.map((s) => s.id).sort()).toEqual(
      ['arvore', 'corvo', 'lua', 'mao', 'olho', 'rosto'].sort()
    );
  });

  it('clues have required fields and optional v3 fields', () => {
    expect(clues.length).toBeGreaterThanOrEqual(21);
    for (const clue of clues) {
      expect(clue.id).toBeTruthy();
      expect(typeof clue.phase).toBe('number');
      expect(['low', 'medium', 'high']).toContain(clue.importance);
      if (clue.linkedFlags) expect(Array.isArray(clue.linkedFlags)).toBe(true);
      if (clue.relatedSymbols) expect(Array.isArray(clue.relatedSymbols)).toBe(true);
      if (clue.futureReferences) expect(Array.isArray(clue.futureReferences)).toBe(true);
    }
  });

  it('cube config solution matches phase order 2,3,5,9,14', async () => {
    const cube = (await import('@/data/cubeConfig.json')).default;
    expect(cube.solution).toEqual(['olho', 'lua', 'mao', 'corvo', 'arvore']);
    expect(cube.faces).toHaveLength(6);
    expect(cube.hiddenFace).toBe('rosto');
    expect(cube.mappings).toHaveLength(6);
    const positions = cube.mappings.map((m: { position: number }) => m.position).sort();
    expect(positions).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('public/data mirrors src/data for phases', async () => {
    const pub = await import('../../public/data/phases.json');
    const pubPhases = (pub as { default?: typeof phases }).default ?? pub;
    expect(JSON.stringify(pubPhases)).toBe(JSON.stringify(phases));
  });
});
