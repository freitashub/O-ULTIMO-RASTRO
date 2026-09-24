import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadSymbols,
  hasSymbol,
  getCollectedSymbols,
  getDiarySymbols,
  getSymbolData,
  clearSymbolCache
} from '@/game/SymbolSystem';
import { resetState, getState } from '@/game/GameState';

describe('SymbolSystem', () => {
  beforeEach(() => {
    resetState();
    clearSymbolCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSymbolCache();
  });

  it('loadSymbols fetches and caches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'olho', name: 'Olho', phase: 2, assetPath: '/o.webp', diaryNote: 'n' }
      ])
    });
    vi.stubGlobal('fetch', fetchMock);
    const first = await loadSymbols();
    const second = await loadSymbols();
    expect(first).toHaveLength(1);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hasSymbol reflects state.symbols', () => {
    expect(hasSymbol('olho')).toBe(false);
    getState().symbols.push('olho');
    expect(hasSymbol('olho')).toBe(true);
  });

  it('getCollectedSymbols returns state symbols', () => {
    getState().symbols.push('olho', 'lua');
    expect(getCollectedSymbols()).toEqual(['olho', 'lua']);
  });

  it('getDiarySymbols returns cube.diarySymbols', () => {
    getState().cube.diarySymbols.push('mao');
    expect(getDiarySymbols()).toEqual(['mao']);
  });

  it('getSymbolData returns match or null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'lua', name: 'Lua', phase: 3, assetPath: '/l.webp', diaryNote: 'n' }
      ])
    }));
    expect(await getSymbolData('lua')).not.toBeNull();
    expect(await getSymbolData('rosto')).toBeNull();
  });

  it('throws when fetch not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(loadSymbols()).rejects.toThrow();
  });
});
