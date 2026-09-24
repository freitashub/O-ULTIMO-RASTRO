import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateEnding,
  applyEndingToState
} from '@/game/EndingSystem';
import { getState, resetState, setState } from '@/game/GameState';
import { createInitialGameState, GameState } from '@/types/GameState';

function fullSecretState(): GameState {
  const s = createInitialGameState();
  s.errors = 0;
  s.symbols = ['olho', 'lua', 'mao', 'corvo', 'arvore'];
  s.clues = ['hidden_truth'];
  s.cube.solved = true;
  return s;
}

describe('EndingSystem', () => {
  beforeEach(() => {
    resetState();
  });

  it('bad ending when errors >= 2', () => {
    const s = createInitialGameState();
    s.errors = 2;
    expect(calculateEnding(s)).toBe('bad');
    s.errors = 5;
    expect(calculateEnding(s)).toBe('bad');
  });

  it('secret ending when all conditions met', () => {
    expect(calculateEnding(fullSecretState())).toBe('secret');
  });

  it('good ending with 0 errors but missing symbols', () => {
    const s = createInitialGameState();
    s.errors = 0;
    s.symbols = ['olho'];
    s.cube.solved = true;
    s.clues = ['hidden_truth'];
    expect(calculateEnding(s)).toBe('good');
  });

  it('good ending with 1 error even if all else met', () => {
    const s = fullSecretState();
    s.errors = 1;
    expect(calculateEnding(s)).toBe('good');
  });

  it('good ending when cube not solved', () => {
    const s = fullSecretState();
    s.cube.solved = false;
    expect(calculateEnding(s)).toBe('good');
  });

  it('good ending when hidden_truth missing', () => {
    const s = fullSecretState();
    s.clues = [];
    expect(calculateEnding(s)).toBe('good');
  });

  it('good ending when only 4 symbols', () => {
    const s = fullSecretState();
    s.symbols = ['olho', 'lua', 'mao', 'corvo'];
    expect(calculateEnding(s)).toBe('good');
  });

  it('errors >= 2 takes priority over secret conditions', () => {
    const s = fullSecretState();
    s.errors = 3;
    expect(calculateEnding(s)).toBe('bad');
  });

  it('applyEndingToState sets ending on global state', () => {
    applyEndingToState('secret');
    expect(getState().ending).toBe('secret');
    applyEndingToState('bad');
    expect(getState().ending).toBe('bad');
  });

  it('calculateEnding defaults to global state', () => {
    const s = createInitialGameState();
    s.errors = 2;
    setState(s);
    expect(calculateEnding()).toBe('bad');
  });

  it('initial state yields good (no errors)', () => {
    expect(calculateEnding()).toBe('good');
  });
});
