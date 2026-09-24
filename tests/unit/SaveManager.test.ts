import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, loadGame, resetSave, hasSave } from '@/game/SaveManager';
import { createInitialGameState, SAVE_VERSION } from '@/types/GameState';
import type { GameState } from '@/types/GameState';

function openRaw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ultimo_rastro', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('saves')) {
        db.createObjectStore('saves');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putRaw(value: unknown): Promise<void> {
  const db = await openRaw();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(value, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

describe('SaveManager', () => {
  beforeEach(async () => {
    await resetSave();
  });

  it('returns null when no save exists', async () => {
    expect(await loadGame()).toBeNull();
    expect(await hasSave()).toBe(false);
  });

  it('saves and loads a full state', async () => {
    const state = createInitialGameState();
    state.currentPhase = 3;
    state.errors = 1;
    state.symbols = ['olho'];
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.currentPhase).toBe(3);
    expect(loaded!.errors).toBe(1);
    expect(loaded!.symbols).toEqual(['olho']);
    expect(await hasSave()).toBe(true);
  });

  it('resetSave removes the save', async () => {
    await saveGame(createInitialGameState());
    await resetSave();
    expect(await loadGame()).toBeNull();
    expect(await hasSave()).toBe(false);
  });

  it('migrates v1 save (no cube) to current version', async () => {
    const legacy = {
      ...createInitialGameState(),
      saveVersion: 1,
      symbols: ['olho', 'lua']
    } as unknown as GameState;
    delete (legacy as Partial<GameState>).cube;
    delete (legacy as Partial<GameState>).flags;
    delete (legacy as Partial<GameState>).unlockedEndings;
    delete (legacy as Partial<GameState>).language;
    delete (legacy as Partial<GameState>).audioSettings;
    delete (legacy as Partial<GameState>).subtitleSettings;
    delete (legacy as Partial<GameState>).accessibilitySettings;
    await putRaw(legacy);

    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.saveVersion).toBe(SAVE_VERSION);
    expect(loaded!.cube).toBeDefined();
    expect(loaded!.cube.solved).toBe(false);
    expect(loaded!.cube.diarySymbols).toEqual(['olho', 'lua']);
    expect(loaded!.flags).toEqual({});
    expect(loaded!.language).toBe('pt-BR');
    expect(loaded!.audioSettings).toBeDefined();
    expect(loaded!.subtitleSettings).toBeDefined();
    expect(loaded!.accessibilitySettings).toBeDefined();
  });

  it('migrates v2 save to v3 keeping cube and ending', async () => {
    const v2 = {
      ...createInitialGameState(),
      saveVersion: 2,
      currentPhase: 10,
      errors: 1,
      ending: 'good',
      cube: {
        positions: [],
        solved: true,
        attempts: 3,
        unlockedFace: true,
        symbolOrder: ['olho', 'lua'],
        diarySymbols: ['olho', 'lua']
      }
    } as unknown as GameState;
    delete (v2 as Partial<GameState>).flags;
    delete (v2 as Partial<GameState>).unlockedEndings;
    delete (v2 as Partial<GameState>).language;
    delete (v2 as Partial<GameState>).audioSettings;
    delete (v2 as Partial<GameState>).subtitleSettings;
    delete (v2 as Partial<GameState>).accessibilitySettings;
    await putRaw(v2);

    const loaded = await loadGame();
    expect(loaded!.saveVersion).toBe(3);
    expect(loaded!.currentPhase).toBe(10);
    expect(loaded!.cube.solved).toBe(true);
    expect(loaded!.cube.attempts).toBe(3);
    expect(loaded!.ending).toBe('good');
    expect(loaded!.unlockedEndings).toContain('good');
    expect(loaded!.language).toBe('pt-BR');
    expect(loaded!.flags).toEqual({});
  });

  it('does not overwrite cube on v2 save', async () => {
    const state = createInitialGameState();
    state.cube.solved = true;
    state.cube.symbolOrder = ['olho', 'lua'];
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.cube.solved).toBe(true);
    expect(loaded!.cube.symbolOrder).toEqual(['olho', 'lua']);
  });

  it('hasSave is true after saveGame', async () => {
    await saveGame(createInitialGameState());
    expect(await hasSave()).toBe(true);
  });

  it('roundtrips ending field', async () => {
    const state = createInitialGameState();
    state.ending = 'secret';
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.ending).toBe('secret');
  });
});
