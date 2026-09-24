import spriteData from '@/data/sprites.json';

interface SpritesShape {
  basePath: string;
  sprites: Record<string, { file: string; width: number; height: number; desc: string }>;
}
const SPRITES = spriteData as SpritesShape;

/** Catálogo de sprites recortados (sem dependência do Phaser; usável em testes). */
export function spritePath(id: string): string | null {
  const s = SPRITES.sprites[id];
  return s ? `${SPRITES.basePath}/${s.file}` : null;
}

export function listSprites(): string[] {
  return Object.keys(SPRITES.sprites);
}
