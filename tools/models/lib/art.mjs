/**
 * Processamento da arte de referência: remoção do fundo liso (flood fill pela borda + bolsões fechados grandes),
 * preenchimento do fundo com a cor vizinha (sem halo) e amostragem de cor desfocada para os vértices.
 * Nunca é importado pelo runtime do jogo.
 */
import sharp from 'sharp';

export async function loadArt(file, { shadowFloor = 0 } = {}) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  // cor de fundo = mediana dos pixels da borda
  const samples = [];
  for (let x = 0; x < W; x += 4) { samples.push(px(data, W, x, 0), px(data, W, x, H - 1)); }
  for (let y = 0; y < H; y += 4) { samples.push(px(data, W, 0, y), px(data, W, W - 1, y)); }
  const bg = [0, 1, 2].map((c) => samples.map((s) => s[c]).sort((a, b) => a - b)[samples.length >> 1]);
  // `shadowFloor` > 0: sombras projetadas/figuras de sombra (cinza claro, sem tinta) também contam como fundo,
  // desde que estejam ligadas à borda por pixels acima do piso de luminância (o contorno preto do personagem não é cruzado)
  const isBg = (i) => (Math.abs(data[i * 3] - bg[0]) < 26 && Math.abs(data[i * 3 + 1] - bg[1]) < 26 && Math.abs(data[i * 3 + 2] - bg[2]) < 26)
    || (shadowFloor > 0 && Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) > shadowFloor);
  const label = new Int32Array(W * H).fill(-1);
  const fg = new Uint8Array(W * H).fill(1);
  const stack = [];
  let region = 0;
  for (let start = 0; start < W * H; start++) {
    if (label[start] !== -1 || !isBg(start)) continue;
    const pixels = [];
    let border = false;
    stack.push(start);
    label[start] = region;
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      const x = p % W, y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && label[q] === -1 && isBg(q)) { label[q] = region; stack.push(q); }
      }
    }
    // fundo = região ligada à borda, bolsão grande, ou bolsão médio de branco PURO (vãos entre dedos/cabo do machado)
    let pure = false;
    if (!border && pixels.length >= 30 && pixels.length < 900) {
      let white = 0;
      for (const p of pixels) {
        if (Math.abs(data[p * 3] - bg[0]) <= 9 && Math.abs(data[p * 3 + 1] - bg[1]) <= 9 && Math.abs(data[p * 3 + 2] - bg[2]) <= 9) white++;
      }
      pure = white / pixels.length >= 0.6; // maioria de branco puro (o resto é borda suavizada do contorno)
    }
    if (border || pixels.length >= 900 || pure) for (const p of pixels) fg[p] = 0;
    region++;
  }
  // erosão de 3 px: os pixels de borda (antialias claro) não devem ser a fonte do preenchimento
  const core = Uint8Array.from(fg);
  for (let pass = 0; pass < 3; pass++) {
    const prev = Uint8Array.from(core);
    for (let p = 0; p < W * H; p++) {
      if (!prev[p]) continue;
      const x = p % W, y = (p / W) | 0;
      if ((x > 0 && !prev[p - 1]) || (x < W - 1 && !prev[p + 1]) || (y > 0 && !prev[p - W]) || (y < H - 1 && !prev[p + W])) core[p] = 0;
    }
  }
  // preenche o fundo (e a borda erodida) com a cor do pixel sólido mais próximo (BFS a partir do núcleo do objeto)
  const rgb = Buffer.from(data);
  const queue = [];
  const filled = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    if (core[p]) { filled[p] = 1; }
  }
  for (let p = 0; p < W * H; p++) {
    if (!core[p]) continue;
    const x = p % W, y = (p / W) | 0;
    if ((x > 0 && !core[p - 1]) || (x < W - 1 && !core[p + 1]) || (y > 0 && !core[p - W]) || (y < H - 1 && !core[p + W])) queue.push(p);
  }
  for (let qi = 0; qi < queue.length; qi++) {
    const p = queue[qi];
    const x = p % W, y = (p / W) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
      if (q >= 0 && !filled[q]) {
        filled[q] = 1;
        rgb[q * 3] = rgb[p * 3]; rgb[q * 3 + 1] = rgb[p * 3 + 1]; rgb[q * 3 + 2] = rgb[p * 3 + 2];
        queue.push(q);
      }
    }
  }
  // versão desfocada (cor "chapada" por vértice)
  const blurred = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).blur(9).raw().toBuffer();
  return { W, H, bg, fg, rgb, blurred };
}

function px(data, W, x, y) { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; }

/** cor (0..255) desfocada na posição (x,y) em pixels da arte */
export function sampleBlur(art, x, y) {
  const xi = Math.max(0, Math.min(art.W - 1, Math.round(x)));
  const yi = Math.max(0, Math.min(art.H - 1, Math.round(y)));
  const i = (yi * art.W + xi) * 3;
  return [art.blurred[i], art.blurred[i + 1], art.blurred[i + 2]];
}

/** cor média de uma janela [x0,y0,x1,y1] considerando só primeiro plano */
export function averageRegion(art, [x0, y0, x1, y1]) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.max(0, y0); y < Math.min(art.H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(art.W, x1); x++) {
    const i = y * art.W + x;
    if (!art.fg[i]) continue;
    r += art.rgb[i * 3]; g += art.rgb[i * 3 + 1]; b += art.rgb[i * 3 + 2]; n++;
  }
  return n ? [r / n, g / n, b / n] : [60, 60, 60];
}

export async function textureJpeg(art, quality = 90) {
  return sharp(art.rgb, { raw: { width: art.W, height: art.H, channels: 3 } }).jpeg({ quality, chromaSubsampling: '4:4:4' }).toBuffer();
}
