import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { SpatialWorld } from '@/spatial/SpatialWorld';
import { GARAGE_LAYOUT, InteractableSpec, angleDelta, approachVelocity, nearestInteractable, selectCamera } from '@/spatial/garageLayout';
import phases from '@/data/phases.json';

const step = (w: SpatialWorld, seconds: number, dir: { x: number; z: number } | null, input = { x: 0, y: 0 }): void => {
  const n = Math.round(seconds / (1 / 30));
  for (let i = 0; i < n; i++) w.step(1 / 30, dir ? { ...input, world: dir } : input);
};

describe('garageLayout (dados puros)', () => {
  it('interativos de escolha cobrem as 3 escolhas da fase 1; a correta é a marca de pneu', () => {
    const phase1 = phases.find((p) => p.id === 1)!;
    const choices = GARAGE_LAYOUT.interactables.filter((i) => i.kind === 'choice');
    expect(choices.map((c) => c.choice).sort()).toEqual(phase1.choices.map((c) => c.id).sort());
    const correct = phase1.choices.find((c) => c.correct)!;
    expect(choices.find((c) => c.choice === correct.id)?.id).toBe('tire');
    const icon = choices.find((c) => c.id === 'tire')!.icon!;
    expect(fs.existsSync(path.join(process.cwd(), 'public', icon))).toBe(true);
  });

  it('seleção de câmera por zona com histerese', () => {
    expect(selectCamera(GARAGE_LAYOUT, -2, 0, null).id).toBe('cam_east');
    expect(selectCamera(GARAGE_LAYOUT, 2, 0, null).id).toBe('cam_west');
    expect(selectCamera(GARAGE_LAYOUT, 0.3, 0, 'cam_east').id).toBe('cam_east'); // dentro da histerese
    expect(selectCamera(GARAGE_LAYOUT, 0.8, 0, 'cam_east').id).toBe('cam_west');
  });

  it('interativo mais próximo respeita raio e filtro de visibilidade', () => {
    expect(nearestInteractable(GARAGE_LAYOUT, 2.3, -0.4)?.item.id).toBe('tire');
    expect(nearestInteractable(GARAGE_LAYOUT, 0, 0)).toBeNull();
    expect(nearestInteractable(GARAGE_LAYOUT, 2.3, -0.4, () => false)).toBeNull();
  });

  it('aceleração/desaceleração e ângulos', () => {
    expect(approachVelocity(0, 2, 10, 20, 0.1)).toBeCloseTo(1);
    expect(approachVelocity(2, 0, 10, 20, 0.05)).toBeCloseTo(1);
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
  });
});

describe('SpatialWorld (Babylon NullEngine: colisão, raycast, oclusão)', () => {
  let world: SpatialWorld;
  beforeEach(async () => {
    world = new SpatialWorld(GARAGE_LAYOUT, { headless: true });
    await world.build();
  });
  afterEach(() => world.dispose());

  it('cena espacial real: piso, paredes, objetos e Theo com posição 3D', () => {
    const names = world.scene.meshes.map((m) => m.name);
    for (const n of ['floor', 'wall_n', 'wall_w', 'wall_e', 'workbench', 'cabinet', 'shelf', 'crate_1', 'door_kitchen', 'door_hall', 'tire_mark', 'theo_collider']) {
      expect(names).toContain(n);
    }
    const p = world.getTheoPosition();
    expect(p).toEqual({ x: GARAGE_LAYOUT.spawn.pos.x, y: 0, z: GARAGE_LAYOUT.spawn.pos.z });
  });

  it('Theo colide com a parede oeste (não atravessa)', () => {
    world.teleport(-3, 0.8);
    step(world, 3, { x: -1, z: 0 });
    const p = world.getTheoPosition();
    expect(p.x).toBeGreaterThan(-5 + 0.2);
    expect(p.x).toBeLessThan(-4.5);
  });

  it('Theo colide com a estante e consegue contorná-la', () => {
    world.teleport(1.2, 1.8, 0);
    step(world, 2, { x: 0, z: 1 });
    const blocked = world.getTheoPosition();
    expect(blocked.z).toBeLessThan(2.55);
    expect(blocked.z).toBeGreaterThan(2.0);
    step(world, 0.8, { x: 1, z: 0 }); // desvia para a ponta leste
    step(world, 1.5, { x: 0, z: 1 });
    const around = world.getTheoPosition();
    expect(around.x).toBeGreaterThan(2.46);
    expect(around.z).toBeGreaterThan(3.2); // passou para trás da estante
  });

  it('acelera e desacelera (não teleporta)', () => {
    world.teleport(0, -1, 0);
    world.step(1 / 30, { x: 0, y: 0, world: { x: 0, z: 1 } });
    const s1 = world.getDebugState().theo.speed;
    step(world, 1, { x: 0, z: 1 });
    const s2 = world.getDebugState().theo.speed;
    expect(s1).toBeLessThan(s2);
    world.step(1 / 30, { x: 0, y: 0 });
    const s3 = world.getDebugState().theo.speed;
    expect(s3).toBeLessThan(s2);
    expect(s3).toBeGreaterThan(0);
  });

  it('input da tela é relativo à câmera: "para frente" afasta o Theo da câmera', () => {
    world.teleport(-2, -1, 0);
    world.step(1 / 30, { x: 0, y: 0 });
    const cam = world.getCameraPosition();
    const d0 = Math.hypot(world.getTheoPosition().x - cam.x, world.getTheoPosition().z - cam.z);
    step(world, 0.8, null, { x: 0, y: 1 });
    const d1 = Math.hypot(world.getTheoPosition().x - cam.x, world.getTheoPosition().z - cam.z);
    expect(d1).toBeGreaterThan(d0 + 0.5);
  });

  it('câmera troca de zona ao atravessar a garagem', () => {
    world.teleport(-1.5, -1, Math.PI / 2);
    world.step(1 / 30, { x: 0, y: 0 });
    expect(world.getDebugState().camera).toBe('cam_east');
    step(world, 1.5, { x: 1, z: 0 });
    expect(world.getDebugState().camera).toBe('cam_west');
  });

  it('interação por proximidade + raycast: foco na marca de pneu', () => {
    world.teleport(2.3, -0.5);
    world.step(1 / 30, { x: 0, y: 0 });
    expect(world.getFocus()?.id).toBe('tire');
    world.teleport(0, 0);
    world.step(1 / 30, { x: 0, y: 0 });
    expect(world.getFocus()).toBeNull();
  });

  it('linha de visão bloqueada por objeto sólido (estante)', () => {
    world.teleport(1.2, 2.0);
    const behindShelf: InteractableSpec = { id: 't', kind: 'detail', label: 't', target: { x: 1.2, y: 0.8, z: 3.6 }, radius: 3, meshId: 'none' };
    const openSpot: InteractableSpec = { ...behindShelf, target: { x: -1, y: 0.8, z: 1.0 } };
    expect(world.hasLineOfSight(behindShelf)).toBe(false);
    expect(world.hasLineOfSight(openSpot)).toBe(true);
  });

  it('oclusão real e pontual: a estante esconde o Theo só no canto sudeste', () => {
    world.teleport(3.0, 2.3);
    step(world, 1, null); // câmera conclui a transição suave
    expect(world.getDebugState().camera).toBe('cam_west');
    expect(world.occluderBetweenCameraAndTheo()).toBe('shelf');
    expect(world.occluderBetweenCameraAndTheo(0.7)).toBe('shelf');
    // pontos de jogo importantes ficam visíveis (cabeça e tronco)
    for (const [x, z] of [[2.3, -0.5], [-4.1, -1.5], [-4.6, -0.5], [-4.6, 1.5], [-3.4, 0.6], [-2.5, -3.2], [-1, 2.4], [2, -2.8], [4.1, -1.8]]) {
      world.teleport(x, z);
      step(world, 1, null);
      expect(world.occluderBetweenCameraAndTheo(), `cabeça (${x}, ${z})`).toBeNull();
      expect(world.occluderBetweenCameraAndTheo(0.7), `tronco (${x}, ${z})`).toBeNull();
    }
  });

  it('clique no piso contorna obstáculo no caminho (caixas do canto)', () => {
    world.teleport(-4.6, 3.0);
    world.setWalkTarget(-0.6, 2.4);
    step(world, 5, null);
    const p = world.getTheoPosition();
    expect(Math.hypot(p.x + 0.6, p.z - 2.4)).toBeLessThan(0.25);
  });

  it('clique no piso: Theo caminha até o alvo', () => {
    world.teleport(-2, -1);
    world.setWalkTarget(1, -1);
    step(world, 3, null);
    expect(world.getTheoPosition().x).toBeGreaterThan(0.8);
  });
});

describe('modelo GLB do Theo (v3, skinned, arte de referência)', () => {
  it('malha contínua com esqueleto: 19 ossos (joelho, cotovelo, tornozelo, pescoço) e pesos normalizados', async () => {
    const file = path.join(process.cwd(), 'public/assets/models/theo.glb');
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeLessThan(500_000);
    const doc = await new NodeIO().read(file);
    const names = doc.getRoot().listNodes().map((n) => n.getName());
    for (const n of ['theo', 'hips', 'spine', 'chest', 'neck', 'head', 'nose', 'upperarm_L', 'forearm_L', 'hand_L', 'upperarm_R', 'forearm_R', 'thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R']) {
      expect(names).toContain(n);
    }
    const skins = doc.getRoot().listSkins();
    expect(skins).toHaveLength(1);
    expect(skins[0].listJoints()).toHaveLength(19);
    const meshes = doc.getRoot().listMeshes();
    expect(meshes).toHaveLength(1); // um único corpo, não peças empilhadas
    for (const prim of meshes[0].listPrimitives()) {
      const w = prim.getAttribute('WEIGHTS_0')!.getArray()!;
      for (let i = 0; i < w.length; i += 4) expect(w[i] + w[i + 1] + w[i + 2] + w[i + 3]).toBeCloseTo(1, 4);
      expect(prim.getAttribute('JOINTS_0')).toBeTruthy();
    }
  });

  it('fiel à arte: rosto texturizado com a referência, casaco dupla face e peças do figurino', async () => {
    const doc = await new NodeIO().read(path.join(process.cwd(), 'public/assets/models/theo.glb'));
    const prims = doc.getRoot().listMeshes()[0].listPrimitives();
    const byMat = new Map(prims.map((p) => [p.getMaterial()!.getName(), p]));
    for (const m of ['coat', 'sweater', 'shirt', 'pants', 'patch', 'boot', 'bag', 'strap', 'hair', 'face', 'skin']) expect(byMat.has(m), m).toBe(true);
    const face = byMat.get('face')!;
    expect(face.getAttribute('TEXCOORD_0')).toBeTruthy();
    expect(face.getMaterial()!.getBaseColorTexture()?.getMimeType()).toBe('image/jpeg');
    expect(byMat.get('coat')!.getMaterial()!.getDoubleSided()).toBe(true);
    // cor por vértice (sujeira) nas roupas
    expect(byMat.get('coat')!.getAttribute('COLOR_0')).toBeTruthy();
    // altura ~1,45 m com os pés no chão
    let minY = Infinity, maxY = -Infinity;
    for (const p of prims) {
      const a = p.getAttribute('POSITION')!.getArray()!;
      for (let i = 1; i < a.length; i += 3) { minY = Math.min(minY, a[i]); maxY = Math.max(maxY, a[i]); }
    }
    expect(minY).toBeGreaterThan(-0.01);
    expect(maxY).toBeGreaterThan(1.4);
    expect(maxY).toBeLessThan(1.6);
  });

  it('assets 2D do Theo derivados da referência (sprite do catálogo bate com o arquivo)', async () => {
    expect(fs.existsSync(path.join(process.cwd(), 'referencias/personagens/theo/theo_normal.webp'))).toBe(true);
    const sprites = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/sprites.json'), 'utf8'));
    const png = fs.readFileSync(path.join(process.cwd(), 'public/assets/sprites/theo.png'));
    expect(png.readUInt32BE(16)).toBe(sprites.sprites.theo.width);
    expect(png.readUInt32BE(20)).toBe(sprites.sprites.theo.height);
  });
});

describe('animação procedural do Theo', () => {
  it('caminhada: coxas alternadas, joelhos dobram, braços opostos às pernas; parado volta ao repouso', async () => {
    const w = new SpatialWorld(GARAGE_LAYOUT, { headless: true });
    await w.build();
    w.teleport(-2, -1, 0);
    let maxThighDiff = 0;
    let maxKnee = 0;
    let armOpposite = 0;
    let samples = 0;
    for (let i = 0; i < 60; i++) {
      w.step(1 / 30, { x: 0, y: 0, world: { x: 1, z: 0 } });
      const pose = w.getDebugState().pose;
      maxThighDiff = Math.max(maxThighDiff, Math.abs(pose.thighL - pose.thighR));
      maxKnee = Math.max(maxKnee, Math.abs(pose.shinL), Math.abs(pose.shinR));
      if (i > 20 && Math.abs(pose.thighL) > 0.1) {
        samples++;
        if (Math.sign(pose.thighL) !== Math.sign(pose.upperarmL)) armOpposite++;
      }
    }
    expect(maxThighDiff).toBeGreaterThan(0.6);
    expect(maxKnee).toBeGreaterThan(0.4);
    expect(armOpposite / Math.max(1, samples)).toBeGreaterThan(0.8);
    for (let i = 0; i < 45; i++) w.step(1 / 30, { x: 0, y: 0 });
    const rest = w.getDebugState().pose;
    expect(Math.abs(rest.thighL)).toBeLessThan(0.08);
    expect(Math.abs(rest.shinL)).toBeLessThan(0.12);
    w.dispose();
  });
});

describe('controlador de personagem (círculo × caixas orientadas)', () => {
  it('empurra para fora de caixa rotacionada e desliza', async () => {
    const { resolveCircle, moveCharacter } = await import('@/spatial/garageLayout');
    const box = { id: 'b', cx: 0, cz: 0, hx: 1, hz: 0.5, rotY: 0 };
    expect(resolveCircle(1.1, 0, 0.3, [box]).x).toBeCloseTo(1.3);
    const rot = { ...box, rotY: Math.PI / 2 }; // agora ocupa |x|≤0.5, |z|≤1
    const r = resolveCircle(0.6, 0, 0.3, [rot]);
    expect(r.x).toBeCloseTo(0.8);
    expect(r.hits).toEqual(['b']);
    // deslizamento: indo na diagonal contra a parede, avança no eixo livre
    const wall = { id: 'w', cx: 0, cz: 0, hx: 5, hz: 0.1, rotY: 0 };
    const m = moveCharacter(0, -1, 1, 1, 0.3, [wall]);
    expect(m.z).toBeLessThan(-0.39);
    expect(m.x).toBeGreaterThan(0.9);
    // sem tunelamento em passo grande
    expect(moveCharacter(0, -1, 0, 3, 0.3, [wall]).z).toBeLessThan(-0.39);
  });
});
