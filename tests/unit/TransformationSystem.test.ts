import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTransformationLevel,
  shouldShowTransformationEffect,
  getTransformationHint
} from '@/game/TransformationSystem';
import { resetState, getState } from '@/game/GameState';

describe('TransformationSystem', () => {
  beforeEach(() => {
    resetState();
  });

  it('level 0 => no effect anywhere', () => {
    for (const phase of [1, 7, 11, 14, 17, 20]) {
      expect(shouldShowTransformationEffect(phase)).toBe(false);
    }
    expect(getTransformationHint(7)).toBeNull();
  });

  it('level gates by phase thresholds', () => {
    getState().transformationLevel = 1;
    expect(shouldShowTransformationEffect(7)).toBe(true);
    expect(shouldShowTransformationEffect(6)).toBe(false);
    expect(shouldShowTransformationEffect(20)).toBe(true);

    getState().transformationLevel = 2;
    expect(shouldShowTransformationEffect(11)).toBe(true);
    expect(shouldShowTransformationEffect(10)).toBe(true);
    expect(shouldShowTransformationEffect(6)).toBe(false);

    getState().transformationLevel = 3;
    expect(shouldShowTransformationEffect(14)).toBe(true);
    expect(shouldShowTransformationEffect(13)).toBe(true);
    expect(shouldShowTransformationEffect(6)).toBe(false);

    getState().transformationLevel = 4;
    expect(shouldShowTransformationEffect(17)).toBe(true);
    expect(shouldShowTransformationEffect(16)).toBe(true);
    expect(shouldShowTransformationEffect(6)).toBe(false);

    getState().transformationLevel = 5;
    expect(shouldShowTransformationEffect(20)).toBe(true);
    expect(shouldShowTransformationEffect(19)).toBe(true);
    expect(shouldShowTransformationEffect(6)).toBe(false);
  });

  it('getTransformationLevel reflects state', () => {
    getState().transformationLevel = 3;
    expect(getTransformationLevel()).toBe(3);
  });

  it('hints only at exact phase + sufficient level', () => {
    getState().transformationLevel = 1;
    expect(getTransformationHint(7)).toContain('marca');
    expect(getTransformationHint(8)).toBeNull();
    expect(getTransformationHint(11)).toBeNull();
    expect(getTransformationHint(14)).toBeNull();

    getState().transformationLevel = 5;
    expect(getTransformationHint(7)).toContain('marca');
    expect(getTransformationHint(11)).toContain('olhos');
    expect(getTransformationHint(14)).toContain('sombra');
    expect(getTransformationHint(17)).toContain('respiração');
    expect(getTransformationHint(20)).toContain('cubo');
    expect(getTransformationHint(19)).toBeNull();
    expect(getTransformationHint(18)).toBeNull();
  });

  it('hint for phase 20 requires level 5', () => {
    getState().transformationLevel = 4;
    expect(getTransformationHint(20)).toBeNull();
    getState().transformationLevel = 5;
    expect(getTransformationHint(20)).not.toBeNull();
  });
});
