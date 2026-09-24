export interface AssetsManifest {
  version: number;
  generatedAt?: string;
  backgrounds: string[];
  symbols: string[];
  portraits: string[];
  clueIcons: string[];
  cubeFaces: string[];
  endings: string[];
  transformation: string[];
  characters: string[];
  audio: string[];
  video: string[];
  all: string[];
}

let cache: AssetsManifest | null = null;
let pending: Promise<AssetsManifest> | null = null;

const EMPTY: AssetsManifest = {
  version: 2,
  backgrounds: [],
  symbols: [],
  portraits: [],
  clueIcons: [],
  cubeFaces: [],
  endings: [],
  transformation: [],
  characters: [],
  audio: [],
  video: [],
  all: []
};

export async function loadAssetsManifest(): Promise<AssetsManifest> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    try {
      const res = await fetch('/data/assets-manifest.json');
      if (!res.ok) {
        cache = EMPTY;
        return cache;
      }
      const data = (await res.json()) as Partial<AssetsManifest>;
      cache = {
        ...EMPTY,
        ...data,
        backgrounds: data.backgrounds ?? [],
        symbols: data.symbols ?? [],
        portraits: data.portraits ?? [],
        clueIcons: data.clueIcons ?? [],
        cubeFaces: data.cubeFaces ?? [],
        endings: data.endings ?? [],
        transformation: data.transformation ?? [],
        characters: data.characters ?? [],
        audio: data.audio ?? [],
        video: data.video ?? [],
        all: data.all ?? []
      };
    } catch {
      cache = EMPTY;
    } finally {
      pending = null;
    }
    return cache;
  })();
  return pending;
}

export function hasAssetPath(path: string): boolean {
  if (!cache) return false;
  if (cache.all.includes(path)) return true;
  return (
    cache.backgrounds.includes(path) ||
    cache.symbols.includes(path) ||
    cache.portraits.includes(path) ||
    cache.clueIcons.includes(path) ||
    cache.cubeFaces.includes(path) ||
    cache.endings.includes(path) ||
    cache.transformation.includes(path) ||
    cache.characters.includes(path) ||
    cache.audio.includes(path) ||
    cache.video.includes(path)
  );
}

/** Para testes: injeta um manifest sem fetch. */
export function setAssetsManifestForTests(manifest: Partial<AssetsManifest> | null): void {
  cache = manifest ? { ...EMPTY, ...manifest } : null;
  pending = null;
}

export function getManifest(): AssetsManifest {
  return cache ?? EMPTY;
}

export function clearAssetsManifestCache(): void {
  cache = null;
  pending = null;
}
