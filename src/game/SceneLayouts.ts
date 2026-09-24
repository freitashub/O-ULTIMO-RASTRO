import scenesData from '@/data/scenes.json';
import { WeatherKind } from '@/ui/Atmosphere';

export type LightKind = 'lamp' | 'moon' | 'dark' | 'neon' | 'day' | 'fire' | 'illusion' | 'cube';

export interface SceneObject {
  id: string;
  kind: 'choice' | 'detail';
  label?: string;
  text?: string;
  choice?: string;
  icon?: string;
  x: number;
  y: number;
}

export interface SceneNpc {
  id: string;
  name: string;
  x: number;
  y: number;
  facing?: 1 | -1;
  ghost?: boolean;
  silhouette?: boolean;
  /** conversar com o NPC abre as escolhas da fase como diálogo */
  talk?: boolean;
}

export interface SceneLayout {
  phase: number;
  weather: WeatherKind;
  light: LightKind;
  walk: { minX: number; maxX: number; minY: number; maxY: number };
  spawn: [number, number];
  npc?: SceneNpc;
  objects: SceneObject[];
}

interface ScenesShape {
  version: number;
  scenes: SceneLayout[];
}

const DATA = scenesData as unknown as ScenesShape;

export function getSceneLayout(phaseId: number): SceneLayout | null {
  return DATA.scenes.find((s) => s.phase === phaseId) ?? null;
}

export function listSceneLayouts(): SceneLayout[] {
  return DATA.scenes;
}

/** Escala de perspectiva: 0.78 no fundo da área caminhável → 1.0 na frente. */
export function depthScaleFor(layout: SceneLayout): (y: number) => number {
  const { minY, maxY } = layout.walk;
  return (y: number) => {
    const t = Math.max(0, Math.min(1, (y - minY) / Math.max(1, maxY - minY)));
    return 0.78 + 0.22 * t;
  };
}
