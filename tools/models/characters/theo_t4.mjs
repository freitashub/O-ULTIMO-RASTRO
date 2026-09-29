import base from './theo.mjs';
/** Theo — transformação 04 (orelhas grandes de goblin, cabeça projetada à frente, presas, mãos longas). */
export default {
  ...base, id: 'theo_t4', art: 'transformacao_theo_04.jpg', claws: { len: 0.06, r: 0.0045 },
  pts: {
    ...base.pts, head_top: [255, 108], chin: [258, 396], neck: [362, 412],
    wrR: [218, 880], wrL: [500, 882], handR: [205, 1022], handL: [518, 1024], elR: [262, 690], elL: [520, 690]
  },
  half: { ...base.half, head: 92, neck: 26, arm: [42, 36, 19], hand: [19] },
  hair_region: [200, 120, 320, 170],
  head: { ...base.head, cx: 255, hair_px: 30, nose: [232, 330, 0.012], ear: { px: [168, 350], py: 290, pointed: true, len: 112, w: 30, up: 0.05 } },
  extras: base.extras
};
