import { describe, it, expect } from 'vitest';
import { pad2, phaseLabel } from '@/utils/format';
import { randomInt, shuffle } from '@/utils/random';

describe('format utils', () => {
  it('pad2 zero-pads', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
    expect(pad2(123)).toBe('123');
  });

  it('phaseLabel formats', () => {
    expect(phaseLabel(1)).toBe('FASE 01');
    expect(phaseLabel(20)).toBe('FASE 20');
  });
});

describe('random utils', () => {
  it('randomInt within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const n = randomInt(1, 5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it('shuffle returns new array with same elements', () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(out).not.toBe(src);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});
