import { describe, it, expect, vi } from 'vitest';
import {
  validatePhase,
  validateAllPhases,
  PhaseValidationError
} from '@/systems/PhaseValidator';
import type { Phase } from '@/types/Phase';

function makeChoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a',
    text: 'Test',
    correct: false,
    consequence: 'X',
    justification: '',
    ...overrides
  };
}

function makePhase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    title: 'T',
    act: 1,
    intro: 'intro',
    scene: 'scene',
    objective: 'obj',
    image: '/img.png',
    choices: [
      makeChoice({ id: 'a', correct: false }),
      makeChoice({ id: 'b', correct: true, justification: 'Because' }),
      makeChoice({ id: 'c', correct: false })
    ],
    cliffhanger: 'end',
    justification: 'why',
    respiroPhase: false,
    ...overrides
  };
}

describe('PhaseValidator', () => {
  it('accepts a valid phase', () => {
    const p = validatePhase(makePhase());
    expect(p.id).toBe(1);
  });

  it('rejects non-object', () => {
    expect(() => validatePhase(null)).toThrow(PhaseValidationError);
    expect(() => validatePhase('x')).toThrow(PhaseValidationError);
  });

  it('rejects wrong number of choices', () => {
    const ph = makePhase({ choices: [makeChoice()] });
    expect(() => validatePhase(ph)).toThrow('exatamente 3');
  });

  it('rejects zero or two correct choices', () => {
    const allFalse = makePhase({
      choices: [makeChoice({ correct: false }), makeChoice({ id: 'b', correct: false }), makeChoice({ id: 'c', correct: false })]
    });
    expect(() => validatePhase(allFalse)).toThrow('exatamente 1 correta');

    const twoTrue = makePhase({
      choices: [makeChoice({ correct: true, justification: 'j' }), makeChoice({ id: 'b', correct: true, justification: 'k' }), makeChoice({ id: 'c', correct: false })]
    });
    expect(() => validatePhase(twoTrue)).toThrow('exatamente 1 correta');
  });

  it('rejects correct choice without justification', () => {
    const ph = makePhase({
      choices: [
        makeChoice({ correct: false }),
        makeChoice({ id: 'b', correct: true, justification: '   ' }),
        makeChoice({ id: 'c', correct: false })
      ]
    });
    expect(() => validatePhase(ph)).toThrow('sem justificativa');
  });

  it('rejects missing required fields', () => {
    const ph = makePhase();
    delete (ph as Record<string, unknown>).title;
    expect(() => validatePhase(ph)).toThrow('title');
  });

  it('validateAllPhases maps over array', () => {
    const result = validateAllPhases([makePhase(), makePhase({ id: 2 })]);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe(2);
  });

  it('PhaseValidationError carries phaseId', () => {
    try {
      validatePhase(makePhase({ choices: [makeChoice()] }));
    } catch (e) {
      expect(e).toBeInstanceOf(PhaseValidationError);
      expect((e as PhaseValidationError).phaseId).toBe(1);
    }
  });

  it('every phase in phases.json is valid', async () => {
    const phasesData = (await import('@/data/phases.json')).default;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => phasesData
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const { loadAllPhases, clearPhaseCache } = await import('@/systems/PhaseLoader');
      clearPhaseCache();
      const phases = await loadAllPhases();
      expect(phases.length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledWith('/data/phases.json');
      for (const p of phases) {
        expect(() => validatePhase(p)).not.toThrow();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('phase type has required structure', () => {
    const p = makePhase() as unknown as Phase;
    expect(typeof p.choices[0].justification).toBe('string');
  });
});
