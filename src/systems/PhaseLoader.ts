import { Phase } from '@/types/Phase';
import { validateAllPhases } from './PhaseValidator';

let cache: Phase[] | null = null;

export async function loadAllPhases(): Promise<Phase[]> {
  if (cache) return cache;

  const res = await fetch('/data/phases.json');
  if (!res.ok) {
    throw new Error(`Falha ao carregar phases.json: ${res.status}`);
  }

  const raw = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error('phases.json não é um array');
  }

  cache = validateAllPhases(raw);
  return cache;
}

export async function getPhase(phaseId: number): Promise<Phase> {
  const phases = await loadAllPhases();
  const phase = phases.find((p) => p.id === phaseId);
  if (!phase) throw new Error(`Fase ${phaseId} não encontrada`);
  return phase;
}

export function phaseExists(phaseId: number): boolean {
  if (!cache) return false;
  return cache.some((p) => p.id === phaseId);
}

export function clearPhaseCache(): void {
  cache = null;
}
