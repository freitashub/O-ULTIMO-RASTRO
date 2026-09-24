/**
 * Catálogo de vozes (gerado por tools/audio/voices.py). Resolve uma linha por id + idioma,
 * com fallback para pt-BR quando a dublagem no idioma atual não existe.
 * Nenhum path de áudio é montado fora deste módulo.
 */
import voiceData from '@/data/voiceLines.json';
import { getLanguage, LanguageId } from '@/i18n';

export interface VoiceLine {
  id: string;
  speaker: string;
  lang: string;
  text: string;
  engine: string;
  durationMs: number;
}

interface VoiceLinesShape {
  version: number;
  basePath: string;
  speakers: Record<string, string>;
  lines: VoiceLine[];
}

const DATA = voiceData as VoiceLinesShape;
const INDEX = new Map<string, VoiceLine>(DATA.lines.map((l) => [`${l.id}|${l.lang}`, l]));

export const VOICE_FALLBACK_LANGUAGE: LanguageId = 'pt-BR';

export function getVoiceLine(id: string, lang: string = getLanguage()): VoiceLine | null {
  return INDEX.get(`${id}|${lang}`) ?? INDEX.get(`${id}|${VOICE_FALLBACK_LANGUAGE}`) ?? null;
}

export function hasVoiceLine(id: string, lang?: string): boolean {
  return getVoiceLine(id, lang) !== null;
}

/** Path base (com .ogg) — OptionalAssets deriva o fallback .mp3. */
export function getVoicePath(line: VoiceLine): string {
  return `${DATA.basePath}/${line.lang}/${line.id}.ogg`;
}

export function getVoiceSpeakers(): Record<string, string> {
  return DATA.speakers;
}

export function countVoiceLines(lang?: string): number {
  return lang ? DATA.lines.filter((l) => l.lang === lang).length : DATA.lines.length;
}

/** id de linha de narração para campos de fase. */
export function phaseLineId(
  phaseId: number,
  part: 'intro' | 'scene' | 'revelation' | 'cliffhanger'
): string {
  return `phase${String(phaseId).padStart(2, '0')}_${part}`;
}

export function choiceLineId(phaseId: number, choiceId: string): string {
  return `phase${String(phaseId).padStart(2, '0')}_choice_${choiceId}`;
}
