import { Phase } from '@/types/Phase';

export class PhaseValidationError extends Error {
  constructor(message: string, public phaseId?: number) {
    super(message);
    this.name = 'PhaseValidationError';
  }
}

export function validatePhase(phase: unknown): Phase {
  if (typeof phase !== 'object' || phase === null) {
    throw new PhaseValidationError('Fase não é um objeto');
  }

  const p = phase as Partial<Phase>;

  if (typeof p.id !== 'number') throw new PhaseValidationError('id inválido');
  if (typeof p.title !== 'string') throw new PhaseValidationError('title inválido', p.id);
  if (typeof p.act !== 'number') throw new PhaseValidationError('act inválido', p.id);
  if (typeof p.intro !== 'string') throw new PhaseValidationError('intro inválido', p.id);
  if (typeof p.scene !== 'string') throw new PhaseValidationError('scene inválido', p.id);
  if (typeof p.objective !== 'string') throw new PhaseValidationError('objective inválido', p.id);
  if (typeof p.image !== 'string') throw new PhaseValidationError('image inválido', p.id);
  if (typeof p.cliffhanger !== 'string') throw new PhaseValidationError('cliffhanger inválido', p.id);
  if (typeof p.justification !== 'string')
    throw new PhaseValidationError('justification inválido', p.id);
  if (typeof p.respiroPhase !== 'boolean')
    throw new PhaseValidationError('respiroPhase inválido', p.id);
  if (p.revelation !== undefined && typeof p.revelation !== 'string')
    throw new PhaseValidationError('revelation inválido', p.id);

  if (!Array.isArray(p.choices)) throw new PhaseValidationError('choices não é array', p.id);
  if (p.choices.length !== 3)
    throw new PhaseValidationError('choices deve ter exatamente 3 opções', p.id);

  const correctCount = p.choices.filter((c) => c.correct).length;
  if (correctCount !== 1) throw new PhaseValidationError('choices deve ter exatamente 1 correta', p.id);

  for (const choice of p.choices) {
    if (typeof choice.id !== 'string') throw new PhaseValidationError('choice.id inválido', p.id);
    if (typeof choice.text !== 'string')
      throw new PhaseValidationError('choice.text inválido', p.id);
    if (typeof choice.correct !== 'boolean')
      throw new PhaseValidationError('choice.correct inválido', p.id);
    if (typeof choice.consequence !== 'string')
      throw new PhaseValidationError('choice.consequence inválido', p.id);
    if (typeof choice.justification !== 'string')
      throw new PhaseValidationError('choice.justification inválido', p.id);

    if (choice.correct && choice.justification.trim() === '') {
      throw new PhaseValidationError(
        `Escolha correta da fase ${p.id} sem justificativa`,
        p.id
      );
    }
  }

  return p as Phase;
}

export function validateAllPhases(phases: unknown[]): Phase[] {
  return phases.map(validatePhase);
}
