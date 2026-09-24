import { describe, it, expect } from 'vitest';
import { resolveEnding, describeEndingRule } from '@/game/EndingResolver';
import { createInitialGameState } from '@/types/GameState';

describe('EndingResolver', () => {
  it('resolves bad when errors >= 2', () => {
    const state = createInitialGameState();
    state.errors = 2;
    const result = resolveEnding(state);
    expect(result.ending).toBe('bad');
    expect(result.reason).toContain('2');
  });

  it('resolves secret when perfect run with cube', () => {
    const state = createInitialGameState();
    state.errors = 0;
    state.cube.solved = true;
    state.symbols = ['olho', 'lua', 'mao', 'corvo', 'arvore'];
    state.clues = ['hidden_truth'];
    const result = resolveEnding(state);
    expect(result.ending).toBe('secret');
  });

  it('resolves good when only one error', () => {
    const state = createInitialGameState();
    state.errors = 1;
    const result = resolveEnding(state);
    expect(result.ending).toBe('good');
  });

  it('resolves good when secret conditions missing', () => {
    const state = createInitialGameState();
    state.errors = 0;
    state.cube.solved = false;
    state.symbols = ['olho', 'lua', 'mao', 'corvo', 'arvore'];
    state.clues = ['hidden_truth'];
    const result = resolveEnding(state);
    expect(result.ending).toBe('good');
  });

  it('describes rule', () => {
    expect(describeEndingRule()).toContain('bad');
    expect(describeEndingRule()).toContain('secret');
    expect(describeEndingRule()).toContain('good');
  });
});
