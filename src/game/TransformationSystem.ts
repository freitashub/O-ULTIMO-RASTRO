import { getState } from './GameState';
import { t } from '@/i18n';

export type TransformationVisualLevel = 0 | 1 | 2 | 3 | 4 | 5;

export function getTransformationLevel(): TransformationVisualLevel {
  return getState().transformationLevel as TransformationVisualLevel;
}

export function shouldShowTransformationEffect(phaseId: number): boolean {
  const level = getTransformationLevel();
  if (level === 0) return false;
  if (phaseId >= 7 && level >= 1) return true;
  if (phaseId >= 11 && level >= 2) return true;
  if (phaseId >= 14 && level >= 3) return true;
  if (phaseId >= 17 && level >= 4) return true;
  if (phaseId >= 20 && level >= 5) return true;
  return false;
}

export function getTransformationHint(phaseId: number): string | null {
  const level = getTransformationLevel();
  if (level === 0) return null;

  if (phaseId === 7 && level >= 1) return t('transform.hint.7');
  if (phaseId === 11 && level >= 2) return t('transform.hint.11');
  if (phaseId === 14 && level >= 3) return t('transform.hint.14');
  if (phaseId === 17 && level >= 4) return t('transform.hint.17');
  if (phaseId === 20 && level >= 5) return t('transform.hint.20');

  return null;
}
