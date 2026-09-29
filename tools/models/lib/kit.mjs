/**
 * Kit de geometria com pesos de pele (skinning) para personagens gerados por script (sem Blender).
 * Um único `Part` acumula toda a malha do personagem; cada vértice guarda pesos, "dica" de normal (direção para fora)
 * e uma `tag` (head/hair/body/prop) usada na cor de fundo do vértice (ver art.mjs / humanoid.mjs).
 */

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** gerador pseudoaleatório determinístico */
export function rng(seed = 1337) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export class Part {
  constructor() { this.pos = []; this.idx = []; this.w = []; this.hint = []; this.tag = []; }
  vert(p, weights, n = [0, 1, 0], tag = 'body') { this.pos.push(p); this.w.push(weights); this.hint.push(n); this.tag.push(tag); return this.pos.length - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
}

/**
 * Tubo através de estações {p, r:[ra, rb], w, up?, jag?}. Anéis perpendiculares à tangente; `up` fixa o eixo `rb`.
 * `w` pode ser função `(sx, sz) → pesos`, onde (sx, sz) é a direção horizontal do vértice em relação ao centro (eixos do mundo).
 */
export function tube(part, st, { seg = 12, caps = [true, true], tag = 'body', rand = null } = {}) {
  const rings = [];
  for (let k = 0; k < st.length; k++) {
    const s = st[k];
    const t = norm(sub(st[Math.min(k + 1, st.length - 1)].p, st[Math.max(k - 1, 0)].p));
    const upRef = s.up ?? (Math.abs(t[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1]);
    const side = norm(cross(upRef, t));
    const up = norm(cross(t, side));
    const ring = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const off = add(mul(side, sa * s.r[0]), mul(up, ca * s.r[1]));
      let p = add(s.p, off);
      if (s.jag) p = add(p, mul(t, (i % 2 ? 1 : -0.4) * s.jag * (0.6 + 0.8 * (rand ? rand() : 0.5))));
      const dirH = norm([off[0], 0, off[2]]);
      const w = typeof s.w === 'function' ? s.w(dirH[0], dirH[2]) : s.w;
      ring.push(part.vert(p, w, norm(off), tag));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1];
    for (let i = 0; i < seg; i++) {
      const i2 = (i + 1) % seg;
      part.tri(A[i], B[i], A[i2]); part.tri(A[i2], B[i], B[i2]);
    }
  }
  const cap = (ring, s, dir) => {
    const c = part.vert(add(s.p, mul(dir, Math.min(s.r[0], s.r[1]) * 0.35)), typeof s.w === 'function' ? s.w(0, 1) : s.w, dir, tag);
    for (let i = 0; i < seg; i++) part.tri(ring[i], c, ring[(i + 1) % seg]);
  };
  if (caps[0]) cap(rings[0], st[0], norm(sub(st[0].p, st[1].p)));
  if (caps[1]) cap(rings[rings.length - 1], st[st.length - 1], norm(sub(st[st.length - 1].p, st[st.length - 2].p)));
  return rings;
}

/** Tubo vertical (anéis horizontais): estações {y, c?:[x,z], rx, rz, w, jag?} */
export const vtube = (part, st, opts) => tube(part, st.map((s) => ({ ...s, p: [s.c?.[0] ?? 0, s.y, s.c?.[1] ?? 0], r: [s.rx, s.rz], up: [0, 0, 1] })), opts);

/** Elipsoide (opcionalmente deformado por `shape(x,y,z)` na esfera unitária). */
export function ellipsoid(part, c, r, w, { seg = 14, ring = 10, shape = null, tag = 'body', phiMax = null } = {}) {
  const base = part.pos.length;
  const ww = typeof w === 'string' ? { [w]: 1 } : w;
  for (let i = 0; i <= ring; i++) {
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const pm = phiMax ? phiMax(th) : Math.PI;
      const phi = (i / ring) * pm;
      let q = [Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th)];
      if (shape) q = shape(...q);
      part.vert([c[0] + q[0] * r[0], c[1] + q[1] * r[1], c[2] + q[2] * r[2]], ww, norm([q[0] / r[0], q[1] / r[1], q[2] / r[2]]), tag);
    }
  }
  for (let i = 0; i < ring; i++) for (let s = 0; s < seg; s++) {
    const a = base + i * (seg + 1) + s, b = a + seg + 1;
    part.tri(a, a + 1, b); part.tri(a + 1, b + 1, b);
  }
}

/** caixa arredondada (superelipsoide) */
export function roundedBox(part, c, size, w, { p = 0.35, seg = 14, ring = 10, tag = 'body', rotY = 0 } = {}) {
  const sp = (v, e) => Math.sign(v) * Math.abs(v) ** e;
  const base = part.pos.length;
  ellipsoid(part, c, size.map((v) => v / 2), w, {
    seg, ring, tag,
    shape: (x, y, z) => {
      const phi = Math.acos(Math.max(-1, Math.min(1, y)));
      const th = Math.atan2(x, z);
      return [sp(Math.sin(phi), p) * sp(Math.sin(th), p), sp(Math.cos(phi), p), sp(Math.sin(phi), p) * sp(Math.cos(th), p)];
    }
  });
  if (rotY) {
    const cs = Math.cos(rotY), sn = Math.sin(rotY);
    for (let i = base; i < part.pos.length; i++) {
      const d = sub(part.pos[i], c);
      part.pos[i] = [c[0] + d[0] * cs + d[2] * sn, part.pos[i][1], c[2] - d[0] * sn + d[2] * cs];
      const h = part.hint[i];
      part.hint[i] = [h[0] * cs + h[2] * sn, h[1], -h[0] * sn + h[2] * cs];
    }
  }
}

/** Orienta triângulos pela direção "para fora" e calcula normais suaves. */
export function orientAndNormals(part) {
  const { pos, idx, hint } = part;
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

/** mistura dois dicionários de pesos */
export function blendW(a, b, t) {
  const w = {};
  for (const [k, v] of Object.entries(a)) w[k] = (w[k] ?? 0) + v * (1 - t);
  for (const [k, v] of Object.entries(b)) w[k] = (w[k] ?? 0) + v * t;
  return w;
}
