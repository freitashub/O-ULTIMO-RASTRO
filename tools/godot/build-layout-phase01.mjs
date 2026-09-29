#!/usr/bin/env node
/**
 * Gera godot/data/layouts/phase01.json (blockout da Fase 1: sala, varanda, garagem).
 * Fonte editável do layout; o JSON gerado é versionado. Medidas em metros, Y para cima, -Z = norte.
 * Textos das interações vêm de src/data/scenes.json (Fase 1) e phases.json — nada de narrativa nova aqui,
 * exceto legendas de objetos ainda sem texto na fonte (marcadas "authored": true para revisão narrativa).
 */
import fs from 'node:fs';

const phases = JSON.parse(fs.readFileSync('src/data/phases.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync('src/data/scenes.json', 'utf8'));
const p1 = phases.find((p) => p.id === 1);
const s1 = scenes.scenes.find((s) => s.phase === 1);
const detail = (id) => s1.objects.find((o) => o.id === id)?.text;

const T = 0.2; // espessura das paredes
const H = 3.0;
const C = { plaster: [0.30, 0.31, 0.33], plaster2: [0.27, 0.27, 0.29], concrete: [0.33, 0.32, 0.31], wood: [0.30, 0.20, 0.13], dark: [0.16, 0.12, 0.09], metal: [0.27, 0.30, 0.33], card: [0.42, 0.33, 0.21], fabric: [0.22, 0.26, 0.31] };
const boxes = [];
const box = (id, pos, size, color, o = {}) => boxes.push({ id, pos, size, color, collider: o.collider ?? true, mat: o.mat ?? 'plaster', rot_y: o.rot_y ?? 0, cast: o.cast ?? false });

/** parede ao longo de um eixo com vãos: gera segmentos + verga */
function wall(prefix, axis, fixed, a0, a1, openings, color, mat = 'plaster') {
  const ops = [...openings].sort((p, q) => p.c - q.c);
  let cur = a0;
  const seg = (s, e, i) => {
    if (e - s < 0.01) return;
    const mid = (s + e) / 2, len = e - s;
    box(`${prefix}_${i}`, axis === 'x' ? [mid, H / 2, fixed] : [fixed, H / 2, mid], axis === 'x' ? [len, H, T] : [T, H, len], color, { mat });
  };
  ops.forEach((o, i) => {
    seg(cur, o.c - o.w / 2, i);
    const lh = H - o.h;
    box(`${prefix}_lintel_${i}`, axis === 'x' ? [o.c, o.h + lh / 2, fixed] : [fixed, o.h + lh / 2, o.c], axis === 'x' ? [o.w, lh, T] : [T, lh, o.w], color, { mat });
    cur = o.c + o.w / 2;
  });
  seg(cur, a1, 'end');
}
const floor = (id, x0, x1, z0, z1, color, mat) => box(id, [(x0 + x1) / 2, -0.1, (z0 + z1) / 2], [x1 - x0, 0.2, z1 - z0], color, { mat });
const ceil = (id, x0, x1, z0, z1, color) => box(id, [(x0 + x1) / 2, H + 0.1, (z0 + z1) / 2], [x1 - x0, 0.2, z1 - z0], color, { mat: 'plaster', collider: false });

// pisos e tetos
floor('floor_sala', -6, 2, -4, 3, C.wood, 'floor');
floor('floor_garagem', 2, 10, -4, 3, C.concrete, 'concrete');
floor('floor_varanda', -6.4, 0.6, 3, 7.2, [0.2, 0.2, 0.22], 'concrete');
ceil('ceil_sala', -6, 2, -4, 3, C.plaster2);
ceil('ceil_garagem', 2, 10, -4, 3, C.concrete);

// paredes
wall('wall_n_sala', 'x', -4 - T / 2, -6.1, 2, [{ c: -4.5, w: 1.0, h: 2.1 }, { c: -1.5, w: 1.0, h: 2.1 }], C.plaster);
wall('wall_n_garagem', 'x', -4 - T / 2, 2, 10.1, [], C.concrete, 'concrete');
wall('wall_s_sala', 'x', 3 + T / 2, -6.1, 2, [{ c: -3.0, w: 1.8, h: 2.3 }], C.plaster);
wall('wall_s_garagem', 'x', 3 + T / 2, 2, 10.1, [], C.concrete, 'concrete');
wall('wall_w', 'z', -6 - T / 2, -4.1, 3.1, [], C.plaster);
wall('wall_e', 'z', 10 + T / 2, -4.1, 3.1, [], C.concrete, 'concrete');
wall('wall_mid', 'z', 2, -4, 3, [{ c: -1.0, w: 1.1, h: 2.1 }], C.plaster);
// portão da garagem (fechado, fresta de luz da rua)
box('garage_gate', [6, 1.2, 3 + T * 0.4], [3.2, 2.4, 0.06], C.metal, { mat: 'metal', collider: false });
// varanda: guarda-corpo baixo (impede sair do mapa)
box('rail_s', [-2.9, 0.5, 7.2], [7.0, 1.0, 0.1], C.dark, { mat: 'wood' });
box('rail_w', [-6.4, 0.5, 5.1], [0.1, 1.0, 4.4], C.dark, { mat: 'wood' });
box('rail_e', [0.6, 0.5, 5.1], [0.1, 1.0, 4.4], C.dark, { mat: 'wood' });
box('porch_post_l', [-3.8, 1.2, 3.05], [0.14, 2.4, 0.14], C.dark, { mat: 'wood', collider: false });
box('porch_post_r', [-2.2, 1.2, 3.05], [0.14, 2.4, 0.14], C.dark, { mat: 'wood', collider: false });

// mobília da sala
box('sofa', [-5.15, 0.4, 0.4], [0.95, 0.8, 2.3], C.fabric, { mat: 'fabric' });
box('coffee_table', [-3.4, 0.22, 0.4], [1.2, 0.44, 0.7], C.wood, { mat: 'wood' });
box('bookshelf', [-5.75, 1.0, -2.7], [0.4, 2.0, 1.7], C.dark, { mat: 'wood' });
box('clock', [-5.86, 1.9, -1.1], [0.08, 0.5, 0.5], [0.8, 0.75, 0.6], { mat: 'metal', collider: false });
box('coat', [-2.5, 0.03, 1.3], [0.7, 0.06, 0.5], [0.36, 0.33, 0.38], { mat: 'fabric', collider: false, rot_y: 0.5 });
box('sala_lamp', [-3.4, 2.75, -0.5], [0.22, 0.3, 0.22], [1, 0.9, 0.7], { mat: 'metal', collider: false });

// garagem
box('workbench', [7.0, 0.45, -3.55], [2.0, 0.9, 0.8], C.wood, { mat: 'wood' });
box('toolbox', [7.6, 1.02, -3.55], [0.5, 0.24, 0.26], [0.5, 0.1, 0.08], { mat: 'metal', collider: false });
box('cabinet', [9.55, 1.1, -2.6], [0.7, 2.2, 1.2], C.metal, { mat: 'metal' });
box('shelf', [8.8, 0.8, 2.6], [2.0, 1.6, 0.6], C.dark, { mat: 'wood' });
box('crate_1', [2.6, 0.35, 2.3], [0.9, 0.7, 0.9], C.card, { mat: 'wood' });
box('crate_2', [2.65, 1.0, 2.25], [0.7, 0.6, 0.7], C.card, { mat: 'wood', rot_y: 0.3 });
box('crate_3', [5.0, 0.3, -3.3], [0.8, 0.6, 1.0], C.card, { mat: 'wood', rot_y: -0.2 });
box('pinboard', [9.94, 1.5, 0.2], [0.05, 0.9, 1.3], [0.35, 0.25, 0.16], { mat: 'wood', collider: false });
box('photo', [9.9, 1.5, 0.2], [0.03, 0.42, 0.32], [0.62, 0.56, 0.44], { mat: 'metal', collider: false });
box('garage_bulb', [6, 2.8, -0.4], [0.14, 0.2, 0.14], [1, 0.9, 0.7], { mat: 'metal', collider: false });

const decals = [
  { id: 'tire_mark_porch', pos: [-4.3, 0.012, 5.2], size: [1.0, 3.2], rot_y: 0.12, color: [0.03, 0.03, 0.04], alpha: 0.85, shine: true },
  { id: 'puddle_porch', pos: [-3.2, 0.011, 6.0], size: [1.6, 1.0], rot_y: -0.3, color: [0.18, 0.22, 0.3], alpha: 0.6, shine: true },
  { id: 'oil_stain', pos: [6.3, 0.006, 0.9], size: [1.6, 1.1], rot_y: 0, color: [0.05, 0.05, 0.06], alpha: 0.6 },
  { id: 'tire_mark', pos: [6.2, 0.008, 0.2], size: [2.0, 3.6], rot_y: 0.05, color: [0.04, 0.04, 0.05], alpha: 0.85 }
];

const choice = (id) => ({ type: 'choice', choice: id });
const interactables = [
  { id: 'clock', kind: 'detail', label: 'Relógio parado', pos: [-5.5, 0, -1.1], radius: 1.4, height: 1.9, on_interact: { type: 'examine', id: 'clock', text: detail('clock'), flag: 'saw_stopped_clock' } },
  { id: 'coat', kind: 'detail', label: 'Casaco da mãe', pos: [-2.5, 0, 1.3], radius: 1.3, height: 0.1, on_interact: { type: 'examine', id: 'coat', text: detail('coat'), flag: 'saw_mother_coat' } },
  { id: 'porch_tire', kind: 'detail', label: 'Marca de pneu', pos: [-4.3, 0, 5.0], radius: 1.6, height: 0.05, on_interact: { type: 'examine', id: 'porch_tire', text: p1.scene, flag: 'saw_tire_mark' } },
  { id: 'door_quarto', kind: 'choice', label: p1.choices[0].text, pos: [-4.5, 0, -4.0], radius: 1.5, height: 1.1, door: 'door_quarto', on_interact: choice('a') },
  { id: 'door_cozinha', kind: 'choice', label: p1.choices[2].text, pos: [-1.5, 0, -4.0], radius: 1.5, height: 1.1, door: 'door_cozinha', on_interact: choice('c') },
  { id: 'door_garagem', kind: 'choice', label: p1.choices[1].text, pos: [2.0, 0, -1.0], radius: 1.5, height: 1.1, door: 'door_garagem', on_interact: choice('b') },
  { id: 'garage_tire', kind: 'detail', label: 'Marca de pneu', pos: [6.2, 0, 0.2], radius: 1.7, height: 0.05, enabled: false, on_interact: { type: 'examine', id: 'garage_tire', text: 'Borracha fresca, a marca vai até a vaga vazia. O carro saiu com pressa.', authored: true, flag: 'saw_tire_mark', clue: 'tire_mark' } },
  { id: 'workbench', kind: 'detail', label: 'Bancada', pos: [7.0, 0, -3.0], radius: 1.4, height: 0.95, enabled: false, on_interact: { type: 'examine', id: 'workbench', text: 'Ferramentas do pai, alinhadas como ele gosta. Falta só a lanterna.', authored: true } },
  { id: 'cabinet', kind: 'detail', label: 'Armário', pos: [9.1, 0, -2.6], radius: 1.3, height: 1.2, enabled: false, on_interact: { type: 'examine', id: 'cabinet', text: 'Trancado. Um arranhão recente na fechadura.', authored: true } },
  { id: 'photo', kind: 'detail', label: 'Fotografia antiga', pos: [9.4, 0, 0.2], radius: 1.5, height: 1.5, enabled: false, on_interact: { type: 'examine', id: 'photo', text: p1.revelation, flag: 'found_photo_symbol', then: 'finish_phase' } }
];

const doors = [
  { id: 'door_quarto', pos: [-4.5, 0, -4 - T / 2], axis: 'x', width: 1.0, height: 2.1, hinge: 'min', color: C.dark },
  { id: 'door_cozinha', pos: [-1.5, 0, -4 - T / 2], axis: 'x', width: 1.0, height: 2.1, hinge: 'max', color: C.dark },
  { id: 'door_garagem', pos: [2.0, 0, -1.0], axis: 'z', width: 1.1, height: 2.1, hinge: 'min', color: C.dark }
];

const FOV = 44;
const cameras = [
  { id: 'sala_entrada', camera_position: [1.6, 2.65, -3.5], fov: FOV, priority: 0, transition: 0.55, follow_damping: 5, camera_zone: { min: [-6, -1, -0.3], max: [2, 4, 3.0] } },
  { id: 'sala_portas', camera_position: [-5.6, 2.6, 2.6], fov: 46, priority: 0, transition: 0.55, follow_damping: 5, camera_zone: { min: [-6, -1, -4], max: [2, 4, -0.3] } },
  { id: 'varanda', camera_position: [-3.0, 2.5, 6.8], fov: 50, priority: 0, transition: 0.55, follow_damping: 5, camera_zone: { min: [-6.5, -1, 3.0], max: [0.7, 4, 7.3] } },
  { id: 'garagem_entrada', camera_position: [9.4, 2.7, 2.5], fov: 46, priority: 0, transition: 0.55, follow_damping: 5, camera_zone: { min: [2, -1, -4], max: [6.2, 4, 3] } },
  { id: 'garagem_fundo', camera_position: [2.6, 2.7, -3.5], fov: 46, priority: 0, transition: 0.55, follow_damping: 5, camera_zone: { min: [6.2, -1, -4], max: [10.2, 4, 3] } }
];

const lights = [
  { id: 'sala_lamp', kind: 'omni', pos: [-3.4, 2.5, -0.5], color: [1, 0.78, 0.5], energy: 1.1, range: 7.5, shadow: false },
  { id: 'sala_cold', kind: 'omni', pos: [-3.0, 2.6, 4.5], color: [0.5, 0.62, 0.95], energy: 0.8, range: 7.0, shadow: false },
  { id: 'garage_bulb', kind: 'spot', pos: [6, 2.7, -0.4], color: [1, 0.82, 0.55], energy: 2.0, range: 11, angle: 80, shadow: true },
  { id: 'garage_fill', kind: 'omni', pos: [6, 2.6, 0.5], color: [0.6, 0.66, 0.85], energy: 0.55, range: 12, shadow: false },
  { id: 'porch_street', kind: 'omni', pos: [-1.5, 3.2, 5.5], color: [0.45, 0.58, 1.0], energy: 1.2, range: 8.0, shadow: false }
];

const out = {
  id: 'phase01',
  phase: 1,
  spawn: { pos: [-1.6, 0, 1.2], yaw_deg: 0 },
  environment: { ambient: [0.19, 0.21, 0.28], ambient_energy: 0.85, fog_density: 0.012, fog_color: [0.07, 0.08, 0.11] },
  boxes, decals, interactables, doors, cameras, lights,
  audio: { music: 'music_phase01', ambience: 'amb_house' },
  objective: p1.objective
};
fs.mkdirSync('godot/data/layouts', { recursive: true });
fs.writeFileSync('godot/data/layouts/phase01.json', JSON.stringify(out, null, 1) + '\n');
console.log(`phase01: ${boxes.length} caixas, ${interactables.length} interativos, ${cameras.length} câmeras, ${lights.length} luzes`);
