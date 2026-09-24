export interface AssetEntry {
  id: string;
  kind: 'image' | 'audio' | 'video' | 'json' | 'atlas' | 'font';
  path: string;
  pack: string;
  optional?: boolean;
  preload?: boolean;
}

interface AssetRegistryShape {
  packs: Record<string, AssetEntry[]>;
}

import registry from '@/data/assetRegistry.json';

const REGISTRY = registry as AssetRegistryShape;

export function getPacks(): string[] {
  return Object.keys(REGISTRY.packs);
}

export function getPack(name: string): AssetEntry[] {
  return REGISTRY.packs[name] ?? [];
}

export function getPreloadEntries(): AssetEntry[] {
  return getPacks()
    .flatMap((name) => getPack(name))
    .filter((entry) => entry.preload !== false && entry.optional !== true);
}

export function getOptionalEntries(): AssetEntry[] {
  return getPacks()
    .flatMap((name) => getPack(name))
    .filter((entry) => entry.optional === true);
}

export function getEntriesForPack(name: string): AssetEntry[] {
  return getPack(name);
}

export function hasEntry(id: string): boolean {
  return getPacks().some((name) => getPack(name).some((e) => e.id === id));
}

export function findEntry(id: string): AssetEntry | null {
  for (const name of getPacks()) {
    const entry = getPack(name).find((e) => e.id === id);
    if (entry) return entry;
  }
  return null;
}
