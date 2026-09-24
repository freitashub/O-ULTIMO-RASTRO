import { describe, it, expect } from 'vitest';
import {
  getPacks,
  getPack,
  getPreloadEntries,
  getOptionalEntries,
  hasEntry,
  findEntry
} from '@/game/AssetRegistry';

describe('AssetRegistry', () => {
  it('has core packs', () => {
    const packs = getPacks();
    expect(packs).toContain('core');
    expect(packs).toContain('audio');
    expect(packs).toContain('images');
  });

  it('core pack has phases entry', () => {
    const core = getPack('core');
    expect(core.some((e) => e.id === 'phases')).toBe(true);
    expect(core.some((e) => e.id === 'cube-config')).toBe(true);
    expect(core.some((e) => e.id === 'assets-manifest')).toBe(true);
  });

  it('preload entries are required only', () => {
    const preload = getPreloadEntries();
    expect(preload.length).toBeGreaterThan(0);
    for (const entry of preload) {
      expect(entry.optional).not.toBe(true);
    }
  });

  it('optional entries marked optional', () => {
    const optional = getOptionalEntries();
    expect(optional.length).toBeGreaterThan(0);
    for (const entry of optional) {
      expect(entry.optional).toBe(true);
    }
  });

  it('findEntry locates known ids', () => {
    expect(hasEntry('phases')).toBe(true);
    expect(hasEntry('bgm_main')).toBe(true);
    expect(findEntry('symbol_olho')?.kind).toBe('image');
    expect(findEntry('bg_phase01')?.path).toBe('/assets/backgrounds/phase-01-casa.webp');
    expect(findEntry('missing')).toBeNull();
  });
});
