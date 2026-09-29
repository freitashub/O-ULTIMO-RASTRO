/** Theo (normal) — pontos-chave medidos em theo.jpg (768×1376). +X do modelo = direita da imagem. */
export default {
  id: 'theo', art: 'theo.jpg', height_m: 1.45, foot_y: 1312, cx: 388,
  pts: {
    head_top: [385, 112], chin: [362, 362], neck: [378, 398], pelvis: [388, 855],
    shR: [292, 500], shL: [492, 500], elR: [268, 660], elL: [522, 655], wrR: [238, 775], wrL: [512, 782], handR: [242, 858], handL: [500, 866],
    hipR: [338, 862], hipL: [440, 862], kneeR: [336, 1035], kneeL: [452, 1040], ankleR: [338, 1170], ankleL: [466, 1178]
  },
  chest_y: 560,
  half: { head: 94, neck: 21, arm: [42, 40, 36], leg: [46, 38, 30], hand: [23], foot: 34 },
  torso: [[398, 44], [430, 72], [470, 94], [520, 98], [600, 96], [700, 92], [790, 98], [850, 130], [892, 152]],
  head: {
    cx: 384, hair_px: 26, jaw: 0.34, nose: [355, 313, 0.011], nose_w: 12, nose_h: 20,
    ear: { px: [292, 470], py: 292, h: 26, d: 16 },
    tufts: []
  },
  hair_region: [330, 120, 440, 170],
  foot_len: 0.25, boot_bottom_px: 1290,
  extras({ part, K, M, R, W1 }) {
    // bolsa a tiracolo no quadril esquerdo (lado direito da imagem)
    const c = M([528, 800], 0.02);
    K.roundedBox(part, c, [R(92), R(110), 0.075], W1('hips'), { p: 0.3, tag: 'prop' });
  }
};
