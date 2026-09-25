#!/usr/bin/env node
/**
 * Theo v2 — modelo 3D com malha contínua e esqueleto (skinning), gerado por script com glTF-Transform.
 * Sem Blender. Corpo feito por "loft" de anéis elípticos ao longo dos ossos, com pesos suaves nas
 * articulações (quadril, joelho, tornozelo, ombro, cotovelo, punho, pescoço), para dobrar sem emendas.
 *
 * Esqueleto (frente = +Z glTF, pés em y=0, ~1,48 m):
 *   theo → hips → spine → chest → neck → head (+ marcador "nose")
 *                          chest → shoulder_L/R → upperarm_L/R → forearm_L/R → hand_L/R
 *          hips → thigh_L/R → shin_L/R → foot_L/R
 *
 * Uso: node tools/models/build-theo-glb.mjs [--out public/assets/models/theo.glb]
 */
import { Document, NodeIO } from '@gltf-transform/core';
import path from 'node:path';
import fs from 'node:fs';

const outArg = process.argv.indexOf('--out');
const OUT = path.resolve(outArg > 0 ? process.argv[outArg + 1] : 'public/assets/models/theo.glb');

// ------------------------------------------------------------------ esqueleto (posições globais)
const J = {
  hips: [0, 0.8, 0], spine: [0, 0.92, 0], chest: [0, 1.05, 0], neck: [0, 1.23, -0.005], head: [0, 1.3, 0],
  shoulder_L: [0.06, 1.19, -0.01], upperarm_L: [0.175, 1.185, -0.01], forearm_L: [0.2, 0.95, -0.01], hand_L: [0.215, 0.74, 0],
  shoulder_R: [-0.06, 1.19, -0.01], upperarm_R: [-0.175, 1.185, -0.01], forearm_R: [-0.2, 0.95, -0.01], hand_R: [-0.215, 0.74, 0],
  thigh_L: [0.085, 0.79, 0], shin_L: [0.09, 0.45, 0.01], foot_L: [0.092, 0.075, 0],
  thigh_R: [-0.085, 0.79, 0], shin_R: [-0.09, 0.45, 0.01], foot_R: [-0.092, 0.075, 0]
};
const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  shoulder_L: 'chest', upperarm_L: 'shoulder_L', forearm_L: 'upperarm_L', hand_L: 'forearm_L',
  shoulder_R: 'chest', upperarm_R: 'shoulder_R', forearm_R: 'upperarm_R', hand_R: 'forearm_R',
  thigh_L: 'hips', shin_L: 'thigh_L', foot_L: 'shin_L', thigh_R: 'hips', shin_R: 'thigh_R', foot_R: 'shin_R'
};
const JOINTS = Object.keys(J);
const JI = Object.fromEntries(JOINTS.map((n, i) => [n, i]));

// ------------------------------------------------------------------ geometria com pesos
class Part {
  constructor() { this.pos = []; this.idx = []; this.w = []; this.hint = []; }
  /** `n` = normal analítica de reserva (polos de esferas, onde os triângulos degeneram) */
  vert(p, weights, n = [0, 1, 0]) { this.pos.push(p); this.w.push(weights); this.hint.push(n); return this.pos.length - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
}
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/**
 * Loft vertical: estações {c:[x,y,z], rx, rz, w:{joint:peso}, fz?}; anéis com `seg` vértices.
 * `fz` desloca a frente (z+) para dar volume (peito/barriga). Tampas nas pontas.
 */
function loft(part, stations, seg = 14, caps = [true, true]) {
  const rings = [];
  for (const s of stations) {
    const ring = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = Math.sin(a) * s.rx;
      let z = Math.cos(a) * s.rz;
      if (s.fz && z > 0) z *= 1 + s.fz;
      ring.push(part.vert([s.c[0] + x, s.c[1], s.c[2] + z], s.w));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1];
    const down = stations[r + 1].c[1] < stations[r].c[1];
    for (let i = 0; i < seg; i++) {
      const i2 = (i + 1) % seg;
      if (down) { part.tri(A[i], A[i2], B[i]); part.tri(A[i2], B[i2], B[i]); }
      else { part.tri(A[i], B[i], A[i2]); part.tri(A[i2], B[i], B[i2]); }
    }
  }
  const cap = (ring, s, up) => {
    const c = part.vert([s.c[0], s.c[1] + (up ? s.rz * 0.35 : -s.rz * 0.35), s.c[2]], s.w, [0, up ? 1 : -1, 0]);
    for (let i = 0; i < seg; i++) {
      const i2 = (i + 1) % seg;
      up ? part.tri(ring[i], c, ring[i2]) : part.tri(ring[i], ring[i2], c);
    }
  };
  const firstDown = stations.length > 1 && stations[1].c[1] < stations[0].c[1];
  if (caps[0]) cap(rings[0], stations[0], firstDown);
  if (caps[1]) cap(rings[rings.length - 1], stations[stations.length - 1], !firstDown);
}

/** elipsoide rígido (1 osso), `yCut` corta a parte de baixo (cabelo). */
function ellipsoid(part, c, r, joint, seg = 16, ring = 12, yCut = -1.01, squashFront = 0) {
  const w = { [joint]: 1 };
  const base = part.pos.length;
  for (let i = 0; i <= ring; i++) {
    const phi = (i / ring) * Math.PI;
    const y = Math.max(Math.cos(phi), yCut);
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const x = Math.sin(phi) * Math.sin(th);
      let z = Math.sin(phi) * Math.cos(th);
      if (squashFront && z > 0) z *= 1 - squashFront;
      part.vert([c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]], w, [x / r[0], y / r[1], z / r[2]]);
    }
  }
  for (let i = 0; i < ring; i++) for (let s = 0; s < seg; s++) {
    const a = base + i * (seg + 1) + s, b = a + seg + 1;
    part.tri(a, a + 1, b); part.tri(a + 1, b + 1, b);
  }
}

/** caixa arredondada simples (tênis) presa a um osso */
function roundedBox(part, c, size, joint, bevel = 0.35) {
  const [sx, sy, sz] = size.map((v) => v / 2);
  // elipsoide "achatado" com expoente → aparência de caixa arredondada
  const w = { [joint]: 1 };
  const base = part.pos.length, seg = 14, ring = 10;
  const sgnPow = (v, p) => Math.sign(v) * Math.abs(v) ** p;
  const p = bevel;
  for (let i = 0; i <= ring; i++) {
    const phi = (i / ring) * Math.PI;
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const x = sgnPow(Math.sin(phi), p) * sgnPow(Math.sin(th), p);
      const y = sgnPow(Math.cos(phi), p);
      const z = sgnPow(Math.sin(phi), p) * sgnPow(Math.cos(th), p);
      part.vert([c[0] + x * sx, c[1] + y * sy, c[2] + z * sz], w, [x, y, z]);
    }
  }
  for (let i = 0; i < ring; i++) for (let s = 0; s < seg; s++) {
    const a = base + i * (seg + 1) + s, b = a + seg + 1;
    part.tri(a, a + 1, b); part.tri(a + 1, b + 1, b);
  }
}

// ------------------------------------------------------------------ partes do corpo
const parts = { hoodie: new Part(), pants: new Part(), skin: new Part(), hair: new Part(), shoe: new Part(), sole: new Part(), dark: new Part(), white: new Part(), string: new Part() };

// tronco (moletom): quadril → ombros
loft(parts.hoodie, [
  { c: [0, 0.74, 0], rx: 0.155, rz: 0.1, w: { hips: 1 } },
  { c: [0, 0.83, 0], rx: 0.15, rz: 0.098, w: { hips: 0.7, spine: 0.3 } },
  { c: [0, 0.93, 0], rx: 0.148, rz: 0.1, w: { spine: 0.8, hips: 0.2 }, fz: 0.08 },
  { c: [0, 1.03, 0], rx: 0.162, rz: 0.106, w: { spine: 0.4, chest: 0.6 }, fz: 0.06 },
  { c: [0, 1.12, 0], rx: 0.178, rz: 0.108, w: { chest: 1 }, fz: 0.04 },
  { c: [0, 1.19, -0.005], rx: 0.17, rz: 0.1, w: { chest: 1 } },
  { c: [0, 1.225, -0.01], rx: 0.1, rz: 0.075, w: { chest: 0.7, neck: 0.3 } }
], 18);
// capuz (dobrado atrás do pescoço) e bolso canguru
ellipsoid(parts.hoodie, [0, 1.225, -0.075], [0.115, 0.05, 0.06], 'chest', 14, 8);
ellipsoid(parts.hoodie, [0, 0.9, 0.1], [0.1, 0.055, 0.018], 'spine', 12, 6);
// cordões do capuz
loft(parts.string, [
  { c: [0.035, 1.2, 0.098], rx: 0.006, rz: 0.006, w: { chest: 1 } },
  { c: [0.04, 1.08, 0.112], rx: 0.006, rz: 0.006, w: { chest: 1 } }
], 6);
loft(parts.string, [
  { c: [-0.035, 1.2, 0.098], rx: 0.006, rz: 0.006, w: { chest: 1 } },
  { c: [-0.04, 1.08, 0.112], rx: 0.006, rz: 0.006, w: { chest: 1 } }
], 6);

// braços (mangas): ombro → cotovelo → punho, com pesos suaves
for (const side of ['L', 'R']) {
  const sx = side === 'L' ? 1 : -1;
  const U = `upperarm_${side}`, F = `forearm_${side}`, H = `hand_${side}`, S = `shoulder_${side}`;
  const sh = J[U], el = J[F], wr = J[H];
  loft(parts.hoodie, [
    { c: [sh[0] - sx * 0.01, sh[1] + 0.03, sh[2]], rx: 0.05, rz: 0.055, w: { chest: 0.4, [S]: 0.2, [U]: 0.4 } },
    { c: lerp3(sh, el, 0.25), rx: 0.05, rz: 0.052, w: { [U]: 1 } },
    { c: lerp3(sh, el, 0.75), rx: 0.046, rz: 0.047, w: { [U]: 0.9, [F]: 0.1 } },
    { c: el, rx: 0.043, rz: 0.044, w: { [U]: 0.5, [F]: 0.5 } },
    { c: lerp3(el, wr, 0.3), rx: 0.041, rz: 0.042, w: { [F]: 0.95, [U]: 0.05 } },
    { c: lerp3(el, wr, 0.85), rx: 0.038, rz: 0.038, w: { [F]: 1 } },
    { c: [wr[0], wr[1] + 0.01, wr[2]], rx: 0.036, rz: 0.036, w: { [F]: 0.8, [H]: 0.2 } }
  ], 12);
  // mão (palma + polegar)
  ellipsoid(parts.skin, [wr[0] + sx * 0.003, wr[1] - 0.05, wr[2] + 0.005], [0.028, 0.052, 0.033], H, 12, 10);
  ellipsoid(parts.skin, [wr[0] - sx * 0.005, wr[1] - 0.035, wr[2] + 0.03], [0.012, 0.024, 0.012], H, 8, 6);
}

// pelve (calça) e pernas: quadril → joelho → tornozelo
loft(parts.pants, [
  { c: [0, 0.83, 0], rx: 0.148, rz: 0.096, w: { hips: 1 } },
  { c: [0, 0.74, 0], rx: 0.158, rz: 0.1, w: { hips: 1 } },
  { c: [0, 0.69, 0], rx: 0.15, rz: 0.095, w: { hips: 0.8, thigh_L: 0.1, thigh_R: 0.1 } }
], 18, [true, false]);
for (const side of ['L', 'R']) {
  const T = `thigh_${side}`, S = `shin_${side}`, F = `foot_${side}`;
  const hp = J[T], kn = J[S], an = J[F];
  loft(parts.pants, [
    { c: [hp[0], 0.77, hp[2]], rx: 0.075, rz: 0.078, w: { hips: 0.5, [T]: 0.5 } },
    { c: lerp3(hp, kn, 0.2), rx: 0.075, rz: 0.077, w: { [T]: 0.9, hips: 0.1 } },
    { c: lerp3(hp, kn, 0.7), rx: 0.062, rz: 0.064, w: { [T]: 1 } },
    { c: kn, rx: 0.056, rz: 0.058, w: { [T]: 0.5, [S]: 0.5 } },
    { c: lerp3(kn, an, 0.25), rx: 0.055, rz: 0.058, w: { [S]: 0.95, [T]: 0.05 } },
    { c: lerp3(kn, an, 0.75), rx: 0.048, rz: 0.05, w: { [S]: 1 } },
    { c: [an[0], an[1] + 0.035, an[2]], rx: 0.05, rz: 0.05, w: { [S]: 0.7, [F]: 0.3 } }
  ], 14);
  // tênis (cabedal + sola + faixa)
  roundedBox(parts.shoe, [an[0], 0.05, an[2] + 0.045], [0.092, 0.075, 0.23], F, 0.4);
  roundedBox(parts.sole, [an[0], 0.012, an[2] + 0.045], [0.098, 0.026, 0.236], F, 0.3);
}

// pescoço e cabeça (proporção infantil: cabeça grande)
loft(parts.skin, [
  { c: [0, 1.21, -0.005], rx: 0.042, rz: 0.042, w: { chest: 0.5, neck: 0.5 } },
  { c: [0, 1.28, -0.003], rx: 0.04, rz: 0.04, w: { neck: 0.7, head: 0.3 } },
  { c: [0, 1.32, 0], rx: 0.045, rz: 0.045, w: { head: 1 } }
], 12);
ellipsoid(parts.skin, [0, 1.395, 0.005], [0.098, 0.113, 0.104], 'head', 20, 16);
ellipsoid(parts.skin, [0, 1.345, 0.045], [0.07, 0.05, 0.06], 'head', 14, 10); // maxilar/bochechas
ellipsoid(parts.skin, [0.097, 1.39, 0.0], [0.016, 0.028, 0.012], 'head', 8, 6); // orelhas
ellipsoid(parts.skin, [-0.097, 1.39, 0.0], [0.016, 0.028, 0.012], 'head', 8, 6);
ellipsoid(parts.skin, [0, 1.375, 0.105], [0.013, 0.018, 0.016], 'head', 8, 6); // nariz
// olhos (esclera + íris) e sobrancelhas
for (const sx of [1, -1]) {
  ellipsoid(parts.white, [sx * 0.037, 1.41, 0.088], [0.017, 0.013, 0.01], 'head', 10, 8);
  ellipsoid(parts.dark, [sx * 0.037, 1.409, 0.096], [0.008, 0.009, 0.005], 'head', 8, 6);
  ellipsoid(parts.hair, [sx * 0.038, 1.438, 0.092], [0.02, 0.005, 0.008], 'head', 8, 4);
}
ellipsoid(parts.dark, [0, 1.335, 0.098], [0.018, 0.004, 0.005], 'head', 8, 4); // boca
// cabelo cacheado: calota + mechas
ellipsoid(parts.hair, [0, 1.43, -0.005], [0.108, 0.1, 0.113], 'head', 20, 14, -0.1);
const curls = [[0.06, 1.5, 0.05], [-0.05, 1.505, 0.06], [0, 1.515, 0.02], [0.08, 1.47, 0.07], [-0.085, 1.465, 0.06], [0.03, 1.49, 0.085], [-0.025, 1.485, 0.09], [0.095, 1.43, -0.03], [-0.095, 1.43, -0.03], [0, 1.47, -0.1], [0.06, 1.46, -0.09], [-0.06, 1.46, -0.09]];
for (const c of curls) ellipsoid(parts.hair, c, [0.038, 0.034, 0.036], 'head', 10, 8);

// ------------------------------------------------------------------ montagem glTF
const doc = new Document();
doc.getRoot().getAsset().generator = 'O Ultimo Rastro — tools/models/build-theo-glb.mjs (v2, skinned)';
const buffer = doc.createBuffer();
const mat = (name, rgb, rough = 0.85) => doc.createMaterial(name).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(rough).setMetallicFactor(0);
// cores em espaço linear (glTF)
const MATS = {
  hoodie: mat('hoodie', [0.018, 0.05, 0.11]), pants: mat('pants', [0.25, 0.19, 0.12]), skin: mat('skin', [0.72, 0.43, 0.3], 0.7),
  hair: mat('hair', [0.09, 0.035, 0.015], 0.9), shoe: mat('shoe', [0.4, 0.03, 0.02], 0.6), sole: mat('sole', [0.8, 0.8, 0.77], 0.7),
  dark: mat('eye_dark', [0.01, 0.01, 0.012], 0.3), white: mat('eye_white', [0.85, 0.85, 0.82], 0.4), string: mat('drawstring', [0.8, 0.8, 0.78])
};

function computeNormals(pos, idx, hint) {
  const n = new Float32Array(pos.length * 3);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]];
    const ab = [pos[b][0] - pos[a][0], pos[b][1] - pos[a][1], pos[b][2] - pos[a][2]];
    const ac = [pos[c][0] - pos[a][0], pos[c][1] - pos[a][1], pos[c][2] - pos[a][2]];
    const f = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    for (const v of [a, b, c]) { n[v * 3] += f[0]; n[v * 3 + 1] += f[1]; n[v * 3 + 2] += f[2]; }
  }
  for (let v = 0; v < pos.length; v++) {
    let l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]);
    if (l < 1e-9) {
      const h = hint[v];
      n[v * 3] = h[0]; n[v * 3 + 1] = h[1]; n[v * 3 + 2] = h[2];
      l = Math.hypot(h[0], h[1], h[2]) || 1;
    }
    n[v * 3] /= l; n[v * 3 + 1] /= l; n[v * 3 + 2] /= l;
  }
  return n;
}

const mesh = doc.createMesh('theo_body');
let totalVerts = 0;
for (const [key, part] of Object.entries(parts)) {
  if (!part.pos.length) continue;
  const positions = new Float32Array(part.pos.flat());
  const normals = computeNormals(part.pos, part.idx, part.hint);
  const joints = new Uint8Array(part.pos.length * 4);
  const weights = new Float32Array(part.pos.length * 4);
  part.w.forEach((w, v) => {
    const entries = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = entries.reduce((s, e) => s + e[1], 0);
    entries.forEach(([j, val], k) => { joints[v * 4 + k] = JI[j]; weights[v * 4 + k] = val / sum; });
  });
  const acc = (name, type, arr) => doc.createAccessor(`${key}_${name}`).setType(type).setArray(arr).setBuffer(buffer);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('pos', 'VEC3', positions))
    .setAttribute('NORMAL', acc('nor', 'VEC3', normals))
    .setAttribute('JOINTS_0', acc('joints', 'VEC4', joints))
    .setAttribute('WEIGHTS_0', acc('weights', 'VEC4', weights))
    .setIndices(acc('idx', 'SCALAR', part.pos.length > 65535 ? new Uint32Array(part.idx) : new Uint16Array(part.idx)))
    .setMaterial(MATS[key]);
  mesh.addPrimitive(prim);
  totalVerts += part.pos.length;
}

// nós do esqueleto (translações locais)
const nodes = {};
const root = doc.createNode('theo');
for (const name of JOINTS) {
  const p = J[name];
  const parent = PARENT[name];
  const pp = parent ? J[parent] : [0, 0, 0];
  nodes[name] = doc.createNode(name).setTranslation([p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]]);
}
for (const name of JOINTS) (PARENT[name] ? nodes[PARENT[name]] : root).addChild(nodes[name]);
// marcador de frente (usado pelo runtime para alinhar o yaw)
nodes.head.addChild(doc.createNode('nose').setTranslation([0, 0.075, 0.11]));

const ibm = new Float32Array(JOINTS.length * 16);
JOINTS.forEach((name, i) => {
  const [x, y, z] = J[name];
  ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1], i * 16);
});
const skin = doc.createSkin('theo_skin')
  .setSkeleton(nodes.hips)
  .setInverseBindMatrices(doc.createAccessor('ibm').setType('MAT4').setArray(ibm).setBuffer(buffer));
for (const name of JOINTS) skin.addJoint(nodes[name]);

const body = doc.createNode('theo_body').setMesh(mesh).setSkin(skin);
root.addChild(body);
doc.createScene('theo_scene').addChild(root);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await new NodeIO().write(OUT, doc);
console.log(`GLB: ${path.relative(process.cwd(), OUT)} (${fs.statSync(OUT).size} bytes, ${JOINTS.length} ossos, ${totalVerts} vértices, skinned)`);
