/**
 * Layout espacial da Fase 1 (garagem). Dados puros em metros, eixo Y para cima,
 * piso em y = 0. Sem dependência de Babylon: usado pelo SpatialWorld e pelos testes.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoxSpec {
  id: string;
  kind: 'wall' | 'prop' | 'door';
  /** centro da caixa */
  pos: Vec3;
  size: Vec3;
  color: [number, number, number];
  /** bloqueia o Theo */
  collider: boolean;
  /** rotação em Y (rad) */
  rotY?: number;
}

export interface InteractableSpec {
  id: string;
  kind: 'detail' | 'choice';
  /** id da escolha em phases.json (kind = choice) */
  choice?: string;
  label: string;
  text?: string;
  icon?: string;
  /** ponto de interesse (para raycast de linha de visão) */
  target: Vec3;
  /** raio de interação a partir do ponto no piso */
  radius: number;
  /** caixa/objeto que representa o interativo (id de BoxSpec ou decal) */
  meshId: string;
}

export interface CameraSpec {
  id: string;
  pos: Vec3;
  /** zona em X/Z onde esta câmera é a ativa */
  zone: { minX: number; maxX: number; minZ: number; maxZ: number };
  fov: number;
}

export interface LightSpec {
  id: string;
  kind: 'bulb' | 'street' | 'fill';
  pos: Vec3;
  color: [number, number, number];
  intensity: number;
}

export interface SpatialLayout {
  id: string;
  phase: number;
  room: { minX: number; maxX: number; minZ: number; maxZ: number; height: number };
  spawn: { pos: Vec3; yaw: number };
  boxes: BoxSpec[];
  decals: Array<{ id: string; pos: Vec3; size: { x: number; z: number }; color: [number, number, number]; alpha: number }>;
  interactables: InteractableSpec[];
  cameras: CameraSpec[];
  lights: LightSpec[];
  /** margem de histerese (m) na troca de câmera */
  cameraHysteresis: number;
}

const WALL = 0.2;
const H = 3.2;
const CONCRETE: [number, number, number] = [0.33, 0.32, 0.31];
const WOOD: [number, number, number] = [0.3, 0.2, 0.13];
const DARKWOOD: [number, number, number] = [0.2, 0.14, 0.1];
const METAL: [number, number, number] = [0.28, 0.3, 0.33];
const CARDBOARD: [number, number, number] = [0.45, 0.35, 0.22];

export const GARAGE_LAYOUT: SpatialLayout = {
  id: 'garage',
  phase: 1,
  room: { minX: -5, maxX: 5, minZ: -4, maxZ: 4, height: H },
  spawn: { pos: { x: -4.1, y: 0, z: -1.5 }, yaw: Math.PI / 2 },
  cameraHysteresis: 0.5,
  boxes: [
    // paredes (norte z=-4, sul z=+4, oeste x=-5, leste x=+5)
    { id: 'wall_n', kind: 'wall', pos: { x: 0, y: H / 2, z: -4 - WALL / 2 }, size: { x: 10.4, y: H, z: WALL }, color: CONCRETE, collider: true },
    { id: 'wall_s_l', kind: 'wall', pos: { x: -3.6, y: H / 2, z: 4 + WALL / 2 }, size: { x: 3.2, y: H, z: WALL }, color: CONCRETE, collider: true },
    { id: 'wall_s_r', kind: 'wall', pos: { x: 3.6, y: H / 2, z: 4 + WALL / 2 }, size: { x: 3.2, y: H, z: WALL }, color: CONCRETE, collider: true },
    { id: 'garage_door', kind: 'door', pos: { x: 0, y: H / 2, z: 4 + WALL / 2 }, size: { x: 4, y: H, z: WALL * 0.6 }, color: METAL, collider: true },
    { id: 'wall_w', kind: 'wall', pos: { x: -5 - WALL / 2, y: H / 2, z: 0 }, size: { x: WALL, y: H, z: 8.4 }, color: CONCRETE, collider: true },
    { id: 'wall_e', kind: 'wall', pos: { x: 5 + WALL / 2, y: H / 2, z: 0 }, size: { x: WALL, y: H, z: 8.4 }, color: CONCRETE, collider: true },
    // portas (escolhas a / c)
    { id: 'door_kitchen', kind: 'door', pos: { x: -4.93, y: 1.05, z: -1.5 }, size: { x: 0.08, y: 2.1, z: 0.95 }, color: DARKWOOD, collider: true },
    { id: 'door_hall', kind: 'door', pos: { x: -2.5, y: 1.05, z: -3.93 }, size: { x: 0.95, y: 2.1, z: 0.08 }, color: DARKWOOD, collider: true },
    // mobília
    { id: 'workbench', kind: 'prop', pos: { x: 2, y: 0.45, z: -3.55 }, size: { x: 2.4, y: 0.9, z: 0.8 }, color: WOOD, collider: true },
    { id: 'toolbox', kind: 'prop', pos: { x: 2.6, y: 1.02, z: -3.55 }, size: { x: 0.5, y: 0.24, z: 0.26 }, color: [0.5, 0.1, 0.08], collider: false },
    { id: 'cabinet', kind: 'prop', pos: { x: 4.55, y: 1.1, z: -2.3 }, size: { x: 0.7, y: 2.2, z: 1.2 }, color: METAL, collider: true },
    // estante perto da parede sul: só oculta o canto sudeste a partir da câmera oeste (oclusão pontual)
    { id: 'shelf', kind: 'prop', pos: { x: 1.2, y: 1.1, z: 2.85 }, size: { x: 2.0, y: 2.2, z: 0.6 }, color: DARKWOOD, collider: true },
    { id: 'crate_1', kind: 'prop', pos: { x: -3.9, y: 0.35, z: 3.2 }, size: { x: 0.9, y: 0.7, z: 0.9 }, color: CARDBOARD, collider: true },
    { id: 'crate_2', kind: 'prop', pos: { x: -3.85, y: 1.0, z: 3.15 }, size: { x: 0.7, y: 0.6, z: 0.7 }, color: CARDBOARD, collider: true, rotY: 0.3 },
    { id: 'crate_3', kind: 'prop', pos: { x: 4.1, y: 0.3, z: 3.1 }, size: { x: 0.8, y: 0.6, z: 1.1 }, color: CARDBOARD, collider: true, rotY: -0.2 },
    { id: 'coat', kind: 'prop', pos: { x: -3.4, y: 0.04, z: 0.2 }, size: { x: 0.7, y: 0.08, z: 0.5 }, color: [0.36, 0.33, 0.38], collider: false, rotY: 0.5 },
    { id: 'bulb', kind: 'prop', pos: { x: 0.6, y: 2.75, z: -0.4 }, size: { x: 0.14, y: 0.2, z: 0.14 }, color: [1, 0.9, 0.7], collider: false }
  ],
  decals: [
    // vaga vazia: mancha de óleo e marcas de pneu (a pista)
    { id: 'oil_stain', pos: { x: 2.3, y: 0.006, z: 1.2 }, size: { x: 1.6, z: 1.1 }, color: [0.06, 0.06, 0.07], alpha: 0.55 },
    { id: 'tire_mark', pos: { x: 2.3, y: 0.008, z: 0.6 }, size: { x: 2.2, z: 2.9 }, color: [0.04, 0.04, 0.05], alpha: 0.8 }
  ],
  interactables: [
    { id: 'coat', kind: 'detail', label: 'Casaco da mãe', text: 'O casaco de Clara está no chão, ainda úmido. Ela nunca deixaria isso aqui.', target: { x: -3.4, y: 0.08, z: 0.2 }, radius: 1.3, meshId: 'coat' },
    { id: 'workbench', kind: 'detail', label: 'Bancada', text: 'Ferramentas do pai, alinhadas como ele gosta. Falta só a lanterna.', target: { x: 2, y: 0.95, z: -3.4 }, radius: 1.4, meshId: 'workbench' },
    { id: 'cabinet', kind: 'detail', label: 'Armário', text: 'Trancado. Um arranhão recente na fechadura.', target: { x: 4.2, y: 1.2, z: -2.3 }, radius: 1.3, meshId: 'cabinet' },
    { id: 'hall', kind: 'choice', choice: 'a', label: 'Quarto da mãe', target: { x: -2.5, y: 1.1, z: -3.85 }, radius: 1.4, meshId: 'door_hall' },
    { id: 'tire', kind: 'choice', choice: 'b', label: 'Marca de pneu', icon: '/images/clues/tire_mark.png', target: { x: 2.3, y: 0.05, z: 0.6 }, radius: 1.5, meshId: 'tire_mark' },
    { id: 'kitchen', kind: 'choice', choice: 'c', label: 'Cozinha', target: { x: -4.85, y: 1.1, z: -1.5 }, radius: 1.4, meshId: 'door_kitchen' }
  ],
  cameras: [
    // câmeras fixas de canto (estilo survival horror): posição fixa, alvo acompanha o Theo
    // câmera leste no meio da parede, olhando para as portas da casa (a estante fica fora desta linha de visão)
    { id: 'cam_east', pos: { x: 4.7, y: 2.8, z: 0.9 }, zone: { minX: -5, maxX: 0, minZ: -4, maxZ: 4 }, fov: 0.9 },
    { id: 'cam_west', pos: { x: -4.4, y: 2.75, z: 3.6 }, zone: { minX: 0, maxX: 5, minZ: -4, maxZ: 4 }, fov: 0.95 }
  ],
  lights: [
    { id: 'bulb', kind: 'bulb', pos: { x: 0.6, y: 2.6, z: -0.4 }, color: [1, 0.82, 0.55], intensity: 1.1 },
    { id: 'street', kind: 'street', pos: { x: 0, y: 2.9, z: 5.5 }, color: [0.55, 0.65, 0.95], intensity: 0.55 },
    { id: 'fill', kind: 'fill', pos: { x: 0, y: 6, z: 0 }, color: [0.35, 0.38, 0.5], intensity: 0.35 }
  ]
};

/** Câmera ativa para uma posição, com histerese para evitar alternância na fronteira. */
export function selectCamera(layout: SpatialLayout, x: number, z: number, currentId: string | null): CameraSpec {
  const inZone = (c: CameraSpec, m: number): boolean =>
    x >= c.zone.minX - m && x <= c.zone.maxX + m && z >= c.zone.minZ - m && z <= c.zone.maxZ + m;
  const current = layout.cameras.find((c) => c.id === currentId);
  if (current && inZone(current, layout.cameraHysteresis)) return current;
  return layout.cameras.find((c) => inZone(c, 0)) ?? layout.cameras[0];
}

/** Interativo mais próximo dentro do raio (distância no plano XZ). Linha de visão é checada no mundo 3D. */
export function nearestInteractable(
  layout: SpatialLayout,
  x: number,
  z: number,
  isVisible: (it: InteractableSpec) => boolean = () => true
): { item: InteractableSpec; distance: number } | null {
  let best: { item: InteractableSpec; distance: number } | null = null;
  for (const it of layout.interactables) {
    const d = Math.hypot(it.target.x - x, it.target.z - z);
    if (d > it.radius) continue;
    if (best && d >= best.distance) continue;
    if (!isVisible(it)) continue;
    best = { item: it, distance: d };
  }
  return best;
}

/** Aceleração/desaceleração simples em direção à velocidade desejada (m/s). */
export function approachVelocity(current: number, target: number, accel: number, decel: number, dt: number): number {
  const rate = Math.abs(target) > Math.abs(current) ? accel : decel;
  const delta = target - current;
  const step = rate * dt;
  return Math.abs(delta) <= step ? target : current + Math.sign(delta) * step;
}

/** Menor diferença angular (rad) de a para b, em [-π, π]. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// ------------------------------------------------------------------ controlador de personagem
/** Collider do ambiente no plano XZ (caixa orientada, altura ignorada para o Theo). */
export interface BoxCollider2D {
  id: string;
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  rotY: number;
}

export function collidersFromLayout(layout: SpatialLayout): BoxCollider2D[] {
  return layout.boxes
    .filter((b) => b.collider)
    .map((b) => ({ id: b.id, cx: b.pos.x, cz: b.pos.z, hx: b.size.x / 2, hz: b.size.z / 2, rotY: b.rotY ?? 0 }));
}

/**
 * Empurra um círculo (x, z, raio) para fora das caixas. Retorna a posição corrigida e os ids tocados.
 * Babylon usa rotação Y horária vista de cima: local = R(-rotY) * (p - c).
 */
export function resolveCircle(x: number, z: number, radius: number, boxes: BoxCollider2D[]): { x: number; z: number; hits: string[] } {
  const hits: string[] = [];
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const b of boxes) {
      const c = Math.cos(b.rotY);
      const s = Math.sin(b.rotY);
      const dx = x - b.cx;
      const dz = z - b.cz;
      // world → local (inversa da rotação Y do Babylon: x' = x cos − z sin, z' = x sin + z cos)
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      const qx = Math.max(-b.hx, Math.min(b.hx, lx));
      const qz = Math.max(-b.hz, Math.min(b.hz, lz));
      let nx = lx - qx;
      let nz = lz - qz;
      let dist = Math.hypot(nx, nz);
      let push = 0;
      if (dist < 1e-6) {
        // centro dentro da caixa: sai pelo eixo de menor penetração
        const px = b.hx - Math.abs(lx);
        const pz = b.hz - Math.abs(lz);
        if (px < pz) {
          nx = Math.sign(lx) || 1;
          nz = 0;
          push = px + radius;
        } else {
          nx = 0;
          nz = Math.sign(lz) || 1;
          push = pz + radius;
        }
        dist = 1;
      } else if (dist < radius) {
        push = radius - dist;
      } else continue;
      const ux = nx / dist;
      const uz = nz / dist;
      // local → world (x = x' cos + z' sin, z = −x' sin + z' cos)
      x += (ux * c + uz * s) * push;
      z += (-ux * s + uz * c) * push;
      moved = true;
      if (!hits.includes(b.id)) hits.push(b.id);
    }
    if (!moved) break;
  }
  return { x, z, hits };
}

/** Move o círculo com subpassos (sem atravessar paredes finas) e deslizamento ao longo das superfícies. */
export function moveCharacter(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  boxes: BoxCollider2D[]
): { x: number; z: number; hits: string[] } {
  const len = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(len / (radius * 0.35)));
  const hits: string[] = [];
  for (let i = 0; i < steps; i++) {
    const r = resolveCircle(x + dx / steps, z + dz / steps, radius, boxes);
    x = r.x;
    z = r.z;
    for (const h of r.hits) if (!hits.includes(h)) hits.push(h);
  }
  return { x, z, hits };
}
