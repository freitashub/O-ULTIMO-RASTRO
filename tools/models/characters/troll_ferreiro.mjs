/** Troll Ferreiro — pontos-chave medidos em troll_ferreiro.jpg (768×1376): baixo, largo, avental de couro, martelo apoiado no chão. */
export default {
  id: 'troll_ferreiro', art: 'troll_ferreiro.jpg', height_m: 1.85, foot_y: 1300, cx: 392, lean: 0.05,
  pts: {
    head_top: [365, 112], chin: [352, 318], neck: [376, 352], pelvis: [392, 990],
    shR: [222, 380], shL: [548, 395], elR: [172, 585], elL: [648, 615], wrR: [132, 678], wrL: [640, 792], handR: [108, 748], handL: [615, 946],
    hipR: [335, 995], hipL: [470, 995], kneeR: [315, 1092], kneeL: [525, 1100], ankleR: [318, 1232], ankleL: [550, 1238]
  },
  chest_y: 520,
  half: { head: 76, neck: 58, arm: [82, 66, 44], leg: [64, 56, 42], hand: [44], foot: 52 },
  torso: [[340, 60], [380, 122], [420, 166], [500, 174], [600, 168], [700, 162], [800, 158], [900, 152], [1000, 148], [1032, 142]],
  boot_bottom_px: 1285, foot_len: 0.34, foot_h: 0.12, hand_depth: 0.7,
  hair_region: [310, 120, 420, 165],
  head: {
    cx: 365, hair: false, jaw: 0.18, nose: [338, 240, 0.034], nose_w: 30, nose_h: 32, jaw_box: [56, 30, 48],
    ear: { px: [290, 448], py: 200, pointed: true, len: 38, w: 18, up: 0.5 }
  },
  extras({ part, K, M, R, W1 }) {
    // chifres
    for (const [b, t] of [[[312, 142], [292, 104]], [[420, 140], [440, 104]]]) {
      const a = M(b, 0.02), c = M(t, 0.02);
      K.tube(part, [0, 0.5, 1].map((u, i) => ({ p: K.lerp3(a, c, u), r: [0.024 * (1 - i * 0.4), 0.024 * (1 - i * 0.4)], w: W1('head') })), { seg: 8, tag: 'detail' });
    }
    // martelo de ferreiro: cabo apoiado na mão direita (imagem esquerda) e cabeça no chão
    const top = M([118, 700], 0.14), bottom = M([152, 1160], 0.14);
    K.tube(part, [0, 0.5, 1].map((u) => ({ p: K.lerp3(top, bottom, u), r: [R(15), R(15)], w: W1('hand_R') })), { seg: 8, tag: 'prop' });
    K.roundedBox(part, M([152, 1198], 0.14), [R(196), R(112), R(112)], W1('hand_R'), { p: 0.25, tag: 'prop' });
  }
};
