import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  setState,
  resetState,
  incrementErrors,
  setCurrentPhase,
  registerChoice,
  changePoliceTrust,
  getSaveVersion
} from '@/game/GameState';
import { createInitialGameState, SAVE_VERSION } from '@/types/GameState';

describe('GameState', () => {
  beforeEach(() => {
    resetState();
  });

  it('getState returns initial state after reset', () => {
    const s = getState();
    expect(s.currentPhase).toBe(1);
    expect(s.errors).toBe(0);
    expect(s.trustPolice).toBe(50);
    expect(s.transformationLevel).toBe(0);
    expect(s.ending).toBeNull();
  });

  it('setState replaces state', () => {
    const next = createInitialGameState();
    next.currentPhase = 5;
    setState(next);
    expect(getState().currentPhase).toBe(5);
  });

  it('resetState restores defaults', () => {
    incrementErrors();
    setCurrentPhase(10);
    resetState();
    expect(getState().errors).toBe(0);
    expect(getState().currentPhase).toBe(1);
  });

  it('incrementErrors increments by 1', () => {
    incrementErrors();
    incrementErrors();
    expect(getState().errors).toBe(2);
  });

  it('setCurrentPhase sets phase', () => {
    setCurrentPhase(7);
    expect(getState().currentPhase).toBe(7);
  });

  it('registerChoice stores choice per phase', () => {
    registerChoice(1, 'b');
    registerChoice(2, 'a');
    expect(getState().choices[1]).toBe('b');
    expect(getState().choices[2]).toBe('a');
  });

  it('changePoliceTrust clamps to 0..100', () => {
    changePoliceTrust(30);
    expect(getState().trustPolice).toBe(80);
    changePoliceTrust(100);
    expect(getState().trustPolice).toBe(100);
    changePoliceTrust(-200);
    expect(getState().trustPolice).toBe(0);
  });

  it('getSaveVersion returns SAVE_VERSION', () => {
    expect(getSaveVersion()).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(3);
  });

  it('initial state has v3 settings fields', () => {
    const s = getState();
    expect(s.language).toBe('pt-BR');
    expect(s.flags).toEqual({});
    expect(s.unlockedEndings).toEqual([]);
    expect(s.audioSettings.masterVolume).toBe(1);
    expect(s.subtitleSettings.enabled).toBe(true);
    expect(s.accessibilitySettings.textSpeed).toBe('normal');
  });
});
