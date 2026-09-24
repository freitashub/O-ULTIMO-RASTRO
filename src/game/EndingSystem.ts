import { GameState } from '@/types/GameState';
import { getState } from './GameState';

export type EndingId = 'good' | 'bad' | 'secret';

export function calculateEnding(state: GameState = getState()): EndingId {
  if (state.errors >= 2) return 'bad';

  const allSymbols = state.symbols.length === 5;
  const hasHiddenTruth = state.clues.includes('hidden_truth');

  if (state.errors === 0 && state.cube.solved && allSymbols && hasHiddenTruth) {
    return 'secret';
  }

  return 'good';
}

export function applyEndingToState(ending: EndingId): void {
  const state = getState();
  state.ending = ending;
  if (ending && !state.unlockedEndings.includes(ending)) {
    state.unlockedEndings.push(ending);
  }
}
