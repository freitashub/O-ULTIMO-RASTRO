/** Silas troll — pontos-chave medidos em silas_troll.jpg (768×1376): alto, curvado, garras, casaco de policial. */
export default {
  id: 'silas_troll', art: 'silas_troll.jpg', height_m: 2.15, foot_y: 1330, cx: 402, lean: 0.14, claws: { len: 0.11, r: 0.007 },
  pts: {
    head_top: [242, 42], chin: [258, 252], neck: [300, 305], pelvis: [400, 705],
    shR: [218, 335], shL: [565, 305], elR: [150, 625], elL: [655, 565], wrR: [135, 790], wrL: [655, 795], handR: [152, 1010], handL: [605, 1025],
    hipR: [342, 705], hipL: [468, 705], kneeR: [338, 1015], kneeL: [520, 1015], ankleR: [335, 1228], ankleL: [568, 1250]
  },
  chest_y: 470,
  half: { head: 66, neck: 44, arm: [56, 46, 34], leg: [56, 46, 36], hand: [34], foot: 44 },
  torso: [[285, 46], [320, 96], [365, 142], [430, 158], [520, 158], [600, 154], [700, 160], [800, 164], [950, 174], [1100, 184]],
  barefoot: true, boot_bottom_px: 1305, foot_len: 0.34, foot_h: 0.11,
  hair_region: [205, 55, 320, 100],
  head: {
    cx: 262, hair: false, jaw: 0.3, nose: [226, 196, 0.03], nose_w: 24, nose_h: 46, jaw_box: [46, 34, 40],
    ear: { px: [176, 352], py: 112, pointed: true, len: 80, w: 20, up: 0.35 }
  },
  extras({ part, K, M, R, W1 }) {
    // bolsas do cinto (utilidades de policial)
    K.roundedBox(part, M([272, 598], 0.09), [R(56), R(84), 0.09], W1('hips'), { p: 0.3, tag: 'prop' });
    K.roundedBox(part, M([508, 590], 0.09), [R(64), R(92), 0.09], W1('hips'), { p: 0.3, tag: 'prop' });
  }
};
