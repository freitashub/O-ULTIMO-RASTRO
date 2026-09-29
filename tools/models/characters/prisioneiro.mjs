/** Prisioneiro — pontos-chave medidos em prisioneiro.jpg (768×1376): curvado, descalço, algemas com correntes. */
export default {
  id: 'prisioneiro', art: 'prisioneiro.jpg', height_m: 1.7, foot_y: 1322, cx: 395, lean: 0.2,
  pts: {
    head_top: [452, 92], chin: [470, 322], neck: [418, 350], pelvis: [398, 835],
    shR: [248, 388], shL: [505, 385], elR: [186, 545], elL: [518, 592], wrR: [240, 695], wrL: [562, 690], handR: [302, 840], handL: [612, 802],
    hipR: [332, 872], hipL: [466, 868], kneeR: [318, 992], kneeL: [524, 992], ankleR: [246, 1200], ankleL: [455, 1187]
  },
  chest_y: 500,
  half: { head: 62, neck: 28, arm: [36, 29, 23], leg: [46, 36, 26], hand: [22], foot: 30 },
  torso: [[335, 38], [362, 82], [402, 108], [480, 112], [560, 108], [625, 100], [705, 116], [785, 124], [860, 122]],
  barefoot: true, boot_bottom_px: 1292, foot_len: 0.23, foot_h: 0.06,
  hair_region: [400, 100, 520, 150],
  head: {
    cx: 456, hair_px: 34, jaw: 0.26, nose: [492, 246, 0.014], nose_w: 12, nose_h: 22, hair_w: 1.3, hair_front_cut: 1.35,
    tufts: []
  },
  extras({ part, K, M, R, W1 }) {
    const link = (a, b, w, n = 9) => {
      for (let i = 0; i < n; i++) {
        const p = K.lerp3(a, b, i / (n - 1));
        K.roundedBox(part, p, i % 2 ? [0.012, 0.03, 0.02] : [0.02, 0.03, 0.012], w, { p: 0.5, seg: 8, ring: 6, tag: 'prop' });
      }
    };
    // argolas de ferro nos punhos e tornozelos + correntes pendentes
    for (const [j, pxy] of [['hand_R', [240, 695]], ['hand_L', [562, 690]]]) {
      const c = M(pxy, 0.012);
      K.tube(part, [-1, 1].map((s) => ({ p: K.add(c, [0, s * 0.028, 0]), r: [0.045, 0.045], up: [0, 0, 1], w: W1(j.replace('hand', 'forearm')) })), { seg: 12, tag: 'prop' });
    }
    for (const [j, pxy] of [['foot_R', [246, 1200]], ['foot_L', [455, 1178]]]) {
      const c = M(pxy, 0);
      K.tube(part, [-1, 1].map((s) => ({ p: K.add(c, [0, s * 0.03, 0]), r: [0.05, 0.05], up: [0, 0, 1], w: W1(j.replace('foot', 'shin')) })), { seg: 12, tag: 'prop' });
    }
    link(M([203, 712], 0.012), M([203, 852], 0.012), W1('forearm_R'));
    link(M([538, 690], 0.012), M([540, 800], 0.012), W1('forearm_L'), 7);
  }
};
