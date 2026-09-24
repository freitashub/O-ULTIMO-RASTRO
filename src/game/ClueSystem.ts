import { Clue } from '@/types/Clue';
import { getState } from './GameState';

let cache: Clue[] | null = null;

export async function loadClues(): Promise<Clue[]> {
  if (cache) return cache;
  const res = await fetch('/data/clues.json');
  if (!res.ok) throw new Error('Falha ao carregar clues.json');
  cache = (await res.json()) as Clue[];
  return cache;
}

export function hasClue(clueId: string): boolean {
  return getState().clues.includes(clueId);
}

export async function getClue(clueId: string): Promise<Clue | null> {
  const clues = await loadClues();
  return clues.find((c) => c.id === clueId) ?? null;
}

export async function getDiscoveredClues(): Promise<Clue[]> {
  const all = await loadClues();
  const owned = new Set(getState().clues);
  return all.filter((c) => owned.has(c.id));
}

export function clearClueCache(): void {
  cache = null;
}
