import { GameState } from '@/types/GameState';
import { EndingId, calculateEnding } from './EndingSystem';

export interface EndingResolverResult {
  ending: EndingId;
  reason: string;
}

export function resolveEnding(state: GameState): EndingResolverResult {
  const ending = calculateEnding(state);

  if (ending === 'bad') {
    return {
      ending: 'bad',
      reason: `errors=${state.errors} >= 2`
    };
  }

  if (ending === 'secret') {
    return {
      ending: 'secret',
      reason: 'errors=0 + cube.solved + 5 symbols + hidden_truth'
    };
  }

  return {
    ending: 'good',
    reason: 'default path (no hard failure, secret conditions not met)'
  };
}

export function describeEndingRule(): string {
  return (
    'errors >= 2 → bad · ' +
    'errors == 0 && cube.solved && symbols==5 && hidden_truth → secret · ' +
    'otherwise → good'
  );
}
