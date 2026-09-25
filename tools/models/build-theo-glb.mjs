#!/usr/bin/env node
/**
 * Theo v3 — modelo 3D fiel à arte de referência aprovada (referencias/personagens/theo/theo_normal.webp),
 * gerado por script com glTF-Transform (sem Blender). Malha contínua com esqueleto (skinning):
 * casaco longo aberto com lapelas e mangas dobradas, suéter com barra desfiada, camiseta rasgada,
 * bolsa a tiracolo (alça no ombro direito, bolsa no quadril esquerdo), calça escura com remendos nos
 * joelhos e barra dobrada, botas de cano curto com cadarço, cabelo escuro bagunçado.
 * O rosto usa a própria arte (tools/models/textures/theo_face.png) projetada de frente.
 * Proporções medidas na arte: 1231 px de altura → 1,45 m (k = 1,45/1231 m/px).
 *
 * Esqueleto (frente = +Z glTF, pés em y=0; _L = esquerda do personagem = +X):
 *   theo → hips → spine → chest → neck → head (+ marcador "nose")
 *                          chest → shoulder_L/R → upperarm_L/R → forearm_L/R → hand_L/R
 *          hips → thigh_L/R → shin_L/R → foot_L/R
 *
 * Uso: node tools/models/build-theo-glb.mjs [--out public/assets/models/theo.glb]
 * (rode antes tools/art/build-theo-art.mjs se a arte de referência mudar)
 */
import { Document, NodeIO } from '@gltf-transform/core';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';

const outArg = process.argv.indexOf('--out');
const OUT = path.resolve(outArg > 0 ? process.argv[outArg + 1] : 'public/assets/models/theo.glb');
const FACE_PNG = path.resolve('tools/models/textures/theo_face.png');
const FACE_META = JSON.parse(fs.readFileSync(path.resolve('tools/models/textures/theo_face.json'), 'utf8'));

// escala da arte → metros (y do recorte cresce para baixo; pés em 1231 px)
const K = 1.45 / FACE_META.cutoutSize[1];
const py = (p) => (FACE_META.cutoutSize[1] - p) * K;

// ------------------------------------------------------------------ esqueleto (posições globais)
const J = {
  hips: [0, 0.66, 0], spine: [0, 0.78, 0], chest: [0, 0.93, 0], neck: [0, 1.075, -0.005], head: [0, 1.13, 0],
  shoulder_L: [0.045, 1.03, -0.01], upperarm_L: [0.132, 1.015, -0.01], forearm_L: [0.152, 0.83, -0.012], hand_L: [0.162, 0.655, 0],
  shoulder_R: [-0.045, 1.03, -0.01], upperarm_R: [-0.132, 1.015, -0.01], forearm_R: [-0.152, 0.83, -0.012], hand_R: [-0.162, 0.655, 0],
  thigh_L: [0.066, 0.63, 0], shin_L: [0.068, 0.38, 0.008], foot_L: [0.07, 0.085, 0],
  thigh_R: [-0.066, 0.63, 0], shin_R: [-0.068, 0.38, 0.008], foot_R: [-0.07, 0.085, 0]
};
const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  shoulder_L: 'chest', upperarm_L: 'shoulder_L', forearm_L: 'upperarm_L', hand_L: 'forearm_L',
  shoulder_R: 'chest', upperarm_R: 'shoulder_R', forearm_R: 'upperarm_R', hand_R: 'forearm_R',
  thigh_L: 'hips', shin_L: 'thigh_L', foot_L: 'shin_L', thigh_R: 'hips', shin_R: 'thigh_R', foot_R: 'shin_R'
};
const JOINTS = Object.keys(J);
const JI = Object.fromEntries(JOINTS.map((n, i) => [n, i]));

// ------------------------------------------------------------------ utilidades
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
let seed = 1337;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const blendW = (a, b, t) => {
  const w = {};
  for (const [k, v] of Object.entries(a)) w[k] = (w[k] ?? 0) + v * (1 - t);
  for (const [k, v] of Object.entries(b)) w[k] = (w[k] ?? 0) + v * t;
  return w;
};

/** ruído de valor 3D (determinístico) para sujeira/variação de cor */
function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise3(p, f) {
  const x = p[0] * f, y = p[1] * f, z = p[2] * f;
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const s = (t) => t * t * (3 - 2 * t);
  const fx = s(x - xi), fy = s(y - yi), fz = s(z - zi);
  let v = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    v += hash3(xi + dx, yi + dy, zi + dz) * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
  }
  return v;
}

// ------------------------------------------------------------------ geometria com pesos
class Part {
  constructor(opts = {}) { this.pos = []; this.idx = []; this.w = []; this.hint = []; this.opts = opts; }
  /** `n` = direção "para fora" (orienta triângulos e serve de normal nos polos degenerados) */
  vert(p, weights, n = [0, 1, 0]) { this.pos.push(p); this.w.push(weights); this.hint.push(n); return this.pos.length - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
}

/**
 * Tubo genérico ao longo de estações {p, r:[ra, rb], w, up?, gap?, jag?}.
 * Anéis perpendiculares à tangente; `up` fixa o eixo `rb` (ex.: normal do corpo para alças achatadas).
 * `gap` (rad) abre o anel na frente (+Z local do anel) — casaco aberto. `jag` serrilha o anel (barra desfiada).
 */
function tube(part, st, seg = 12, caps = [true, true]) {
  const open = st.some((s) => s.gap);
  const n = open ? seg + 1 : seg;
  const rings = [];
  for (let k = 0; k < st.length; k++) {
    const s = st[k];
    const t = norm(sub(st[Math.min(k + 1, st.length - 1)].p, st[Math.max(k - 1, 0)].p));
    let upRef = s.up ?? (Math.abs(t[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1]);
    const side = norm(cross(upRef, t));
    const up = norm(cross(t, side));
    const ring = [];
    for (let i = 0; i < n; i++) {
      const g = s.gap ?? 0;
      const a = open ? g + (i / seg) * (Math.PI * 2 - 2 * g) : (i / seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const ra = s.r[0], rb = s.r[1];
      const off = add(mul(side, sa * ra), mul(up, ca * rb));
      let p = add(s.p, off);
      if (s.jag) p = add(p, mul(t, (i % 2 ? 1 : -0.4) * s.jag * (0.6 + 0.8 * hash3(i, k, 7))));
      // pesos por ângulo recebem o seno no eixo X do mundo (+X = esquerda do personagem)
      const w = typeof s.w === 'function' ? s.w(a, sa * side[0], ca) : s.w;
      ring.push(part.vert(p, w, norm(add(mul(side, sa / (ra || 1)), mul(up, ca / (rb || 1))))));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1];
    for (let i = 0; i < (open ? n - 1 : n); i++) {
      const i2 = (i + 1) % n;
      part.tri(A[i], B[i], A[i2]); part.tri(A[i2], B[i], B[i2]);
    }
  }
  if (!open) {
    const cap = (ring, s, dir) => {
      const c = part.vert(add(s.p, mul(dir, Math.min(s.r[0], s.r[1]) * 0.3)), typeof s.w === 'function' ? s.w(0, 0, 1) : s.w, dir);
      for (let i = 0; i < n; i++) part.tri(ring[i], c, ring[(i + 1) % n]);
    };
    if (caps[0]) cap(rings[0], st[0], norm(sub(st[0].p, st[1].p)));
    if (caps[1]) cap(rings[rings.length - 1], st[st.length - 1], norm(sub(st[st.length - 1].p, st[st.length - 2].p)));
  }
  return rings;
}

/** Tubo vertical (anéis horizontais) — tronco, pernas: estações {y, c?:[x,z], rx, rz, ...} */
const vtube = (part, st, seg, caps) => tube(part, st.map((s) => ({ ...s, p: [s.c?.[0] ?? 0, s.y, s.c?.[1] ?? 0], r: [s.rx, s.rz], up: [0, 0, 1] })), seg, caps);

/** elipsoide deformável preso a pesos fixos; `shape(x,y,z)` → [x,y,z] na esfera unitária antes da escala */
function ellipsoid(part, c, r, w, seg = 14, ring = 10, shape = null, phiMax = null) {
  const base = part.pos.length;
  const ww = typeof w === 'string' ? { [w]: 1 } : w;
  for (let i = 0; i <= ring; i++) {
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const pm = phiMax ? phiMax(th) : Math.PI;
      const phi = (i / ring) * pm;
      let q = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)];
      if (shape) q = shape(...q);
      part.vert([c[0] + q[0] * r[0], c[1] + q[1] * r[1], c[2] + q[2] * r[2]], ww, norm([q[0] / r[0], q[1] / r[1], q[2] / r[2]]));
    }
  }
  for (let i = 0; i < ring; i++) for (let s = 0; s < seg; s++) {
    const a = base + i * (seg + 1) + s, b = a + seg + 1;
    part.tri(a, a + 1, b); part.tri(a + 1, b + 1, b);
  }
  return base;
}
/** "caixa arredondada" = superelipsoide */
function roundedBox(part, c, size, w, p = 0.35, seg = 14, ring = 10) {
  const sp = (v, e) => Math.sign(v) * Math.abs(v) ** e;
  return ellipsoid(part, c, size.map((v) => v / 2), w, seg, ring, (x, y, z) => {
    const phi = Math.acos(Math.max(-1, Math.min(1, y)));
    const th = Math.atan2(x, z);
    return [sp(Math.sin(phi), p) * sp(Math.sin(th), p), sp(Math.cos(phi), p), sp(Math.sin(phi), p) * sp(Math.cos(th), p)];
  });
}

// ------------------------------------------------------------------ paleta (sRGB medida na arte) e partes
const srgb = (r, g, b) => [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
const GRIME = [1.0, 0.8, 0.58]; // tinta multiplicativa (marrom) da sujeira
const P = (color, o = {}) => new Part({ color, ...o });
const parts = {
  coat: P(srgb(50, 62, 74), { dirt: 0.55, dirtLow: 0.62, doubleSided: true }),
  coatDark: P(srgb(36, 45, 54), { dirt: 0.3 }),
  sweater: P(srgb(62, 60, 54), { dirt: 0.2 }),
  knit: P(srgb(92, 80, 70), { dirt: 0.2 }),
  shirt: P(srgb(84, 94, 98), { dirt: 0.25 }),
  pants: P(srgb(40, 45, 54), { dirt: 0.45, dirtLow: 0.5 }),
  patch: P(srgb(46, 50, 56), { dirt: 0.35 }),
  sock: P(srgb(52, 56, 58)),
  boot: P(srgb(70, 64, 56), { dirt: 0.5 }),
  sole: P(srgb(30, 28, 26)),
  lace: P(srgb(28, 28, 28)),
  bag: P(srgb(92, 82, 64), { dirt: 0.4 }),
  strap: P(srgb(58, 50, 40), { dirt: 0.2 }),
  button: P(srgb(22, 24, 26)),
  skin: P(srgb(...FACE_META.skinSRGB.map((v) => v * 0.78))),
  face: P([1, 1, 1], { textured: true }),
  hair: P(srgb(48, 40, 36), { vary: 0.45 })
};

// ------------------------------------------------------------------ tronco: suéter, camiseta, gola, pescoço
vtube(parts.sweater, [
  { y: 0.705, rx: 0.112, rz: 0.078, w: { hips: 1 }, jag: 0.012 },
  { y: 0.78, rx: 0.108, rz: 0.075, w: { spine: 0.8, hips: 0.2 } },
  { y: 0.9, rx: 0.113, rz: 0.078, w: { spine: 0.5, chest: 0.5 } },
  { y: 1.0, rx: 0.122, rz: 0.081, w: { chest: 1 } },
  { y: 1.05, rx: 0.1, rz: 0.07, w: { chest: 1 } },
  { y: 1.075, rx: 0.052, rz: 0.048, w: { chest: 0.6, neck: 0.4 } }
], 18, [false, true]);
// camiseta rasgada aparecendo sob o suéter
vtube(parts.shirt, [
  { y: 0.725, rx: 0.106, rz: 0.074, w: { hips: 1 } },
  { y: 0.68, rx: 0.109, rz: 0.076, w: { hips: 1 }, jag: 0.012 }
], 18, [false, false]);
// gola canelada (cinza) e pescoço fino
vtube(parts.shirt, [
  { y: 1.058, rx: 0.058, rz: 0.054, w: { chest: 1 } },
  { y: 1.1, rx: 0.04, rz: 0.039, w: { chest: 0.4, neck: 0.6 } }
], 14, [false, false]);
vtube(parts.skin, [
  { y: 1.06, rx: 0.03, rz: 0.03, w: { chest: 0.4, neck: 0.6 } },
  { y: 1.12, rx: 0.028, rz: 0.029, w: { neck: 0.6, head: 0.4 } },
  { y: 1.17, rx: 0.034, rz: 0.034, w: { head: 1 } }
], 12);

// ------------------------------------------------------------------ casaco longo, aberto na frente
/** pesos da saia do casaco: acompanha a coxa do mesmo lado, mais forte perto da barra */
const skirt = (t) => (a, sa) => {
  const wL = t * clamp01(0.5 + sa * 1.5), wR = t * clamp01(0.5 - sa * 1.5);
  return { hips: 1 - wL - wR, thigh_L: wL, thigh_R: wR };
};
const COAT = [
  { y: 0.5, rx: 0.152, rz: 0.108, gap: 0.295, w: skirt(0.55) },
  { y: 0.56, rx: 0.146, rz: 0.104, gap: 0.295, w: skirt(0.42) },
  { y: 0.64, rx: 0.139, rz: 0.099, gap: 0.303, w: skirt(0.2) },
  { y: 0.72, rx: 0.132, rz: 0.094, gap: 0.328, w: { hips: 1 } },
  { y: 0.8, rx: 0.129, rz: 0.092, gap: 0.361, w: { hips: 0.55, spine: 0.45 } },
  { y: 0.9, rx: 0.133, rz: 0.093, gap: 0.41, w: { spine: 0.5, chest: 0.5 } },
  { y: 0.98, rx: 0.139, rz: 0.095, gap: 0.459, w: { chest: 1 } },
  { y: 1.03, rx: 0.14, rz: 0.091, gap: 0.508, w: { chest: 1 } },
  { y: 1.062, rx: 0.095, rz: 0.074, gap: 0.59, w: { chest: 1 } },
  { y: 1.105, rx: 0.07, rz: 0.066, gap: 0.656, w: { chest: 0.55, neck: 0.45 } }
];
vtube(parts.coat, COAT, 28);
// lapelas: abas triangulares dobradas para fora ao longo da abertura (peito)
for (const side of [1, -1]) {
  const L = [];
  const pts = [[0.8, 0.0], [0.86, 0.016], [0.92, 0.03], [0.98, 0.045], [1.03, 0.05], [1.06, 0.035]];
  for (const [y, wd] of pts) {
    const s = COAT.reduce((best, c) => (Math.abs(c.y - y) < Math.abs(best.y - y) ? c : best));
    const g = s.gap;
    const edge = [side * Math.sin(g) * s.rx, y, Math.cos(g) * s.rz + 0.004];
    const ga = g + wd / s.rx;
    const outer = [side * Math.sin(ga) * (s.rx + 0.005), y - wd * 0.25, Math.cos(ga) * (s.rz + 0.005) + 0.004];
    const w = y < 0.86 ? { spine: 0.5, chest: 0.5 } : { chest: 1 };
    L.push([parts.coatDark.vert(edge, w, [side * 0.3, 0.2, 1]), parts.coatDark.vert(outer, w, [side * 0.5, 0.2, 1])]);
  }
  for (let i = 0; i < L.length - 1; i++) {
    parts.coatDark.tri(L[i][0], L[i + 1][0], L[i][1]);
    parts.coatDark.tri(L[i][1], L[i + 1][0], L[i + 1][1]);
    // verso (a aba é fina, visível dos dois lados)
    parts.coatDark.tri(L[i][0], L[i][1], L[i + 1][0]);
    parts.coatDark.tri(L[i][1], L[i + 1][1], L[i + 1][0]);
  }
}
parts.coatDark.opts.doubleSided = true;
// botões no painel direito (esquerda da imagem)
for (const y of [0.6, 0.7, 0.8]) {
  const s = COAT.reduce((best, c) => (Math.abs(c.y - y) < Math.abs(best.y - y) ? c : best));
  const a = -(s.gap + 0.16);
  ellipsoid(parts.button, [Math.sin(a) * s.rx, y, Math.cos(a) * s.rz + 0.002], [0.009, 0.009, 0.004], y < 0.68 ? { hips: 1 } : { hips: 0.5, spine: 0.5 }, 8, 6);
}
// barra desfiada do casaco (faixa levemente mais escura)
vtube(parts.coatDark, [
  { y: 0.515, rx: 0.1535, rz: 0.1095, gap: 0.295, w: skirt(0.52) },
  { y: 0.498, rx: 0.1535, rz: 0.1095, gap: 0.295, w: skirt(0.55), jag: 0.008 }
], 28);

// ------------------------------------------------------------------ braços: mangas largas, punho dobrado, mãos
for (const side of ['L', 'R']) {
  const sx = side === 'L' ? 1 : -1;
  const U = `upperarm_${side}`, F = `forearm_${side}`, H = `hand_${side}`, S = `shoulder_${side}`;
  const sh = J[U], el = J[F], wr = J[H];
  tube(parts.coat, [
    { p: [sh[0] - sx * 0.012, sh[1] + 0.028, sh[2]], r: [0.058, 0.06], w: { chest: 0.45, [S]: 0.2, [U]: 0.35 } },
    { p: lerp3(sh, el, 0.2), r: [0.056, 0.058], w: { [U]: 0.95, chest: 0.05 } },
    { p: lerp3(sh, el, 0.75), r: [0.052, 0.054], w: { [U]: 0.9, [F]: 0.1 } },
    { p: el, r: [0.051, 0.053], w: { [U]: 0.5, [F]: 0.5 } },
    { p: lerp3(el, wr, 0.3), r: [0.05, 0.052], w: { [F]: 0.95, [U]: 0.05 } },
    { p: lerp3(el, wr, 0.62), r: [0.05, 0.052], w: { [F]: 1 } }
  ], 14, [true, false]);
  // punho dobrado (mais largo, com borda desfiada)
  tube(parts.coatDark, [
    { p: lerp3(el, wr, 0.6), r: [0.058, 0.06], w: { [F]: 1 } },
    { p: lerp3(el, wr, 0.93), r: [0.06, 0.062], w: { [F]: 0.9, [H]: 0.1 }, jag: 0.006 }
  ], 14, [false, false]);
  // punho de tricô do suéter aparecendo e fundo da manga
  tube(parts.knit, [
    { p: lerp3(el, wr, 0.8), r: [0.04, 0.041], w: { [F]: 1 } },
    { p: [wr[0], wr[1] - 0.005, wr[2]], r: [0.036, 0.037], w: { [F]: 0.6, [H]: 0.4 }, jag: 0.005 }
  ], 12, [true, false]);
  // remendo no cotovelo esquerdo (lado de fora)
  if (side === 'L') {
    const pe = add(lerp3(sh, el, 0.85), [0.047, 0, -0.012]);
    ellipsoid(parts.patch, pe, [0.012, 0.045, 0.032], { [U]: 0.6, [F]: 0.4 }, 10, 8);
  }
  // mão: palma virada para a coxa, dedos levemente curvados, polegar à frente
  const hc = [wr[0] + sx * 0.002, wr[1] - 0.045, wr[2] + 0.004];
  ellipsoid(parts.skin, hc, [0.018, 0.042, 0.03], H, 12, 10);
  ellipsoid(parts.skin, [hc[0] - sx * 0.002, hc[1] - 0.042, hc[2] + 0.008], [0.015, 0.03, 0.026], H, 10, 8);
  tube(parts.skin, [
    { p: [hc[0] - sx * 0.006, hc[1] + 0.02, hc[2] + 0.022], r: [0.0095, 0.0095], w: { [H]: 1 } },
    { p: [hc[0] - sx * 0.01, hc[1] - 0.012, hc[2] + 0.036], r: [0.008, 0.008], w: { [H]: 1 } }
  ], 8);
}

// ------------------------------------------------------------------ calça, remendos, meias, botas
vtube(parts.pants, [
  { y: 0.74, rx: 0.112, rz: 0.08, w: { hips: 1 } },
  { y: 0.66, rx: 0.122, rz: 0.084, w: { hips: 1 } },
  { y: 0.6, rx: 0.118, rz: 0.08, w: { hips: 0.8, thigh_L: 0.1, thigh_R: 0.1 } }
], 18, [true, false]);
for (const side of ['L', 'R']) {
  const sx = side === 'L' ? 1 : -1;
  const T = `thigh_${side}`, S = `shin_${side}`, F = `foot_${side}`;
  const hp = J[T], kn = J[S], an = J[F];
  const leg = (t, a, b) => lerp3(a, b, t);
  tube(parts.pants, [
    { p: [hp[0], 0.66, hp[2]], r: [0.066, 0.068], w: { hips: 0.55, [T]: 0.45 } },
    { p: leg(0.15, hp, kn), r: [0.064, 0.066], w: { [T]: 0.9, hips: 0.1 } },
    { p: leg(0.7, hp, kn), r: [0.056, 0.058], w: { [T]: 1 } },
    { p: kn, r: [0.053, 0.055], w: { [T]: 0.5, [S]: 0.5 } },
    { p: leg(0.25, kn, an), r: [0.052, 0.054], w: { [S]: 0.95, [T]: 0.05 } },
    { p: leg(0.55, kn, an), r: [0.05, 0.052], w: { [S]: 1 } },
    { p: [an[0], 0.27, an[2]], r: [0.052, 0.053], w: { [S]: 1 } }
  ], 14, [false, false]);
  // barra dobrada
  tube(parts.pants, [
    { p: [an[0], 0.285, an[2]], r: [0.057, 0.058], w: { [S]: 1 } },
    { p: [an[0], 0.232, an[2]], r: [0.059, 0.06], w: { [S]: 0.9, [F]: 0.1 } }
  ], 14);
  // remendos nos joelhos (o direito maior, como na arte)
  const kz = kn[2] + 0.05;
  if (side === 'R') ellipsoid(parts.patch, [kn[0] + 0.004, kn[1] - 0.01, kz], [0.032, 0.042, 0.005], { [T]: 0.5, [S]: 0.5 }, 12, 8);
  else roundedBox(parts.patch, [kn[0] - 0.004, kn[1] + 0.005, kz], [0.05, 0.056, 0.007], { [T]: 0.5, [S]: 0.5 }, 0.3);
  // meia
  tube(parts.sock, [
    { p: [an[0], 0.245, an[2]], r: [0.036, 0.037], w: { [S]: 1 } },
    { p: [an[0], 0.2, an[2]], r: [0.035, 0.036], w: { [S]: 0.7, [F]: 0.3 } }
  ], 12, [false, false]);
  // bota: cano, pé com biqueira larga, sola grossa, cadarço
  tube(parts.boot, [
    { p: [an[0], 0.215, an[2] + 0.003], r: [0.049, 0.052], w: { [S]: 0.6, [F]: 0.4 } },
    { p: [an[0], 0.15, an[2] + 0.005], r: [0.05, 0.055], w: { [F]: 0.8, [S]: 0.2 } },
    { p: [an[0], 0.07, an[2] + 0.004], r: [0.052, 0.058], w: { [F]: 1 } }
  ], 14, [false, true]);
  roundedBox(parts.boot, [an[0] + sx * 0.002, 0.052, an[2] + 0.05], [0.104, 0.085, 0.205], F, 0.42);
  ellipsoid(parts.boot, [an[0] + sx * 0.002, 0.048, an[2] + 0.118], [0.052, 0.042, 0.05], F, 12, 8);
  roundedBox(parts.sole, [an[0] + sx * 0.002, 0.013, an[2] + 0.052], [0.112, 0.026, 0.222], F, 0.28);
  for (let i = 0; i < 5; i++) {
    const y = 0.085 + i * 0.03;
    const z = an[2] + (y < 0.1 ? 0.075 : 0.056);
    const w = y > 0.17 ? { [F]: 0.6, [S]: 0.4 } : { [F]: 1 };
    tube(parts.lace, [
      { p: [an[0] - 0.024, y, z - 0.004], r: [0.004, 0.004], w },
      { p: [an[0], y + 0.004, z + 0.002], r: [0.004, 0.004], w },
      { p: [an[0] + 0.024, y, z - 0.004], r: [0.004, 0.004], w }
    ], 6);
  }
}

// ------------------------------------------------------------------ bolsa a tiracolo
roundedBox(parts.bag, [0.172, 0.6, 0.035], [0.07, 0.15, 0.19], { hips: 1 }, 0.3);
roundedBox(parts.bag, [0.21, 0.635, 0.035], [0.012, 0.095, 0.192], { hips: 1 }, 0.25); // aba
/** superfície do casaco numa altura (interpolação das estações) */
const coatAt = (y) => {
  const i = Math.max(0, COAT.findIndex((c) => c.y >= y) - 1);
  const a = COAT[i], b = COAT[Math.min(i + 1, COAT.length - 1)];
  const t = b.y === a.y ? 0 : clamp01((y - a.y) / (b.y - a.y));
  return { rx: lerp(a.rx, b.rx, t), rz: lerp(a.rz, b.rz, t) };
};
const onCoat = (x, y, front, lift = 0.008) => {
  const { rx, rz } = coatAt(y);
  const z = rz * Math.sqrt(Math.max(0.04, 1 - (x / rx) ** 2)) + lift;
  return [x, y, front ? z : -z];
};
const strapW = (y) => (y < 0.72 ? { hips: 1 } : y < 0.84 ? { hips: 0.4, spine: 0.6 } : y < 0.95 ? { spine: 0.4, chest: 0.6 } : { chest: 1 });
const strapPath = [
  onCoat(0.15, 0.675, true, 0.02), onCoat(0.11, 0.75, true), onCoat(0.05, 0.83, true), onCoat(-0.01, 0.9, true),
  onCoat(-0.06, 0.97, true), onCoat(-0.09, 1.02, true, 0.006), [-0.1, 1.07, 0.0], onCoat(-0.08, 1.0, false),
  onCoat(-0.02, 0.9, false), onCoat(0.06, 0.8, false), onCoat(0.12, 0.72, false), [0.17, 0.675, -0.06]
];
tube(parts.strap, strapPath.map((p) => ({
  p, r: [0.012, 0.0032], w: strapW(p[1]),
  // eixo fino = normal do corpo (aponta do eixo central para fora)
  up: norm([p[0] * 0.6, p[1] > 1.03 ? 1 : 0, p[2]])
})), 6, [false, false]);

// ------------------------------------------------------------------ cabeça (rosto = arte projetada)
const HEAD = { c: [0, py(185), 0.006], r: [0.086, 0.122, 0.1] }; // centro ≈ entre os olhos, um pouco acima
const headShape = (x, y, z) => {
  // queixo mais fino e bochechas levemente cheias, como na arte
  const below = Math.max(0, -y);
  const taper = 1 - 0.34 * below ** 1.4;
  const cheek = 1 + 0.06 * Math.exp(-((y + 0.35) ** 2) / 0.05) * Math.max(0, z);
  return [x * taper * cheek, y, z * (1 - 0.12 * below ** 2) * (z > 0 ? 1.02 : 1)];
};
ellipsoid(parts.face, HEAD.c, HEAD.r, 'head', 28, 22, headShape);
// nariz (mesma projeção da textura)
ellipsoid(parts.face, [(145 - FACE_META.window.cx) * K, py(211), HEAD.c[2] + 0.094], [0.011, 0.016, 0.012], 'head', 10, 8);
// orelhas
for (const sx of [1, -1]) ellipsoid(parts.skin, [sx * 0.079, py(220), HEAD.c[2] - 0.012], [0.009, 0.022, 0.016], 'head', 10, 8);

// cabelo: calota que desce mais atrás/lados do que na frente + mechas pontudas bagunçadas
const HC = [HEAD.c[0], HEAD.c[1] + 0.004, HEAD.c[2] - 0.006];
const HR = [0.096, 0.136, 0.11];
ellipsoid(parts.hair, HC, HR, 'head', 26, 14, null, (th) => {
  const front = (Math.cos(th) + 1) / 2; // 1 na frente, 0 atrás
  return lerp(2.45, 1.02, front ** 1.5);
});
const onCap = (th, phi, lift = 0) => {
  const q = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)];
  return [add(HC, [q[0] * (HR[0] + lift), q[1] * (HR[1] + lift), q[2] * (HR[2] + lift)]), norm([q[0] / HR[0], q[1] / HR[1], q[2] / HR[2]])];
};
/** mecha achatada (largura × espessura), deitada sobre a superfície `n`, ponta afinando */
function tuft(base, dir, len, wide, n, droop = 0.35, thick = 0.009, seg = 8) {
  const d = norm(dir);
  const pts = [0, 0.3, 0.62, 1].map((t) => add(add(base, mul(d, len * t)), [0, -droop * len * t * t, 0]));
  const taper = [1, 0.85, 0.55, 0.08];
  tube(parts.hair, pts.map((p, i) => ({ p, r: [wide * taper[i], thick * (0.5 + taper[i] * 0.5)], w: { head: 1 }, up: n })), seg, [false, true]);
}
/** tangente da calota apontando para a direção desejada (mecha acompanha a cabeça) */
const flow = (n, want, lift = 0.35) => norm(add(mul(n, lift), sub(want, mul(n, dot(want, n)))));
// camada principal: mechas grandes que escorrem da coroa para frente/lados/trás, bagunçadas
const CROWN = [-0.02, 0, -0.35]; // redemoinho (atrás do topo)
for (let i = 0; i < 40; i++) {
  const th = Math.PI * 2 * rnd();
  const front = (Math.cos(th) + 1) / 2;
  const phi = 0.12 + rnd() * (front > 0.75 ? 0.75 : 1.5);
  const [b, n] = onCap(th, phi, -0.004);
  const away = norm(sub([Math.sin(th) * Math.sin(phi), Math.cos(phi) - 0.2, Math.cos(th) * Math.sin(phi)], CROWN));
  const want = add(away, [(rnd() - 0.5) * 0.9, -0.3, (rnd() - 0.5) * 0.5]);
  tuft(b, flow(n, want, 0.3 + rnd() * 0.25), 0.06 + rnd() * 0.05, 0.03 + rnd() * 0.018, n, 0.45, 0.009, 6);
}
// pontas espetadas (o cabelo da arte é despenteado)
for (let i = 0; i < 8; i++) {
  const [b, n] = onCap(rnd() * Math.PI * 2, 0.2 + rnd() * 0.8, -0.004);
  tuft(b, add(mul(n, 1.1), [(rnd() - 0.5) * 0.8, 0.2, (rnd() - 0.5) * 0.8]), 0.03 + rnd() * 0.03, 0.02, n, 0.3, 0.007, 6);
}
// fios soltos no topo
for (let i = 0; i < 5; i++) {
  const [b, n] = onCap(rnd() * Math.PI * 2, rnd() * 0.45, -0.006);
  tuft(b, add(n, [(rnd() - 0.5) * 1.4, 0.5, (rnd() - 0.5) * 0.8]), 0.07 + rnd() * 0.04, 0.008, n, 0.9, 0.004, 5);
}
// franja: mechas caindo sobre a testa até as sobrancelhas (mais cheia à direita da imagem, como na arte)
const browY = py(150);
for (let i = 0; i < 11; i++) {
  const x = -0.075 + (i / 10) * 0.15 + (rnd() - 0.5) * 0.012;
  const base = [x * 0.9, HC[1] + 0.09, HC[2] + 0.07 - Math.abs(x) * 0.2];
  const tip = [x * 1.2 + 0.012 + (rnd() - 0.5) * 0.02, browY + 0.006 + rnd() * 0.026 + Math.abs(x) * 0.13, HEAD.c[2] + 0.112 - Math.abs(x) * 0.32];
  tuft(base, sub(tip, base), Math.hypot(...sub(tip, base)), 0.026 + rnd() * 0.01, norm([x * 3, 0.4, 1]), 0.0, 0.008);
}
// lados e nuca: mechas descendo por cima das orelhas
for (let i = 0; i < 20; i++) {
  const th = (i % 2 ? 1 : -1) * (Math.PI * 0.33 + rnd() * Math.PI * 0.62);
  const [b, n] = onCap(th, 1.2 + rnd() * 0.55, -0.004);
  tuft(b, flow(n, [0, -1, -0.15], 0.25), 0.05 + rnd() * 0.035, 0.028, n, 0.1, 0.009, 6);
}

// ------------------------------------------------------------------ montagem glTF
const doc = new Document();
doc.getRoot().getAsset().generator = 'O Ultimo Rastro — tools/models/build-theo-glb.mjs (v3, skinned, arte de referência)';
const buffer = doc.createBuffer();
// JPEG embutido (rosto não tem transparência): ~4× menor que o PNG-fonte
const faceJpg = await sharp(FACE_PNG).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer();
const faceTex = doc.createTexture('theo_face').setImage(faceJpg).setMimeType('image/jpeg').setURI('theo_face.jpg');

function orientAndNormals(part) {
  const { pos, idx, hint } = part;
  // orienta cada triângulo pela direção "para fora" dos vértices (independe da ordem de construção)
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]];
    const f = cross(sub(pos[b], pos[a]), sub(pos[c], pos[a]));
    const h = add(add(hint[a], hint[b]), hint[c]);
    if (dot(f, h) < 0) { idx[i + 1] = c; idx[i + 2] = b; }
  }
  const n = new Float32Array(pos.length * 3);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]];
    const f = cross(sub(pos[b], pos[a]), sub(pos[c], pos[a]));
    for (const v of [a, b, c]) { n[v * 3] += f[0]; n[v * 3 + 1] += f[1]; n[v * 3 + 2] += f[2]; }
  }
  for (let v = 0; v < pos.length; v++) {
    let l = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]);
    if (l < 1e-12) { [n[v * 3], n[v * 3 + 1], n[v * 3 + 2]] = hint[v]; l = Math.hypot(...hint[v]) || 1; }
    n[v * 3] /= l; n[v * 3 + 1] /= l; n[v * 3 + 2] /= l;
  }
  return n;
}

/** cor por vértice: sujeira marrom (ruído + mais perto das barras) e variação de tom */
function vertexColors(part) {
  const o = part.opts;
  const col = new Uint8Array(part.pos.length * 4);
  part.pos.forEach((p, v) => {
    let c = [1, 1, 1];
    if (o.dirt) {
      const n = noise3(p, 22) * 0.65 + noise3(p, 55) * 0.35;
      let d = clamp01((n - 0.42) * 2.4) * o.dirt;
      if (o.dirtLow) d = Math.max(d, clamp01((0.62 - p[1]) * 4) * o.dirtLow * (0.5 + n * 0.8));
      d = clamp01(d);
      c = [lerp(1, GRIME[0], d), lerp(1, GRIME[1], d), lerp(1, GRIME[2], d)];
      const shade = 1 - 0.14 * noise3(p, 90);
      c = mul(c, shade);
    }
    if (o.vary) {
      const s = 1 - o.vary * noise3(p, 60);
      c = mul(c, s);
    }
    col.set([c[0], c[1], c[2], 1].map((x) => Math.round(clamp01(x) * 255)), v * 4);
  });
  return col;
}

/** projeção frontal da arte do rosto (UV 0..1, origem no topo à esquerda) */
function faceUVs(part) {
  const S = FACE_META.window.half * 2 * K;
  const cx = 0, cy = py(FACE_META.window.cy);
  const uv = new Float32Array(part.pos.length * 2);
  part.pos.forEach((p, v) => {
    let u = 0.5 + (p[0] - cx) / S;
    let w = 0.5 - (p[1] - cy) / S;
    if (p[2] < HEAD.c[2] - 0.01) u = 0.5 + Math.sign(p[0] || 1) * 0.5; // lados/nuca → borda (só pele)
    uv.set([Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, w))], v * 2);
  });
  return uv;
}

const mesh = doc.createMesh('theo_body');
let totalVerts = 0;
for (const [key, part] of Object.entries(parts)) {
  if (!part.pos.length) continue;
  const normals = orientAndNormals(part);
  const positions = new Float32Array(part.pos.flat());
  const joints = new Uint8Array(part.pos.length * 4);
  const weights = new Float32Array(part.pos.length * 4);
  part.w.forEach((w, v) => {
    const entries = Object.entries(w).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = entries.reduce((s, e) => s + e[1], 0);
    entries.forEach(([j, val], k) => { joints[v * 4 + k] = JI[j]; weights[v * 4 + k] = val / sum; });
  });
  const acc = (name, type, arr) => doc.createAccessor(`${key}_${name}`).setType(type).setArray(arr).setBuffer(buffer);
  const material = doc.createMaterial(key).setBaseColorFactor([...part.opts.color, 1]).setRoughnessFactor(0.9).setMetallicFactor(0);
  if (part.opts.doubleSided) material.setDoubleSided(true);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('pos', 'VEC3', positions))
    .setAttribute('NORMAL', acc('nor', 'VEC3', normals))
    .setAttribute('JOINTS_0', acc('joints', 'VEC4', joints))
    .setAttribute('WEIGHTS_0', acc('weights', 'VEC4', weights))
    .setIndices(acc('idx', 'SCALAR', part.pos.length > 65535 ? new Uint32Array(part.idx) : new Uint16Array(part.idx)))
    .setMaterial(material);
  if (part.opts.textured) {
    prim.setAttribute('TEXCOORD_0', acc('uv', 'VEC2', faceUVs(part)));
    material.setBaseColorTexture(faceTex);
  } else {
    prim.setAttribute('COLOR_0', acc('color', 'VEC4', vertexColors(part)).setNormalized(true));
  }
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
nodes.head.addChild(doc.createNode('nose').setTranslation([0, py(211) - J.head[1], 0.11]));

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
console.log(`GLB: ${path.relative(process.cwd(), OUT)} (${fs.statSync(OUT).size} bytes, ${JOINTS.length} ossos, ${totalVerts} vértices, skinned, rosto texturizado)`);
