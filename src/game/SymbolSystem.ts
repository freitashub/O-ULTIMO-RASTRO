import { SymbolData, SymbolId } from '@/types/Symbol';
import { getState } from './GameState';

let cache: SymbolData[] | null = null;

export async function loadSymbols(): Promise<SymbolData[]> {
  if (cache) return cache;
  const res = await fetch('/data/symbols.json');
  if (!res.ok) throw new Error('Falha ao carregar symbols.json');
  cache = (await res.json()) as SymbolData[];
  return cache;
}

export function hasSymbol(id: SymbolId): boolean {
  return getState().symbols.includes(id);
}

export function getCollectedSymbols(): SymbolId[] {
  return getState().symbols as SymbolId[];
}

export function getDiarySymbols(): SymbolId[] {
  return getState().cube.diarySymbols as SymbolId[];
}

export async function getSymbolData(id: SymbolId): Promise<SymbolData | null> {
  const all = await loadSymbols();
  return all.find((s) => s.id === id) ?? null;
}

export function clearSymbolCache(): void {
  cache = null;
}
