export type LanguageId = 'pt-BR' | 'en-US' | 'es-ES';

export const DEFAULT_LANGUAGE: LanguageId = 'pt-BR';
export const SUPPORTED_LANGUAGES: LanguageId[] = ['pt-BR', 'en-US', 'es-ES'];

export type TranslationParams = Record<string, string | number>;

import ptBR from './pt-BR.json';
import enUS from './en-US.json';
import esES from './es-ES.json';

type Dict = Record<string, string>;

const dictionaries: Record<LanguageId, Dict> = {
  'pt-BR': ptBR as Dict,
  'en-US': enUS as Dict,
  'es-ES': esES as Dict
};

let currentLanguage: LanguageId = DEFAULT_LANGUAGE;

export function getLanguage(): LanguageId {
  return currentLanguage;
}

export function setLanguage(lang: LanguageId): void {
  if (dictionaries[lang]) {
    currentLanguage = lang;
  }
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

export function t(key: string, params?: TranslationParams): string {
  const dict = dictionaries[currentLanguage];
  const fallback = dictionaries[DEFAULT_LANGUAGE];

  let value = dict[key];
  if (value === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Missing key for ${currentLanguage}: ${key}`);
    }
    value = fallback[key];
  }
  if (value === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Missing key in default language: ${key}`);
    }
    return key;
  }
  return interpolate(value, params);
}

export function hasKey(key: string): boolean {
  return dictionaries[currentLanguage][key] !== undefined || dictionaries[DEFAULT_LANGUAGE][key] !== undefined;
}

export function getDictionary(lang: LanguageId): Dict {
  return dictionaries[lang];
}
