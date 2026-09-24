export type ClueImportance = 'low' | 'medium' | 'high';

export type ClueType =
  | 'direct'
  | 'environment'
  | 'character'
  | 'symbol'
  | 'retroactive'
  | 'false'
  | 'final';

export interface Clue {
  id: string;
  phase: number;
  text: string;
  symbol?: string;
  unlocks?: string[];
  importance: ClueImportance;
  type: ClueType;
  linkedFlags?: string[];
  relatedSymbols?: string[];
  futureReferences?: number[];
}
