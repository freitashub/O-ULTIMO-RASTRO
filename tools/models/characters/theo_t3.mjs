import base from './theo.mjs';
/** Theo — transformação 03 (orelhas pontudas, presas, antebraços finos com garras). */
export default {
  ...base, id: 'theo_t3', art: 'transformacao_theo_03.jpg', claws: { len: 0.06, r: 0.0045 },
  pts: { ...base.pts, wrR: [218, 880], wrL: [500, 882], handR: [205, 1022], handL: [518, 1024], elR: [262, 690], elL: [520, 690] },
  half: { ...base.half, arm: [42, 36, 19], hand: [19] },
  head: { ...base.head, nose: [352, 318, 0.011], ear: { px: [292, 470], py: 296, pointed: true, len: 66, w: 20, up: 0.3 } },
  extras({ part, K, M, R, W1 }) {
    base.extras({ part, K, M, R, W1 });
  }
};
