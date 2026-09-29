/** Troll Vigia — pontos-chave medidos em troll_vigia.jpg (768×1376), arte em PERFIL (frente = direita da imagem). Braço/perna próximos = direita do personagem (R). */
export default {
  id: 'troll_vigia', art: 'troll_vigia.jpg', view: 'side', height_m: 1.62, foot_y: 1315, cx: 330, claws: { len: 0.09, r: 0.005 },
  pts: {
    head_top: [562, 122], chin: [588, 345], neck: [452, 402], pelvis: [315, 735],
    shR: [335, 378, -0.13], shL: [440, 430, 0.13], elR: [335, 590, -0.15], elL: [482, 640, 0.15],
    wrR: [540, 505, -0.15], wrL: [582, 792, 0.15], handR: [690, 405, -0.15], handL: [608, 985, 0.15],
    hipR: [300, 780, -0.08], hipL: [350, 780, 0.08], kneeR: [295, 950, -0.09], kneeL: [490, 915, 0.09],
    ankleR: [182, 1235, -0.09], ankleL: [448, 1185, 0.09]
  },
  chest_y: 500, side_lat: 0.15,
  half: { head: 88, neck: 28, arm: [30, 24, 19], leg: [34, 27, 20], hand: [20], foot: 26 },
  torso: [[400, 60, { cx: 450, lat: 0.11 }], [450, 88, { cx: 400, lat: 0.14 }], [520, 100, { cx: 360 }], [600, 102, { cx: 335 }], [680, 95, { cx: 325 }], [760, 88, { cx: 320 }]],
  barefoot: true, boot_bottom_px: 1290, foot_len: 0.24, foot_h: 0.06,
  hair_region: [500, 130, 600, 170],
  head: {
    cx: 555, lat: 0.09, hair: false, jaw: 0.3, nose: [628, 294, 0.045], nose_w: 26, nose_h: 34,
    ear: { px: 470, py: 232, pointed: true, len: 62, w: 20, up: 0.35, dir_z: -0.9 }
  },
  extras({ part, K, xM, yM, R, J }) {
    // capa esfarrapada que cai pelas costas até a canela
    const w = (ym) => (ym > J.chest[1] ? { chest: 1 } : ym > J.spine[1] ? K.blendW({ chest: 1 }, { spine: 1 }, 0.5) : { hips: 0.7, spine: 0.3 });
    const st = [[340, 268, 55], [400, 240, 100], [520, 205, 88], [640, 192, 78], [780, 182, 60], [910, 170, 48]].map(([py, cxp, d]) => {
      const ym = yM(py);
      return { p: [0, ym, xM(cxp)], r: [0.2, R(d)], up: [0, 0, 1], w: w(ym) };
    });
    K.tube(part, st, { seg: 18, caps: [true, false], tag: 'body' });
  }
};
