/** Elias — pontos-chave medidos em elias.jpg (768×1376). Mão direita (imagem esquerda) sobre o peito; livro na mão esquerda (imagem direita). */
export default {
  id: 'elias', art: 'elias.jpg', height_m: 1.78, foot_y: 1320, cx: 390,
  pts: {
    head_top: [385, 42], chin: [418, 248], neck: [376, 288], pelvis: [390, 830],
    shR: [262, 345], shL: [478, 348], elR: [182, 505], elL: [522, 592], wrR: [262, 492], wrL: [540, 690], handR: [352, 432], handL: [548, 718],
    hipR: [340, 835], hipL: [445, 835], kneeR: [292, 1095], kneeL: [478, 1092], ankleR: [287, 1208], ankleL: [482, 1205]
  },
  chest_y: 500,
  half: { head: 66, neck: 46, arm: [42, 38, 32], leg: [52, 40, 33], hand: [24], foot: 40 },
  torso: [[285, 48], [320, 95], [360, 118], [430, 122], [520, 122], [620, 118], [720, 122], [820, 145], [920, 170], [1010, 188]],
  boot_bottom_px: 1302, foot_len: 0.26,
  hair_region: [330, 55, 440, 110],
  head: {
    cx: 396, hair_px: 22, jaw: 0.32, nose: [412, 205, 0.012], nose_w: 11, nose_h: 20,
    ear: { px: [334, 462], py: 178, h: 26, d: 16 }, tufts: []
  },
  extras({ part, K, M, R, W1 }) {
    // bolsa de mensageiro no quadril direito (imagem esquerda), pendurada pela alça
    K.roundedBox(part, M([215, 705], 0.03), [R(84), R(140), 0.1], W1('hips'), { p: 0.3, tag: 'prop' });
    // livro na mão esquerda (imagem direita)
    K.roundedBox(part, M([552, 645], 0.06), [R(100), R(120), 0.06], W1('hand_L'), { p: 0.2, tag: 'prop', rotY: 0.2 });
  }
};
