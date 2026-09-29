/** Troll Guardião — pontos-chave medidos em troll_guardiao.jpg (768×1376): gigante, corcunda, cabeça encaixada nos ombros, machado de pedra. */
export default {
  id: 'troll_guardiao', art: 'troll_guardiao.jpg', height_m: 2.4, foot_y: 1295, cx: 420, lean: 0.1, claws: { len: 0.13, r: 0.01 },
  pts: {
    head_top: [560, 238], chin: [562, 398], neck: [545, 415], pelvis: [400, 720],
    shR: [205, 325], shL: [608, 352], elR: [152, 585], elL: [652, 592], wrR: [178, 775], wrL: [656, 752], handR: [208, 955], handL: [662, 968],
    hipR: [335, 735], hipL: [472, 735], kneeR: [305, 1012], kneeL: [545, 1012], ankleR: [287, 1218], ankleL: [596, 1238]
  },
  chest_y: 500,
  half: { head: 80, neck: 74, arm: [96, 76, 60], leg: [84, 64, 50], hand: [48], foot: 62 },
  torso: [[300, 150, { cx: 425 }], [360, 205, { cx: 418 }], [430, 192, { cx: 410 }], [520, 168], [600, 162], [680, 166], [745, 152], [820, 128], [900, 108], [985, 78]],
  barefoot: true, boot_bottom_px: 1268, foot_len: 0.42, foot_h: 0.13, hand_depth: 0.7,
  hair_region: [500, 250, 620, 290],
  head: { cx: 560, hair: false, jaw: 0.2, jaw_box: [58, 30, 50] },
  extras({ part, K, M, R, W1 }) {
    // machado de pedra: haste na mão direita (imagem esquerda) e cabeça de pedra à frente da perna
    const a = M([38, 768], 0.2), b = M([405, 1080], 0.2);
    K.tube(part, [0, 0.35, 0.7, 1].map((u) => ({ p: K.lerp3(a, b, u), r: [R(22), R(22)], w: { hand_R: 1 } })), { seg: 8, tag: 'prop' });
    K.roundedBox(part, M([430, 1125], 0.2), [R(215), R(330), 0.24], { hand_R: 1 }, { p: 0.28, tag: 'prop', rotY: 0.25 });
  }
};
