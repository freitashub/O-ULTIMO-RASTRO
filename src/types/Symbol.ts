export type SymbolId = 'olho' | 'lua' | 'mao' | 'corvo' | 'arvore' | 'rosto';

export interface SymbolData {
  id: SymbolId;
  name: string;
  phase: number;
  assetPath: string;
  diaryNote: string;
}
