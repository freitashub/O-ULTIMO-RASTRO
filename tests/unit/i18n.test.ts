import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, getLanguage, hasKey, DEFAULT_LANGUAGE } from '@/i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('pt-BR');
  });

  it('defaults to pt-BR', () => {
    expect(getLanguage()).toBe('pt-BR');
    expect(DEFAULT_LANGUAGE).toBe('pt-BR');
  });

  it('translates menu keys in pt-BR', () => {
    expect(t('menu.newGame')).toBe('NOVO JOGO');
    expect(t('menu.continue')).toBe('CONTINUAR');
  });

  it('translates in en-US', () => {
    setLanguage('en-US');
    expect(t('menu.newGame')).toBe('NEW GAME');
    expect(t('ending.bad.text')).toBe('Every choice leaves a trace.');
  });

  it('translates in es-ES', () => {
    setLanguage('es-ES');
    expect(t('menu.newGame')).toBe('NUEVA PARTIDA');
    expect(t('puzzle.title')).toBe('CUBO DE ORUN');
  });

  it('returns key when missing in all languages', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('falls back to pt-BR when key missing in current language only', () => {
    setLanguage('en-US');
    expect(hasKey('menu.newGame')).toBe(true);
    expect(hasKey('totally.missing')).toBe(false);
  });

  it('interpolates params', () => {
    setLanguage('pt-BR');
    const result = t('transform.hint.7');
    expect(result).toContain('Theo');
  });

  it('supports all three languages for core keys', () => {
    const keys = ['menu.title', 'menu.clues', 'puzzle.title', 'credits.title'];
    for (const lang of ['pt-BR', 'en-US', 'es-ES'] as const) {
      setLanguage(lang);
      for (const key of keys) {
        expect(hasKey(key)).toBe(true);
        expect(t(key)).not.toBe(key);
      }
    }
  });
});
