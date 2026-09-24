export type CharacterId =
  | 'theo'
  | 'clara'
  | 'elias'
  | 'silas'
  | 'troll'
  | 'theo_t2'
  | 'theo_t4';

export type PortraitId = 'theo' | 'clara' | 'elias' | 'silas' | 'troll';

const PHASE_CHARACTER: Record<number, CharacterId> = {
  1: 'theo',
  2: 'theo',
  3: 'troll',
  4: 'silas',
  5: 'theo',
  6: 'troll',
  7: 'clara',
  8: 'troll',
  9: 'troll',
  10: 'troll',
  11: 'troll',
  12: 'theo',
  13: 'silas',
  14: 'theo',
  15: 'theo',
  16: 'clara',
  17: 'clara',
  18: 'elias',
  19: 'silas',
  20: 'theo'
};

const PHASE_PORTRAIT: Record<number, PortraitId> = {
  1: 'theo',
  2: 'theo',
  3: 'troll',
  4: 'silas',
  5: 'theo',
  6: 'troll',
  7: 'clara',
  8: 'troll',
  9: 'troll',
  10: 'troll',
  11: 'troll',
  12: 'theo',
  13: 'silas',
  14: 'theo',
  15: 'theo',
  16: 'clara',
  17: 'clara',
  18: 'elias',
  19: 'silas',
  20: 'theo'
};

export function getPhaseCharacterId(phaseId: number): CharacterId {
  return PHASE_CHARACTER[phaseId] ?? 'theo';
}

export function getPhasePortraitId(phaseId: number): PortraitId {
  return PHASE_PORTRAIT[phaseId] ?? 'theo';
}

export function getCharacterPath(id: CharacterId): string {
  return `/assets/characters/char_${id}.webp`;
}

export function getPortraitPath(id: PortraitId): string {
  return `/images/portraits/${id}.png`;
}

export function getTransformationImagePath(level: number): string | null {
  if (level <= 0) return null;
  const clamped = Math.min(level, 4);
  return `/images/transformation/theo_t${clamped}.png`;
}

export function getTransformedCharacterPath(level: number): string | null {
  if (level >= 4) return '/assets/characters/char_theo_t4.webp';
  if (level >= 2) return '/assets/characters/char_theo_t2.webp';
  return null;
}
