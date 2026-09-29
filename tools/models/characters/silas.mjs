/** Silas (humano) — pontos-chave medidos em silas.jpg (768×1376). Boné na mão direita dele (imagem esquerda). */
export default {
  id: 'silas', art: 'silas.jpg', height_m: 1.82, foot_y: 1322, cx: 396,
  pts: {
    head_top: [380, 55], chin: [356, 240], neck: [372, 278], pelvis: [400, 880],
    shR: [285, 345], shL: [515, 345], elR: [225, 540], elL: [585, 525], wrR: [215, 690], wrL: [455, 572], handR: [215, 800], handL: [395, 588],
    hipR: [345, 885], hipL: [455, 885], kneeR: [345, 1085], kneeL: [462, 1085], ankleR: [352, 1235], ankleL: [466, 1238]
  },
  chest_y: 500,
  half: { head: 60, neck: 38, arm: [48, 42, 36], leg: [46, 42, 38], hand: [24], foot: 42 },
  torso: [[270, 42], [305, 92], [345, 125], [420, 132], [520, 130], [620, 132], [720, 142], [820, 152], [920, 160], [1010, 166]],
  boot_bottom_px: 1305, foot_len: 0.27,
  hair_region: [330, 70, 430, 110],
  head: { cx: 379, hair_px: 18, jaw: 0.3, nose: [348, 190, 0.012], nose_w: 11, nose_h: 20, tufts: [] },
  extras({ part, K, M, R, W1 }) {
    // boné militar na mão direita (imagem esquerda)
    K.ellipsoid(part, M([198, 832], 0.05), [R(52), R(60), 0.05], W1('hand_R'), { seg: 14, ring: 10, tag: 'prop' });
  }
};
