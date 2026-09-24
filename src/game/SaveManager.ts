import {
  GameState,
  SAVE_VERSION,
  createDefaultAudioSettings,
  createDefaultSubtitleSettings,
  createDefaultAccessibilitySettings
} from '@/types/GameState';
import { setLanguage } from '@/i18n';

const DB_NAME = 'ultimo_rastro';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function migrateSave(save: GameState): GameState {
  if (save.saveVersion < 2) {
    save.cube = {
      positions: [],
      solved: false,
      attempts: 0,
      unlockedFace: false,
      symbolOrder: [],
      diarySymbols: save.symbols ?? []
    };
    save.saveVersion = 2;
  }

  if (save.saveVersion < 3) {
    save.flags = save.flags ?? {};
    save.unlockedEndings = save.unlockedEndings ?? (save.ending ? [save.ending] : []);
    save.language = save.language ?? 'pt-BR';
    save.audioSettings = save.audioSettings ?? createDefaultAudioSettings();
    save.subtitleSettings = save.subtitleSettings ?? createDefaultSubtitleSettings();
    save.accessibilitySettings =
      save.accessibilitySettings ?? createDefaultAccessibilitySettings();
    save.discoveredCharacters = save.discoveredCharacters ?? [];
    save.saveVersion = SAVE_VERSION;
  }

  return save;
}

export async function saveGame(state: GameState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, SAVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadGame(): Promise<GameState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(SAVE_KEY);
    req.onsuccess = () => {
      const data = req.result as GameState | undefined;
      if (!data) {
        resolve(null);
        return;
      }
      try {
        const migrated = migrateSave(data);
        if (migrated.language) {
          setLanguage(migrated.language);
        }
        resolve(migrated);
      } catch (err) {
        console.error('Falha na migração do save:', err);
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function resetSave(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(SAVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hasSave(): Promise<boolean> {
  const save = await loadGame();
  return save !== null;
}
