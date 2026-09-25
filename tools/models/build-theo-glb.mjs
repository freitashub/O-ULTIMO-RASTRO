#!/usr/bin/env node
/**
 * Gera o modelo placeholder 3D do Theo (GLB) sem editor 3D, via glTF-Transform.
 * Hierarquia articulada para animação procedural no runtime:
 *   theo (raiz, pés em y=0, frente = +Z glTF)
 *   └ hips ─ torso ─ neck ─ head ─ hair / nose / eye_L / eye_R
 *          ├ arm_L / arm_R  (pivô no ombro, geometria pendurada para baixo)
 *          └ leg_L / leg_R  (pivô no quadril) ─ shoe_L / shoe_R
 * Unidades em metros (Theo, 11 anos ≈ 1,45 m).
 * Uso: node tools/models/build-theo-glb.mjs [--out public/assets/models/theo.glb]
 */
import { Document, NodeIO } from '@gltf-transform/core';
import path from 'node:path';
import fs from 'node:fs';

const outArg = process.argv.indexOf('--out');
const OUT = path.resolve(outArg > 0 ? process.argv[outArg + 1] : 'public/assets/models/theo.glb');

const doc = new Document();
doc.getRoot().getAsset().generator = 'O Ultimo Rastro — tools/models/build-theo-glb.mjs';
const buffer = doc.createBuffer();

const mat = (name, rgb, roughness = 0.85, metallic = 0) =>
  doc.createMaterial(name).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(roughness).setMetallicFactor(metallic);

const M = {
  hoodie: mat('hoodie', [0.07, 0.16, 0.27]),
  hoodieDark: mat('hoodie_dark', [0.05, 0.11, 0.19]),
  pants: mat('pants', [0.52, 0.45, 0.36]),
  skin: mat('skin', [0.86, 0.69, 0.56], 0.7),
  hair: mat('hair', [0.29, 0.16, 0.09], 0.9),
  shoe: mat('shoe', [0.55, 0.12, 0.1], 0.6),
  sole: mat('sole', [0.9, 0.9, 0.88], 0.7),
  eye: mat('eye', [0.05, 0.05, 0.06], 0.3),
};

function primitiveFrom(name, positions, normals, indices, material) {
  const pos = doc.createAccessor(`${name}_pos`).setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer);
  const nor = doc.createAccessor(`${name}_nor`).setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer);
  const idx = doc.createAccessor(`${name}_idx`).setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', pos).setAttribute('NORMAL', nor).setIndices(idx).setMaterial(material);
  return doc.createMesh(name).addPrimitive(prim);
}

/** caixa com cantos chanfrados (bevel) centrada em (cx,cy,cz) */
function box(name, sx, sy, sz, material, [cx, cy, cz] = [0, 0, 0], bevel = 0.18) {
  // octaedro truncado simples: caixa + faces chanfradas aproximadas via 8 vértices por face (sem UV)
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const b = Math.min(hx, hy, hz) * bevel;
  const positions = [], normals = [], indices = [];
  const face = (n, u, v, w) => {
    // n = normal, u/v = eixos do plano, w = meia-extensão ao longo de n; hu/hv meia-extensões
    const [hu, hv] = [Math.abs(u[0] * hx + u[1] * hy + u[2] * hz), Math.abs(v[0] * hx + v[1] * hy + v[2] * hz)];
    const base = positions.length / 3;
    const corners = [[-hu + b, -hv], [hu - b, -hv], [hu, -hv + b], [hu, hv - b], [hu - b, hv], [-hu + b, hv], [-hu, hv - b], [-hu, -hv + b]];
    for (const [a, c] of corners) {
      positions.push(cx + n[0] * w + u[0] * a + v[0] * c, cy + n[1] * w + u[1] * a + v[1] * c, cz + n[2] * w + u[2] * a + v[2] * c);
      normals.push(...n);
    }
    for (let i = 1; i < 7; i++) indices.push(base, base + i, base + i + 1);
  };
  face([0, 0, 1], [1, 0, 0], [0, 1, 0], hz);
  face([0, 0, -1], [-1, 0, 0], [0, 1, 0], hz);
  face([1, 0, 0], [0, 0, -1], [0, 1, 0], hx);
  face([-1, 0, 0], [0, 0, 1], [0, 1, 0], hx);
  face([0, 1, 0], [1, 0, 0], [0, 0, -1], hy);
  face([0, -1, 0], [1, 0, 0], [0, 0, 1], hy);
  return primitiveFrom(name, positions, normals, indices, material);
}

/** elipsoide (esfera escalada) centrada em (cx,cy,cz) */
function ellipsoid(name, rx, ry, rz, material, [cx, cy, cz] = [0, 0, 0], seg = 14, ring = 10, yCut = -1) {
  const positions = [], normals = [], indices = [];
  for (let r = 0; r <= ring; r++) {
    const phi = (r / ring) * Math.PI;
    const y = Math.cos(phi);
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(th), z = Math.sin(phi) * Math.sin(th);
      const yy = Math.max(y, yCut);
      positions.push(cx + x * rx, cy + yy * ry, cz + z * rz);
      const n = [x / rx, yy / ry, z / rz]; const l = Math.hypot(...n) || 1;
      normals.push(n[0] / l, n[1] / l, n[2] / l);
    }
  }
  for (let r = 0; r < ring; r++) for (let s = 0; s < seg; s++) {
    const a = r * (seg + 1) + s, b2 = a + seg + 1;
    indices.push(a, b2, a + 1, a + 1, b2, b2 + 1);
  }
  return primitiveFrom(name, positions, normals, indices, material);
}

const node = (name, t = [0, 0, 0], mesh = null) => {
  const n = doc.createNode(name).setTranslation(t);
  if (mesh) n.setMesh(mesh);
  return n;
};

// ---- montagem (frente = +Z)
const theo = node('theo');
const hips = node('hips', [0, 0.78, 0], box('hips_mesh', 0.34, 0.16, 0.2, M.pants, [0, 0, 0]));
const torso = node('torso', [0, 0.06, 0], box('torso_mesh', 0.4, 0.44, 0.24, M.hoodie, [0, 0.22, 0], 0.35));
const pocket = node('pocket', [0, 0.1, 0.12], box('pocket_mesh', 0.24, 0.1, 0.02, M.hoodieDark));
const hood = node('hood', [0, 0.42, -0.08], box('hood_mesh', 0.36, 0.12, 0.14, M.hoodieDark, [0, 0, 0], 0.6));
const neck = node('neck', [0, 0.46, 0], box('neck_mesh', 0.1, 0.06, 0.1, M.skin, [0, 0.03, 0]));
const head = node('head', [0, 0.06, 0], ellipsoid('head_mesh', 0.13, 0.15, 0.13, M.skin, [0, 0.14, 0.01]));
const hair = node('hair', [0, 0.2, -0.01], ellipsoid('hair_mesh', 0.15, 0.11, 0.155, M.hair, [0, 0.02, -0.01], 14, 10, -0.15));
const nose = node('nose', [0, 0.13, 0.135], box('nose_mesh', 0.03, 0.04, 0.03, M.skin));
const eyeL = node('eye_L', [0.045, 0.17, 0.12], ellipsoid('eye_L_mesh', 0.018, 0.022, 0.012, M.eye));
const eyeR = node('eye_R', [-0.045, 0.17, 0.12], ellipsoid('eye_R_mesh', 0.018, 0.022, 0.012, M.eye));
const armL = node('arm_L', [0.25, 0.4, 0], box('arm_L_mesh', 0.1, 0.46, 0.11, M.hoodie, [0, -0.21, 0], 0.4));
const armR = node('arm_R', [-0.25, 0.4, 0], box('arm_R_mesh', 0.1, 0.46, 0.11, M.hoodie, [0, -0.21, 0], 0.4));
const handL = node('hand_L', [0, -0.47, 0], ellipsoid('hand_L_mesh', 0.045, 0.055, 0.045, M.skin));
const handR = node('hand_R', [0, -0.47, 0], ellipsoid('hand_R_mesh', 0.045, 0.055, 0.045, M.skin));
const legL = node('leg_L', [0.09, -0.04, 0], box('leg_L_mesh', 0.13, 0.66, 0.14, M.pants, [0, -0.33, 0], 0.3));
const legR = node('leg_R', [-0.09, -0.04, 0], box('leg_R_mesh', 0.13, 0.66, 0.14, M.pants, [0, -0.33, 0], 0.3));
const shoeL = node('shoe_L', [0, -0.68, 0.03], box('shoe_L_mesh', 0.13, 0.08, 0.24, M.shoe, [0, 0, 0], 0.5));
const shoeR = node('shoe_R', [0, -0.68, 0.03], box('shoe_R_mesh', 0.13, 0.08, 0.24, M.shoe, [0, 0, 0], 0.5));
const soleL = node('sole_L', [0, -0.045, 0], box('sole_L_mesh', 0.135, 0.02, 0.245, M.sole));
const soleR = node('sole_R', [0, -0.045, 0], box('sole_R_mesh', 0.135, 0.02, 0.245, M.sole));

theo.addChild(hips);
hips.addChild(torso).addChild(legL).addChild(legR);
torso.addChild(pocket).addChild(hood).addChild(neck).addChild(armL).addChild(armR);
neck.addChild(head);
head.addChild(hair).addChild(nose).addChild(eyeL).addChild(eyeR);
armL.addChild(handL); armR.addChild(handR);
legL.addChild(shoeL); legR.addChild(shoeR);
shoeL.addChild(soleL); shoeR.addChild(soleR);

doc.createScene('theo_scene').addChild(theo);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await new NodeIO().write(OUT, doc);
console.log(`GLB: ${path.relative(process.cwd(), OUT)} (${fs.statSync(OUT).size} bytes, ${doc.getRoot().listNodes().length} nós, ${doc.getRoot().listMeshes().length} meshes)`);
