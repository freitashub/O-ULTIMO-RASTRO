import { Clue } from '@/types/Clue';

let cache: Clue[] | null = null;

export interface CubeMapping {
  clue: string;
  symbol: string;
  phase: number;
  position: number;
}

export interface CubeConfig {
  version: number;
  inscription: string;
  faces: string[];
  solution: string[];
  hiddenFace: string;
  mappings: CubeMapping[];
}

let cubeCache: CubeConfig | null = null;

export async function loadClues(): Promise<Clue[]> {
  if (cache) return cache;
  const res = await fetch('/data/clues.json');
  if (!res.ok) throw new Error('Falha ao carregar clues.json');
  cache = (await res.json()) as Clue[];
  return cache;
}

export async function loadCubeConfig(): Promise<CubeConfig> {
  if (cubeCache) return cubeCache;
  const res = await fetch('/data/cube-config.json');
  if (!res.ok) throw new Error('Falha ao carregar cube-config.json');
  cubeCache = (await res.json()) as CubeConfig;
  return cubeCache;
}

export function getSolutionFromConfig(config: CubeConfig): string[] {
  return [...config.solution];
}

export function getFacesFromConfig(config: CubeConfig): string[] {
  return [...config.faces];
}

export function clearCubeConfigCache(): void {
  cubeCache = null;
}
