import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadClues,
  hasClue,
  getClue,
  getDiscoveredClues,
  clearClueCache
} from '@/game/ClueSystem';
import { resetState, getState } from '@/game/GameState';

describe('ClueSystem', () => {
  beforeEach(() => {
    resetState();
    clearClueCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearClueCache();
  });

  it('loadClues fetches and caches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'tire_mark', phase: 1, text: 'x', importance: 'medium', type: 'environment' }
      ])
    });
    vi.stubGlobal('fetch', fetchMock);
    const a = await loadClues();
    const b = await loadClues();
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hasClue reflects state', () => {
    expect(hasClue('tire_mark')).toBe(false);
    getState().clues.push('tire_mark');
    expect(hasClue('tire_mark')).toBe(true);
  });

  it('getClue finds by id or null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'eye_symbol', phase: 2, text: 't', importance: 'high', type: 'symbol' }
      ])
    }));
    expect(await getClue('eye_symbol')).not.toBeNull();
    expect(await getClue('missing')).toBeNull();
  });

  it('getDiscoveredClues filters by owned clues', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'a', phase: 1, text: 'a', importance: 'low', type: 'direct' },
        { id: 'b', phase: 2, text: 'b', importance: 'low', type: 'direct' }
      ])
    }));
    getState().clues.push('b');
    const discovered = await getDiscoveredClues();
    expect(discovered.map((c) => c.id)).toEqual(['b']);
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(loadClues()).rejects.toThrow();
  });
});
