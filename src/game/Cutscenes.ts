/**
 * Catálogo de cutscenes (src/data/cutscenes.json): triggers, vídeo (WebM/MP4), cues de legenda
 * sincronizadas com as vozes e fallback em passos do CutscenePlayer.
 */
import cutsceneData from '@/data/cutscenes.json';
import { getLanguage } from '@/i18n';
import { getVoiceLine, getVoicePath, VoiceLine } from '@/game/VoiceLines';
import { SubtitleCue } from '@/systems/SubtitleRenderer';
import { CutsceneStep } from '@/systems/CutscenePlayer';
import { hasFlag, setFlag } from '@/game/GameState';

export interface CutsceneShot {
  type: 'bg' | 'figure' | 'ghost' | 'icon';
  image?: string;
  figure?: string;
  icon?: string;
  duration: number;
  zoom?: [number, number];
  from?: [number, number];
  to?: [number, number];
}

export interface CutsceneLineRef {
  at: number;
  voice: string;
}

export interface CutsceneSfxRef {
  at: number;
  id: string;
}

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
  shots: CutsceneShot[];
  lines?: CutsceneLineRef[];
  sfx?: CutsceneSfxRef[];
}

interface CutscenesShape {
  version: number;
  basePath: string;
  width: number;
  height: number;
  fps: number;
  cutscenes: CutsceneDef[];
}

const DATA = cutsceneData as CutscenesShape;

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

export function cutsceneDuration(def: CutsceneDef): number {
  return def.shots.reduce((acc, s) => acc + s.duration, 0);
}

/** Path base do vídeo (sem extensão) para o idioma atual, com fallback para o vídeo pt-BR. */
export function cutsceneVideoBases(def: CutsceneDef, lang: string = getLanguage()): string[] {
  const base = `${DATA.basePath}/${def.id}`;
  const out: string[] = [];
  if (def.localized && lang !== 'pt-BR') out.push(`${base}.${lang}`);
  out.push(base);
  return out;
}

export interface ResolvedLine {
  at: number;
  line: VoiceLine;
}

export function resolveLines(def: CutsceneDef, lang: string = getLanguage()): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const ref of def.lines ?? []) {
    const line = getVoiceLine(ref.voice, lang);
    if (line) out.push({ at: ref.at, line });
  }
  return out;
}

/** Cues de legenda sincronizadas com o áudio já mixado no vídeo. */
export function buildSubtitleCues(def: CutsceneDef, lang: string = getLanguage()): SubtitleCue[] {
  return resolveLines(def, lang).map(({ at, line }) => ({
    text: line.text,
    speaker: line.speaker,
    startMs: Math.round(at * 1000),
    endMs: Math.round(at * 1000 + line.durationMs)
  }));
}

/**
 * Fallback sem vídeo: linhas como passos 'dialogue' (voz + legenda) com esperas
 * que preservam o timing do roteiro.
 */
export function buildFallbackSteps(def: CutsceneDef, lang: string = getLanguage()): CutsceneStep[] {
  const steps: CutsceneStep[] = [];
  let cursor = 0;
  for (const { at, line } of resolveLines(def, lang)) {
    const wait = Math.max(0, Math.round(at * 1000) - cursor);
    if (wait > 0) steps.push({ type: 'wait', duration: wait });
    steps.push({
      type: 'dialogue',
      line: {
        id: line.id,
        character: line.speaker,
        text: line.text,
        voiceAsset: getVoicePath(line),
        duration: line.durationMs + 250
      }
    });
    cursor = Math.round(at * 1000) + line.durationMs + 250;
  }
  const total = cutsceneDuration(def) * 1000;
  if (total > cursor) steps.push({ type: 'wait', duration: total - cursor });
  return steps;
}

/**
 * Cutscenes podem ser desativadas para QA/automação via `?nocutscenes=1` na URL
 * ou `localStorage.ur_skip_cutscenes = '1'`. Nunca afeta o build/gameplay padrão.
 */
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
