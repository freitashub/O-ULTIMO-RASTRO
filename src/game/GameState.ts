import { GameState, createInitialGameState, SAVE_VERSION } from '@/types/GameState';

export type { GameState };

let state: GameState = createInitialGameState();

export function getState(): GameState {
  return state;
}

export function setState(next: GameState): void {
  state = next;
}

export function resetState(): void {
  state = createInitialGameState();
}

export function incrementErrors(): void {
  state.errors += 1;
}

export function setCurrentPhase(phaseId: number): void {
  state.currentPhase = phaseId;
}

export function registerChoice(phaseId: number, choiceId: string): void {
  state.choices[phaseId] = choiceId;
}

export function changePoliceTrust(delta: number): void {
  state.trustPolice = Math.max(0, Math.min(100, state.trustPolice + delta));
}

export function setFlag(flag: string, value = true): void {
  state.flags[flag] = value;
}

export function hasFlag(flag: string): boolean {
  return state.flags[flag] === true;
}

export function unlockEnding(ending: 'good' | 'bad' | 'secret'): void {
  if (!state.unlockedEndings.includes(ending)) {
    state.unlockedEndings.push(ending);
  }
}

export function setLanguage(language: GameState['language']): void {
  state.language = language;
}

export function getSaveVersion(): number {
  return SAVE_VERSION;
}
