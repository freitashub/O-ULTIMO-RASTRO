import { describe, it, expect, beforeEach } from 'vitest';
import { resolveChoice } from '@/game/ChoiceSystem';
import { getState, resetState } from '@/game/GameState';
import { createInitialGameState } from '@/types/GameState';
import type { Phase, Choice } from '@/types/Phase';

function makePhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: 1,
    title: 'T',
    act: 1,
    intro: '',
    scene: '',
    objective: '',
    image: '',
    choices: [],
    cliffhanger: '',
    justification: '',
    respiroPhase: false,
    ...overrides
  };
}

function makeChoice(overrides: Partial<Choice> = {}): Choice {
  return {
    id: 'a',
    text: 'Opção',
    correct: false,
    consequence: 'consequência',
    justification: '',
    ...overrides
  };
}

describe('ChoiceSystem', () => {
  beforeEach(() => {
    resetState();
  });

  it('registers choice in state', () => {
    resolveChoice(makePhase({ id: 3 }), makeChoice({ id: 'b' }));
    expect(getState().choices[3]).toBe('b');
  });

  it('correct choice with clueReward adds clue', () => {
    const state = createInitialGameState();
    resolveChoice(
      makePhase({ id: 1 }),
      makeChoice({ correct: true, clueReward: 'tire_mark' }),
      state
    );
    expect(state.clues).toContain('tire_mark');
  });

  it('correct choice with phase symbolReward adds symbol + diary', () => {
    const state = createInitialGameState();
    resolveChoice(
      makePhase({ id: 2, symbolReward: 'olho' }),
      makeChoice({ correct: true }),
      state
    );
    expect(state.symbols).toContain('olho');
    expect(state.cube.diarySymbols).toContain('olho');
  });

  it('does not duplicate phase clueReward', () => {
    const state = createInitialGameState();
    state.clues.push('eye_symbol');
    resolveChoice(
      makePhase({ id: 2, clueReward: 'eye_symbol' }),
      makeChoice({ correct: true }),
      state
    );
    expect(state.clues.filter((c) => c === 'eye_symbol')).toHaveLength(1);
  });

  it('does not duplicate symbolReward', () => {
    const state = createInitialGameState();
    state.symbols.push('olho');
    resolveChoice(
      makePhase({ id: 2, symbolReward: 'olho' }),
      makeChoice({ correct: true }),
      state
    );
    expect(state.symbols.filter((s) => s === 'olho')).toHaveLength(1);
  });

  it('incorrect choice increments errors and transformationLevel', () => {
    const state = createInitialGameState();
    resolveChoice(makePhase({ id: 1 }), makeChoice({ correct: false }), state);
    expect(getState().errors).toBe(1);
    expect(state.transformationLevel).toBe(1);
  });

  it('incorrect choice respects transformationDelta', () => {
    const state = createInitialGameState();
    resolveChoice(
      makePhase({ id: 1 }),
      makeChoice({ correct: false, transformationDelta: 3 }),
      state
    );
    expect(state.transformationLevel).toBe(3);
  });

  it('transformationLevel caps at 5', () => {
    const state = createInitialGameState();
    state.transformationLevel = 4;
    resolveChoice(
      makePhase({ id: 1 }),
      makeChoice({ correct: false, transformationDelta: 10 }),
      state
    );
    expect(state.transformationLevel).toBe(5);
  });

  it('returns correct result payload', () => {
    const result = resolveChoice(
      makePhase({ id: 1, symbolReward: 'lua' }),
      makeChoice({ correct: true, consequence: 'feito' }),
      createInitialGameState()
    );
    expect(result.correct).toBe(true);
    expect(result.consequence).toBe('feito');
    expect(result.symbolReward).toBe('lua');
  });

  it('incorrect choice does not add rewards', () => {
    const state = createInitialGameState();
    resolveChoice(
      makePhase({ id: 1, symbolReward: 'olho', clueReward: 'x' }),
      makeChoice({ correct: false, clueReward: 'y' }),
      state
    );
    expect(state.symbols).toHaveLength(0);
    expect(state.clues).toHaveLength(0);
  });
});
