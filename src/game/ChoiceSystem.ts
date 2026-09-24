import { GameState } from '@/types/GameState';
import { Phase, Choice } from '@/types/Phase';
import { registerChoice, incrementErrors, getState } from './GameState';

export interface ChoiceResult {
  correct: boolean;
  consequence: string;
  clueReward?: string;
  symbolReward?: string;
}

export function resolveChoice(
  phase: Phase,
  choice: Choice,
  state: GameState = getState()
): ChoiceResult {
  registerChoice(phase.id, choice.id);

  if (choice.correct) {
    if (choice.clueReward) {
      if (!state.clues.includes(choice.clueReward)) {
        state.clues.push(choice.clueReward);
      }
      state.flags[`clue_${choice.clueReward}`] = true;
    }
    if (phase.clueReward && !state.clues.includes(phase.clueReward)) {
      state.clues.push(phase.clueReward);
      state.flags[`clue_${phase.clueReward}`] = true;
    }
    if (phase.symbolReward && !state.symbols.includes(phase.symbolReward)) {
      state.symbols.push(phase.symbolReward);
      state.cube.diarySymbols.push(phase.symbolReward);
      state.flags[`symbol_${phase.symbolReward}`] = true;
    }
    state.flags[`phase_${phase.id}_correct`] = true;
  } else {
    incrementErrors();
    state.transformationLevel = Math.min(
      state.transformationLevel + (choice.transformationDelta ?? 1),
      5
    );
    state.flags[`phase_${phase.id}_wrong`] = true;
  }

  return {
    correct: choice.correct,
    consequence: choice.consequence,
    clueReward: choice.clueReward,
    symbolReward: phase.symbolReward
  };
}
