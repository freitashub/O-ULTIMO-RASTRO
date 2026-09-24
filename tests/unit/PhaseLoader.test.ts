import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadAllPhases,
  getPhase,
  phaseExists,
  clearPhaseCache
} from '@/systems/PhaseLoader';

const validPhase = {
  id: 1,
  title: 'T',
  act: 1,
  intro: 'i',
  scene: 's',
  objective: 'o',
  image: '/img.png',
  choices: [
    { id: 'a', text: 'A', correct: false, consequence: 'c', justification: '' },
    { id: 'b', text: 'B', correct: true, consequence: 'c', justification: 'why' },
    { id: 'c', text: 'C', correct: false, consequence: 'c', justification: '' }
  ],
  cliffhanger: 'cl',
  justification: 'j',
  respiroPhase: false
};

describe('PhaseLoader', () => {
  beforeEach(() => {
    clearPhaseCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearPhaseCache();
  });

  it('loads phases from real data via fetch mock', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase])
    }));
    const phases = await loadAllPhases();
    expect(phases).toHaveLength(1);
    expect(phases[0].id).toBe(1);
  });

  it('caches result (fetch called once)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase])
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadAllPhases();
    await loadAllPhases();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadAllPhases()).rejects.toThrow('404');
  });

  it('throws when payload is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ not: 'array' })
    }));
    await expect(loadAllPhases()).rejects.toThrow('array');
  });

  it('getPhase returns matching phase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase, { ...validPhase, id: 2 }])
    }));
    const p = await getPhase(2);
    expect(p.id).toBe(2);
  });

  it('getPhase throws for missing phase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase])
    }));
    await expect(getPhase(99)).rejects.toThrow('não encontrada');
  });

  it('phaseExists false before load, true after', async () => {
    expect(phaseExists(1)).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase])
    }));
    await loadAllPhases();
    expect(phaseExists(1)).toBe(true);
    expect(phaseExists(99)).toBe(false);
  });

  it('clearPhaseCache resets cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([validPhase])
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadAllPhases();
    clearPhaseCache();
    await loadAllPhases();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('real phases.json has exactly 3 choices each and 1 correct', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        const mod = await import('@/data/phases.json');
        return (mod as unknown as { default: unknown }).default ?? mod;
      }
    }));
    const phases = await loadAllPhases();
    for (const phase of phases) {
      expect(phase.choices).toHaveLength(3);
      expect(phase.choices.filter((c) => c.correct)).toHaveLength(1);
    }
  });
});
