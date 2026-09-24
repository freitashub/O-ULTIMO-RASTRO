export interface CubePuzzleState {
  positions: number[];
  solved: boolean;
  attempts: number;
  unlockedFace: boolean;
  symbolOrder: string[];
  diarySymbols: string[];
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  ambienceVolume: number;
  muted: boolean;
}

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: number;
  position: 'bottom' | 'top';
  background: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
}

export type EndingType = 'good' | 'bad' | 'secret' | null;
export type LanguageId = 'pt-BR' | 'en-US' | 'es-ES';

export interface GameState {
  saveVersion: number;
  currentPhase: number;
  errors: number;
  choices: Record<number, string>;
  clues: string[];
  symbols: string[];
  discoveredCharacters: string[];
  trustPolice: number;
  transformationLevel: number;
  cube: CubePuzzleState;
  ending: EndingType;
  flags: Record<string, boolean>;
  unlockedEndings: Array<'good' | 'bad' | 'secret'>;
  language: LanguageId;
  audioSettings: AudioSettings;
  subtitleSettings: SubtitleSettings;
  accessibilitySettings: AccessibilitySettings;
}

export const SAVE_VERSION = 3;

export function createDefaultAudioSettings(): AudioSettings {
  return {
    masterVolume: 1,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    voiceVolume: 1,
    ambienceVolume: 0.7,
    muted: false
  };
}

export function createDefaultSubtitleSettings(): SubtitleSettings {
  return {
    enabled: true,
    fontSize: 18,
    position: 'bottom',
    background: true
  };
}

export function createDefaultAccessibilitySettings(): AccessibilitySettings {
  return {
    highContrast: false,
    textSpeed: 'normal',
    reduceMotion: false
  };
}

export function createInitialGameState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    currentPhase: 1,
    errors: 0,
    choices: {},
    clues: [],
    symbols: [],
    discoveredCharacters: [],
    trustPolice: 50,
    transformationLevel: 0,
    cube: {
      positions: [],
      solved: false,
      attempts: 0,
      unlockedFace: false,
      symbolOrder: [],
      diarySymbols: []
    },
    ending: null,
    flags: {},
    unlockedEndings: [],
    language: 'pt-BR',
    audioSettings: createDefaultAudioSettings(),
    subtitleSettings: createDefaultSubtitleSettings(),
    accessibilitySettings: createDefaultAccessibilitySettings()
  };
}
