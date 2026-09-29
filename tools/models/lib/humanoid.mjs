/**
 * Construtor de personagem humanoide/criatura bípede dirigido pela arte de referência.
 *
 * Entrada: `spec` com pontos-chave em pixels da arte original (cabeça, ombros, cotovelos, punhos, quadris, joelhos, tornozelos),
 * meias-larguras em pixels e a altura real em metros. A malha é montada em metros (frente = +Z, +X = esquerda do personagem =
 * direita da imagem, pés em y = 0) com o MESMO esqueleto de 19 ossos para todos (animações compartilháveis).
 *
 * Fidelidade visual: cada vértice recebe UV de projeção frontal da própria arte (u = x/W, v = y/H) + cor "chapada" amostrada
 * da arte (RGB) e peso de frente (A) em COLOR_0. O material do Godot mistura arte (frente) e cor chapada (laterais/costas).
 */
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import * as K from './kit.mjs';
import { loadArt, sampleBlur, averageRegion, textureJpeg } from './art.mjs';

export const J_NAMES = ['hips', 'spine', 'chest', 'neck', 'head', 'shoulder_L', 'upperarm_L', 'forearm_L', 'hand_L', 'shoulder_R', 'upperarm_R', 'forearm_R', 'hand_R', 'thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R'];
export const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  shoulder_L: 'chest', upperarm_L: 'shoulder_L', forearm_L: 'upperarm_L', hand_L: 'forearm_L',
  shoulder_R: 'chest', upperarm_R: 'shoulder_R', forearm_R: 'upperarm_R', hand_R: 'forearm_R',
  thigh_L: 'hips', shin_L: 'thigh_L', foot_L: 'shin_L', thigh_R: 'hips', shin_R: 'thigh_R', foot_R: 'shin_R'
};

export async function buildCharacter(spec, outPath, artDir = 'assets_fornecidos/personagens_3d') {
  const art = await loadArt(path.join(artDir, spec.art), { shadowFloor: spec.shadow_floor ?? 0 });
  const { pts, half } = spec;
  const Kpx = spec.height_m / (spec.foot_y - pts.head_top[1]);
  const cx = spec.cx ?? (pts.hipL[0] + pts.hipR[0]) / 2;
  const R = (v) => v * Kpx;
  const yM = (py) => (spec.foot_y - py) * Kpx;
  const xM = (px) => (px - cx) * Kpx;
  const yHips = yM(pts.pelvis[1]);
  const sideView = spec.view === 'side'; // arte em perfil: a frente do personagem é a direita da imagem
  const lean = (ym) => (spec.lean ?? 0) * Math.max(0, ym - yHips);
  // pontos em perfil carregam o deslocamento lateral (m) como 3º valor: [px, py, lat]
  const M = ([px, py, lat = 0], dz = 0) => { const y = yM(py); return sideView ? [lat, y, xM(px) + dz] : [xM(px), y, lean(y) + dz]; };
  const depth = { torso: 0.62, limb: 1.0, head: 0.95, ...(spec.depth ?? {}) };

  // ---------------------------------------------------------------- esqueleto (posições globais em m)
  const yChest = spec.chest_y ?? (pts.pelvis[1] + pts.neck[1]) / 2;
  const hipsP = M(pts.pelvis);
  const neckP = M(pts.neck);
  const chestP = M([K.lerp(pts.pelvis[0], pts.neck[0], 0.6), yChest]);
  const headJ = K.lerp3(neckP, M(pts.chin, 0.012), 0.72);
  const J = {
    hips: hipsP, spine: K.lerp3(hipsP, chestP, 0.5), chest: chestP, neck: neckP, head: headJ,
    shoulder_L: K.lerp3(neckP, M(pts.shL), 0.4), upperarm_L: M(pts.shL), forearm_L: M(pts.elL), hand_L: M(pts.wrL),
    shoulder_R: K.lerp3(neckP, M(pts.shR), 0.4), upperarm_R: M(pts.shR), forearm_R: M(pts.elR), hand_R: M(pts.wrR),
    thigh_L: M(pts.hipL), shin_L: M(pts.kneeL), foot_L: M(pts.ankleL),
    thigh_R: M(pts.hipR), shin_R: M(pts.kneeR), foot_R: M(pts.ankleR)
  };
  if (!sideView) for (const n of ['thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R']) J[n][2] = 0;
  const yNeck = neckP[1], yChestM = chestP[1], yHipsM = hipsP[1], ySpineM = J.spine[1];

  const part = new K.Part();
  const rand = K.rng(spec.seed ?? 7);
  const W1 = (n) => ({ [n]: 1 });

  // ---------------------------------------------------------------- tronco (e saia do casaco)
  const skirtBottom = Math.min(...spec.torso.map(([py]) => yM(py)));
  const torsoW = (ym, sx) => {
    if (ym >= yChestM) return K.blendW({ chest: 1 }, { neck: 1 }, K.smoothstep(yChestM, yNeck, ym) * 0.6);
    if (ym >= ySpineM) return K.blendW({ spine: 1 }, { chest: 1 }, K.smoothstep(ySpineM, yChestM, ym));
    if (ym >= yHipsM) return K.blendW({ hips: 1 }, { spine: 1 }, K.smoothstep(yHipsM, ySpineM, ym));
    const t = K.clamp01((yHipsM - ym) / Math.max(0.05, yHipsM - skirtBottom));
    const wl = t * 0.85 * K.clamp01(0.5 + sx * 1.6), wr = t * 0.85 * K.clamp01(0.5 - sx * 1.6);
    return { hips: 1 - wl - wr, thigh_L: wl, thigh_R: wr };
  };
  const torsoStations = spec.torso.map(([py, hw, opts = {}]) => {
    const ym = yM(py);
    const t = K.clamp01((pts.pelvis[1] - py) / (pts.pelvis[1] - pts.neck[1]));
    const cxp = opts.cx ?? K.lerp(pts.pelvis[0], pts.neck[0], t);
    const rx = R(hw);
    const lower = ym < yHipsM;
    if (sideView) return { p: [0, ym, xM(cxp)], r: [opts.lat ?? spec.side_lat ?? 0.15, rx], up: [0, 0, 1], w: (sx) => torsoW(ym, sx), jag: opts.jag };
    return { p: [xM(cxp), ym, lean(ym)], r: [rx, rx * (opts.depth ?? (lower ? depth.torso * 1.2 : depth.torso))], up: [0, 0, 1], w: (sx) => torsoW(ym, sx), jag: opts.jag };
  });
  K.tube(part, torsoStations, { seg: 20, caps: [true, false], tag: 'body', rand });

  // ---------------------------------------------------------------- pescoço
  {
    const rN = R(half.neck);
    K.tube(part, [
      { p: K.lerp3(neckP, chestP, 0.25), r: [rN * 1.15, rN * 1.1], w: { chest: 0.5, neck: 0.5 } },
      { p: neckP, r: [rN, rN], w: { neck: 0.7, chest: 0.3 } },
      { p: headJ, r: [rN * 0.95, rN * 0.95], w: { head: 0.6, neck: 0.4 } },
      { p: K.add(headJ, [0, R(20), 0.01]), r: [rN * 0.95, rN * 0.95], w: { head: 1 } }
    ], { seg: 12, tag: 'body' });
  }

  // ---------------------------------------------------------------- braços
  for (const side of ['L', 'R']) {
    const U = `upperarm_${side}`, F = `forearm_${side}`, H = `hand_${side}`, S = `shoulder_${side}`;
    const sh = J[U], el = J[F], wr = J[H];
    const tip = M(pts[`hand${side}`], 0.01);
    const [a0, a1, a2] = half.arm.map(R);
    const zArm = 0.012;
    const at = (a, b, t) => K.add(K.lerp3(a, b, t), [0, 0, zArm]);
    K.tube(part, [
      { p: K.add(K.lerp3(J[S], sh, 0.3), [0, R(6), zArm]), r: [a0 * 0.95, a0 * 0.95], w: { chest: 0.45, [S]: 0.25, [U]: 0.3 } },
      { p: at(sh, el, 0.12), r: [a0, a0], w: { [U]: 0.9, chest: 0.1 } },
      { p: at(sh, el, 0.6), r: [K.lerp(a0, a1, 0.6), K.lerp(a0, a1, 0.6)], w: { [U]: 1 } },
      { p: at(sh, el, 0.92), r: [a1 * 1.02, a1 * 1.02], w: { [U]: 0.85, [F]: 0.15 } },
      { p: at(el, el, 0), r: [a1, a1], w: { [U]: 0.5, [F]: 0.5 } },
      { p: at(el, wr, 0.25), r: [K.lerp(a1, a2, 0.3), K.lerp(a1, a2, 0.3)], w: { [F]: 0.9, [U]: 0.1 } },
      { p: at(el, wr, 0.8), r: [K.lerp(a1, a2, 0.85), K.lerp(a1, a2, 0.85)], w: { [F]: 1 } },
      { p: at(el, wr, 1.0), r: [a2, a2], w: { [F]: 0.8, [H]: 0.2 } }
    ], { seg: 14, caps: [true, true], tag: 'body', rand });
    // mão: tubo do punho à ponta dos dedos (acompanha a direção do antebraço), polegar quando a mão pende
    const hw = R(half.hand[0]);
    const hd = K.norm(K.sub(tip, wr));
    const hlen = K.len(K.sub(tip, wr));
    K.tube(part, [0, 0.3, 0.7, 1].map((t, i) => ({
      p: K.add(K.lerp3(wr, tip, t * 0.95), [0, 0, zArm]),
      r: [hw * (1 - 0.3 * t), hw * (spec.hand_depth ?? 0.55) * (1 - 0.25 * t)],
      w: W1(H)
    })), { seg: 10, caps: [false, true], tag: 'hand' });
    if (Math.abs(hd[1]) > 0.7) {
      const hc = K.add(K.lerp3(wr, tip, 0.5), [0, 0, zArm]);
      K.ellipsoid(part, K.add(hc, [(side === 'L' ? -1 : 1) * hw * 0.85, hlen * 0.15, hw * 0.55]), [hw * 0.32, hlen * 0.21, hw * 0.3], W1(H), { seg: 8, ring: 6, tag: 'detail' });
    }
    if (spec.claws) {
      const rr = spec.claws;
      for (let f = 0; f < 4; f++) {
        const fx = (f - 1.5) * 0.55;
        const base = K.add(tip, [fx * hw, 0, zArm + 0.005]);
        const dir = K.norm(K.add(hd, [fx * 0.3, 0, fx * 0.1 + 0.15]));
        K.tube(part, [0, 0.4, 0.75, 1].map((t, i) => ({ p: K.add(base, K.mul(dir, rr.len * t)), r: [rr.r * (1 - i * 0.28), rr.r * (1 - i * 0.28)], w: W1(H) })), { seg: 6, tag: 'detail' });
      }
    }
  }

  // ---------------------------------------------------------------- pernas e pés
  const footLen = spec.foot_len ?? 0.26 * spec.height_m / 1.7;
  for (const side of ['L', 'R']) {
    const T = `thigh_${side}`, S = `shin_${side}`, Fo = `foot_${side}`;
    const hp = J[T], kn = J[S], an = J[Fo];
    const [l0, l1, l2] = half.leg.map(R);
    const at = (a, b, t) => K.lerp3(a, b, t);
    K.tube(part, [
      { p: K.add(hp, [0, R(20), 0]), r: [l0 * 1.02, l0 * 1.05], w: { hips: 0.55, [T]: 0.45 } },
      { p: at(hp, kn, 0.15), r: [l0, l0 * 1.03], w: { [T]: 0.9, hips: 0.1 } },
      { p: at(hp, kn, 0.7), r: [K.lerp(l0, l1, 0.7), K.lerp(l0, l1, 0.7) * 1.02], w: { [T]: 1 } },
      { p: kn, r: [l1, l1 * 1.03], w: { [T]: 0.5, [S]: 0.5 } },
      { p: at(kn, an, 0.25), r: [K.lerp(l1, l2, 0.25), K.lerp(l1, l2, 0.25)], w: { [S]: 0.95, [T]: 0.05 } },
      { p: at(kn, an, 0.7), r: [K.lerp(l1, l2, 0.75), K.lerp(l1, l2, 0.75)], w: { [S]: 1 } },
      { p: K.add(an, [0, 0.03, 0]), r: [l2 * 1.05, l2 * 1.05], w: { [S]: 0.7, [Fo]: 0.3 } },
      ...(spec.boot_bottom_px ? [{ p: [an[0], yM(spec.boot_bottom_px), an[2]], r: [R(half.foot ?? 34) * 0.95, R(half.foot ?? 34) * 0.95], w: { [Fo]: 1 } }] : [])
    ], { seg: 14, caps: [true, true], tag: 'body', rand });
    // pé (bota ou descalço): tubo achatado do calcanhar à ponta, apontando para +Z
    const fw = R(half.foot ?? 34), fh = spec.foot_h ?? 0.085;
    const toeR = spec.barefoot ? 0.55 : 0.75;
    K.tube(part, [
      { p: [an[0], fh * 0.62, an[2] - 0.045], r: [fw * 0.95, fh * 0.6], up: [0, 1, 0], w: W1(Fo) },
      { p: [an[0], fh * 0.58, an[2] + footLen * 0.25], r: [fw, fh * 0.56], up: [0, 1, 0], w: W1(Fo) },
      { p: [an[0], fh * 0.5, an[2] + footLen * 0.62], r: [fw * 0.92, fh * 0.48], up: [0, 1, 0], w: W1(Fo) },
      { p: [an[0], fh * 0.4, an[2] + footLen * 0.9], r: [fw * toeR, fh * 0.38], up: [0, 1, 0], w: W1(Fo) }
    ], { seg: 14, caps: [true, true], tag: 'body' });
  }

  // ---------------------------------------------------------------- cabeça
  const hc = spec.head;
  const headTopY = yM(pts.head_top[1]), chinY = yM(pts.chin[1]);
  const skullTopY = yM(pts.head_top[1] + (hc.hair_px ?? 24));
  const skullCy = (skullTopY + chinY) / 2, skullRy = (skullTopY - chinY) / 2;
  const hcx = xM(hc.cx ?? pts.head_top[0]);
  const hwm = R(half.head);
  const zHead = sideView ? hcx : lean(skullCy) + 0.012;
  const headX = sideView ? 0 : hcx;
  const hLat = sideView ? (hc.lat ?? 0.1) : hwm; // meia-largura lateral da cabeça
  const headShape = (x, y, z) => {
    const below = Math.max(0, -y);
    const taper = 1 - (hc.jaw ?? 0.34) * below ** 1.4;
    return [x * taper, y, z * (1 - 0.12 * below ** 2) * (z > 0 ? 1.02 : 1)];
  };
  K.ellipsoid(part, [headX, skullCy, zHead], [hLat, skullRy, sideView ? hwm : hwm * depth.head], W1('head'), { seg: 28, ring: 22, shape: headShape, tag: 'head' });
  if (hc.jaw_box) { // mandíbula/queixo pesado (criaturas)
    const [jw, jh, jd] = hc.jaw_box.map((v, i) => R(v));
    K.ellipsoid(part, [headX, chinY + jh * 0.6, zHead + hwm * 0.35], [jw, jh, jd], W1('head'), { seg: 14, ring: 10, tag: 'head' });
  }
  // nariz
  if (hc.nose) {
    const [npx, npy, nlen = 0.02] = hc.nose;
    if (sideView) K.ellipsoid(part, [0, yM(npy), xM(npx) - nlen * 0.5], [R(hc.nose_w ?? 13), R(hc.nose_h ?? 22), nlen], W1('head'), { seg: 10, ring: 8, tag: 'detail' });
    else K.ellipsoid(part, [xM(npx), yM(npy), zHead + hwm * depth.head * 0.98], [R(hc.nose_w ?? 13), R(hc.nose_h ?? 22), nlen], W1('head'), { seg: 10, ring: 8, tag: 'detail' });
  }
  // orelhas
  if (hc.ear) {
    const e = hc.ear;
    for (const sd of [1, -1]) {
      const ex = sideView ? sd * hLat : xM(e.px[sd === 1 ? 1 : 0]);
      const ez = sideView ? xM(e.px) + 0.035 : zHead - 0.005;
      const ey = yM(e.py);
      if (e.pointed) {
        const dir = sideView ? K.norm([sd * 0.55, e.up ?? 0.5, e.dir_z ?? -0.75]) : K.norm([sd * 1, e.up ?? 0.6, -0.25]);
        const base = [ex - (sideView ? 0 : sd * R(6)), ey, ez];
        K.tube(part, [0, 0.35, 0.7, 1].map((t, i) => ({ p: K.add(base, K.mul(dir, R(e.len) * t)), r: [R(e.w) * (1 - i * 0.26), 0.006 + 0.006 * (1 - i * 0.3)], up: [0, 0, 1], w: W1('head') })), { seg: 8, tag: 'detail' });
      } else if (!sideView) {
        K.ellipsoid(part, [ex, ey, zHead - 0.012], [0.01, R(e.h ?? 28), R(e.d ?? 18)], W1('head'), { seg: 10, ring: 8, tag: 'detail' });
      }
    }
  }
  // cabelo: calota + mechas
  const hairCol = spec.hair_rgb ?? averageRegion(art, spec.hair_region ?? [pts.head_top[0] - 60, pts.head_top[1] + 5, pts.head_top[0] + 60, pts.head_top[1] + 40]);
  if (hc.hair !== false) {
    const hr = [hwm * (hc.hair_w ?? 1.1), (headTopY - skullCy) * 1.02, hwm * depth.head * 1.12];
    const hcy = skullCy + (hc.hair_dy ?? 0) * Kpx;
    K.ellipsoid(part, [headX, hcy, zHead - 0.008], sideView ? [hLat * (hc.hair_w ?? 1.1), hr[1], hr[0]] : hr, W1('head'), {
      seg: 26, ring: 14, tag: 'hair', phiMax: (th) => K.lerp(hc.hair_back_cut ?? 2.2, hc.hair_front_cut ?? 1.05, ((Math.cos(th) + 1) / 2) ** 1.4)
    });
    for (const [tpx, tpy, tlen, tw, dx = 0, dz = -0.3] of hc.tufts ?? []) {
      const base = [sideView ? 0 : xM(tpx), yM(tpy), zHead];
      const dir = K.norm([dx, 0.8, dz]);
      K.tube(part, [0, 0.4, 0.75, 1].map((t, i) => ({ p: K.add(base, K.mul(dir, R(tlen) * t)), r: [R(tw) * (1 - i * 0.28), R(tw) * 0.45 * (1 - i * 0.28)], up: [0, 0, 1], w: W1('head') })), { seg: 6, tag: 'hair' });
    }
  }
  if (hc.hair_long) { // cabelo comprido caindo atrás dos ombros
    const hl = hc.hair_long;
    const st = hl.map(([py, hw]) => {
      const ym = yM(py);
      const w = ym > neckP[1] ? W1('head') : K.blendW({ neck: 1 }, { chest: 1 }, K.clamp01((neckP[1] - ym) / 0.25));
      return { p: [headX, ym, (sideView ? zHead : lean(ym)) - hwm * 0.55], r: [R(hw), R(hw) * 0.42], up: [0, 0, 1], w };
    });
    K.tube(part, st, { seg: 18, caps: [true, true], tag: 'hairflat' });
  }

  // ---------------------------------------------------------------- adereços e partes específicas do personagem
  const ctx = { part, K, M, R, xM, yM, lean, J, Kpx, W1, art, footLen, hwm, zHead, rand };
  spec.extras?.(ctx);

  // ---------------------------------------------------------------- atributos: normais, UV de projeção, cor chapada
  const normals = K.orientAndNormals(part);
  const n = part.pos.length;
  const uv = new Float32Array(n * 2);
  const col = new Uint8Array(n * 4);
  const uv2 = new Float32Array(n * 2);
  const boost = (c) => Math.min(255, c * (spec.flat_boost ?? 2.2) + 14);
  const hairFlat = hairCol.map(boost);
  const backHead = (spec.back_head_rgb ?? hairCol).map(boost);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = part.pos[i];
    const pxA = cx + (sideView ? z : x) / Kpx, pyA = spec.foot_y - y / Kpx;
    uv[i * 2] = Math.max(0, Math.min(1, pxA / art.W));
    uv[i * 2 + 1] = Math.max(0, Math.min(1, pyA / art.H));
    const nz = sideView ? Math.abs(normals[i * 3]) : normals[i * 3 + 2];
    let flat = sampleBlur(art, pxA, pyA).map(boost);
    const tag = part.tag[i];
    if (tag === 'hair' || tag === 'hairflat') flat = hairFlat;
    else if (tag === 'head') flat = flat.map((c, k) => K.lerp(c, backHead[k], 1 - K.smoothstep(0.0, 0.5, nz)));
    const wFront = tag === 'hairflat' ? 0 : tag === 'hair' ? K.smoothstep(0.25, 0.75, nz) : K.smoothstep(0.18, 0.72, nz);
    col.set([flat[0], flat[1], flat[2], Math.round(wFront * 255)], i * 4);
    uv2[i * 2] = tag === 'detail' ? 0 : 1; // fator de contorno (0 = sem contorno em detalhes pequenos)
  }

  // ---------------------------------------------------------------- glTF
  const doc = new Document();
  doc.getRoot().getAsset().generator = `O Ultimo Rastro — tools/models/lib/humanoid.mjs (${spec.id})`;
  const buffer = doc.createBuffer();
  const tex = doc.createTexture(`${spec.id}_art`).setImage(await textureJpeg(art)).setMimeType('image/jpeg').setURI(`${spec.id}_art.jpg`);
  const material = doc.createMaterial(`${spec.id}_art`).setBaseColorTexture(tex).setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true);
  const JI = Object.fromEntries(J_NAMES.map((nm, i) => [nm, i]));
  const joints = new Uint8Array(n * 4), weights = new Float32Array(n * 4);
  part.w.forEach((w, v) => {
    const entries = Object.entries(w).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = entries.reduce((s, e) => s + e[1], 0);
    entries.forEach(([j, val], k) => { joints[v * 4 + k] = JI[j]; weights[v * 4 + k] = val / sum; });
  });
  const acc = (name, type, arr) => doc.createAccessor(name).setType(type).setArray(arr).setBuffer(buffer);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('pos', 'VEC3', new Float32Array(part.pos.flat())))
    .setAttribute('NORMAL', acc('nor', 'VEC3', normals))
    .setAttribute('TEXCOORD_0', acc('uv', 'VEC2', uv))
    .setAttribute('TEXCOORD_1', acc('uv2', 'VEC2', uv2))
    .setAttribute('COLOR_0', acc('col', 'VEC4', col).setNormalized(true))
    .setAttribute('JOINTS_0', acc('joints', 'VEC4', joints))
    .setAttribute('WEIGHTS_0', acc('weights', 'VEC4', weights))
    .setIndices(acc('idx', 'SCALAR', n > 65535 ? new Uint32Array(part.idx) : new Uint16Array(part.idx)))
    .setMaterial(material);
  const mesh = doc.createMesh(`${spec.id}_body`).addPrimitive(prim);
  const nodes = {};
  const root = doc.createNode(spec.id);
  for (const name of J_NAMES) {
    const p = J[name], pp = PARENT[name] ? J[PARENT[name]] : [0, 0, 0];
    nodes[name] = doc.createNode(name).setTranslation([p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]]);
  }
  for (const name of J_NAMES) (PARENT[name] ? nodes[PARENT[name]] : root).addChild(nodes[name]);
  const noseY = hc.nose ? yM(hc.nose[1]) : skullCy;
  nodes.head.addChild(doc.createNode('nose').setTranslation([0, noseY - J.head[1], zHead + hwm * 0.9 - J.head[2]]));
  const ibm = new Float32Array(J_NAMES.length * 16);
  J_NAMES.forEach((name, i) => { const [x, y, z] = J[name]; ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1], i * 16); });
  const skin = doc.createSkin(`${spec.id}_skin`).setSkeleton(nodes.hips).setInverseBindMatrices(acc('ibm', 'MAT4', ibm));
  for (const name of J_NAMES) skin.addJoint(nodes[name]);
  root.addChild(doc.createNode(`${spec.id}_body`).setMesh(mesh).setSkin(skin));
  doc.createScene(`${spec.id}_scene`).addChild(root);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await new NodeIO().write(outPath, doc);
  return { bytes: fs.statSync(outPath).size, vertices: n, height: headTopY, joints: J };
}
