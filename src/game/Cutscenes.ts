/**
 * Catálogo de cutscenes (src/data/cutscenes.json): gatilhos e roteiros de ações executados
 * em engine pelo StageDirector (cenários + sprites da jogabilidade). Também deriva cues de
 * legenda e um fallback em passos do CutscenePlayer.
 */
import cutsceneData from '@/data/cutscenes.json';
import { getLanguage } from '@/i18n';
import { getVoiceLine, getVoicePath, VoiceLine } from '@/game/VoiceLines';
import type { SubtitleCue } from '@/systems/SubtitleRenderer';
import type { CutsceneStep } from '@/systems/CutscenePlayer';
import type { StageAction } from '@/systems/StageDirector';
import { hasFlag, setFlag } from '@/game/GameState';

export type CutsceneTrigger =
  | { type: 'beforePhase'; phase: number }
  | { type: 'beforePuzzle' }
  | { type: 'ending'; ending: 'good' | 'bad' | 'secret' };

export interface CutsceneDef {
  id: string;
  title: string;
  trigger: CutsceneTrigger;
  localized?: boolean;
  music?: string;
  ambience?: string;
  poster?: string;
  stage: StageAction[];
}

interface CutscenesShape {
  version: number;
  cutscenes: CutsceneDef[];
}

const DATA = cutsceneData as unknown as CutscenesShape;
const WALK_SPEED = 190; // px/s (ActorSprite padrão)

export function getCutscenes(): CutsceneDef[] {
  return DATA.cutscenes;
}

export function getCutscene(id: string): CutsceneDef | null {
  return DATA.cutscenes.find((c) => c.id === id) ?? null;
}

export function findCutsceneForTrigger(trigger: CutsceneTrigger): CutsceneDef | null {
  return (
    DATA.cutscenes.find((c) => {
      const t = c.trigger;
      if (t.type !== trigger.type) return false;
      if (t.type === 'beforePhase' && trigger.type === 'beforePhase') return t.phase === trigger.phase;
      if (t.type === 'ending' && trigger.type === 'ending') return t.ending === trigger.ending;
      return true;
    }) ?? null
  );
}

export interface ResolvedLine {
  at: number;
  line: VoiceLine;
}

/**
 * Simula a linha do tempo do roteiro para estimar quando cada fala começa
 * (usado para cues, duração e fallback).
 */
export function resolveLines(def: CutsceneDef, lang: string = getLanguage()): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  const pos = new Map<string, { x: number; y: number }>();
  let t = 0;
  for (const a of def.stage) {
    switch (a.a) {
      case 'spawn':
        pos.set(a.actor, { x: a.x, y: a.y });
        break;
      case 'walk': {
        const p = pos.get(a.actor) ?? { x: a.x, y: a.y };
        const ms = (Math.hypot(a.x - p.x, a.y - p.y) / WALK_SPEED) * 1000;
        pos.set(a.actor, { x: a.x, y: a.y });
        if (a.wait !== false) t += ms;
        break;
      }
      case 'say': {
        const line = getVoiceLine(a.voice, lang);
        if (line) {
          out.push({ at: t / 1000, line });
          if (a.wait !== false) t += line.durationMs + 350;
        }
        break;
      }
      case 'wait':
        t += a.ms;
        break;
      case 'camera':
        t += a.ms ?? 1500;
        break;
      case 'fade':
        t += a.ms ?? 600;
        break;
      case 'show':
      case 'hide':
        t += a.ms ?? 0;
        break;
      default:
        break;
    }
  }
  return out;
}

/** Duração estimada (s) da cutscene. */
export function cutsceneDuration(def: CutsceneDef, lang: string = getLanguage()): number {
  const lines = resolveLines(def, lang);
  const last = lines.length ? Math.max(...lines.map((l) => l.at + l.line.durationMs / 1000)) : 0;
  const waits = def.stage.reduce((acc, a) => acc + (a.a === 'wait' ? a.ms : a.a === 'fade' ? a.ms ?? 600 : 0), 0) / 1000;
  return Math.max(last + 1, waits);
}

export function buildSubtitleCues(def: CutsceneDef, lang: string = getLanguage()): SubtitleCue[] {
  return resolveLines(def, lang).map(({ at, line }) => ({
    text: line.text,
    speaker: line.speaker,
    startMs: Math.round(at * 1000),
    endMs: Math.round(at * 1000 + line.durationMs)
  }));
}

/** Fallback sem StageDirector: falas como passos 'dialogue' preservando o timing. */
export function buildFallbackSteps(def: CutsceneDef, lang: string = getLanguage()): CutsceneStep[] {
  const steps: CutsceneStep[] = [];
  let cursor = 0;
  for (const { at, line } of resolveLines(def, lang)) {
    const wait = Math.max(0, Math.round(at * 1000) - cursor);
    if (wait > 0) steps.push({ type: 'wait', duration: wait });
    steps.push({
      type: 'dialogue',
      line: { id: line.id, character: line.speaker, text: line.text, voiceAsset: getVoicePath(line), duration: line.durationMs + 250 }
    });
    cursor = Math.round(at * 1000) + line.durationMs + 250;
  }
  return steps;
}

/** Sprites necessários pelo roteiro (para pré-carga). */
export function stageActors(def: CutsceneDef): string[] {
  return Array.from(new Set(def.stage.filter((a): a is Extract<StageAction, { a: 'spawn' }> => a.a === 'spawn').map((a) => a.actor)));
}

/** Cutscenes desativadas para QA/automação via `?nocutscenes=1` ou `localStorage.ur_skip_cutscenes='1'`. */
export function cutscenesDisabled(): boolean {
  try {
    const g = globalThis as { location?: { search?: string }; localStorage?: { getItem(k: string): string | null } };
    if (g.location?.search && /[?&]nocutscenes=1/.test(g.location.search)) return true;
    if (g.localStorage?.getItem('ur_skip_cutscenes') === '1') return true;
  } catch {
    /* ambiente sem DOM */
  }
  return false;
}

export function cutsceneSeenFlag(id: string): string {
  return `cutscene_seen_${id}`;
}

export function wasCutsceneSeen(id: string): boolean {
  return hasFlag(cutsceneSeenFlag(id));
}

export function markCutsceneSeen(id: string): void {
  setFlag(cutsceneSeenFlag(id), true);
}
