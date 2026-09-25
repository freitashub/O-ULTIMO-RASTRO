/**
 * QA da vertical slice espacial (Fase 1) em Chromium real (WebGL via Playwright):
 *   CUTSCENE 01 (vídeo externo interceptado + em engine) → GARAGEM 3D → mover Theo → colidir com parede
 *   → contornar a estante → oclusão real → aproximar/raycast → interagir → pista → escolha → CUTSCENE 02
 *   + save/load, console, rede.
 * Requer `npm run dev` em :5173. Saída: qa-spatial-results.json + qa-spatial-shots/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5173/';
const OUT = path.join(process.cwd(), 'qa-spatial-shots');
const REPORT = path.join(process.cwd(), 'qa-spatial-results.json');
const FIXTURE = fs.readFileSync(path.join(process.cwd(), 'tests/fixtures/cutscene-fixture.webm'));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const checks = [];
const consoleErrors = [];
const requests = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
};
const sent = [];
const anyHit = (re) => requests.some((r) => re.test(r.url) && (r.status === 200 || r.status === 206)) || sent.some((u) => re.test(u));

const exe = process.env.PW_EXECUTABLE_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text()} [${m.location()?.url ?? ''}]`);
});
page.on('response', (res) => requests.push({ url: res.url(), status: res.status() }));
page.on('request', (req) => sent.push(req.url()));
page.on('requestfailed', (req) => requests.push({ url: req.url(), status: 0, failure: req.failure()?.errorText }));

const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const state = () =>
  page.evaluate(() => {
    const g = window.__UR_GAME__;
    if (!g) return null;
    const active = g.scene.getScenes(true).map((s) => s.scene.key);
    const sp = g.scene.getScene('SpatialScene');
    const cut = g.scene.getScene('CutsceneScene');
    const subtitles = g.scene.getScenes(true).flatMap((s) => s.children.list.filter((c) => c.type === 'Text' && c.depth === 1001).map((t) => t.text));
    return {
      active,
      spatial: active.includes('SpatialScene') ? sp.getDebugState() : null,
      cutMode: active.includes('CutsceneScene') ? cut.getMode() : null,
      cutState: active.includes('CutsceneScene') ? cut.getDirectorState() : null,
      videos: active.includes('CutsceneScene') ? cut.children.list.filter((c) => c.type === 'Video').length : 0,
      subtitles
    };
  });
async function waitFor(pred, timeout = 15000, label = '') {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeout) {
    last = await state();
    if (last && pred(last)) return last;
    await wait(150);
  }
  console.log(`  (timeout: ${label}; ativo=${JSON.stringify(last?.active)})`);
  return last;
}
const theo = async () => (await state())?.spatial?.theo;
const project = (x, y, z) => page.evaluate(([a, b, c]) => window.__UR_GAME__.scene.getScene('SpatialScene').debugProject(a, b, c), [x, y, z]);
const onScreen = (p) => p && p.x > 20 && p.x < 1260 && p.y > 80 && p.y < 680;
/**
 * Clique real no piso (ponto do mundo projetado na tela) e espera o Theo chegar/parar.
 * Se o destino estiver fora do quadro da câmera atual, anda antes até um ponto intermediário visível.
 */
async function clickFloor(x, z, label, depth = 0) {
  let p = await project(x, 0, z);
  if (!onScreen(p) && depth < 3) {
    const t = await theo();
    const mid = await clickFloor(+((t.x + x) / 2).toFixed(2), +((t.z + z) / 2).toFixed(2), `${label} (intermediário)`, depth + 1);
    const r = await clickFloor(x, z, label, depth + 1);
    return { t: r.t, camChanged: mid.camChanged || r.camChanged };
  }
  await page.mouse.click(p.x, p.y);
  let prev = null;
  let camChanged = false;
  let startCam = (await state())?.spatial?.camera;
  for (let i = 0; i < 60; i++) {
    await wait(150);
    const s = (await state())?.spatial;
    if (s?.camera !== startCam) camChanged = true;
    const t = s?.theo;
    if (!t) break;
    if (prev && Math.hypot(t.x - prev.x, t.z - prev.z) < 0.005 && t.speed === 0) break;
    prev = t;
  }
  const t = await theo();
  console.log(`  clique ${label} (${x}, ${z}) → Theo (${t?.x}, ${t?.z})`);
  return { t, camChanged };
}
async function freshStart() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(600);
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('ultimo_rastro'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitFor((s) => s.active.includes('TitleScene'), 8000, 'título');
  await wait(500);
  await page.mouse.click(640, 360);
  await waitFor((s) => s.active.includes('MenuScene'), 8000, 'menu');
  await wait(700);
}

// vídeos externos simulados: manifest ganha /cutscenes/opening.webm e parents_gone.webm (+ sidecar de legendas)
async function routeExternalCutscenes() {
  await page.route('**/data/assets-manifest.json', async (route) => {
    const res = await route.fetch();
    const json = await res.json();
    const extra = ['/cutscenes/opening.webm', '/cutscenes/opening.cues.json', '/cutscenes/parents_gone.webm'];
    json.video = [...(json.video ?? []), '/cutscenes/opening.webm', '/cutscenes/parents_gone.webm'];
    json.all = [...(json.all ?? []), ...extra];
    await route.fulfill({ response: res, json });
  });
  await page.route('**/cutscenes/*.webm', (route) => route.fulfill({ status: 200, contentType: 'video/webm', body: FIXTURE }));
  await page.route('**/cutscenes/opening.cues.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cues: [{ startMs: 200, endMs: 3600, voice: 'intro_text' }] }) })
  );
}

try {
  // ============================================================ A. vídeo externo → gameplay 3D
  await routeExternalCutscenes();
  await freshStart();
  await page.keyboard.press('Enter'); // NOVO JOGO
  await waitFor((s) => s.active.includes('IntroScene'), 6000, 'intro');
  await wait(300);
  await page.keyboard.press('Space');
  let st = await waitFor((s) => s.active.includes('CutsceneScene') && s.cutMode === 'video' && s.videos > 0, 15000, 'cutscene em vídeo');
  check('1. CUTSCENE 01: vídeo externo (/cutscenes/opening.webm) tocando no CutsceneScene', st?.cutMode === 'video' && st?.videos > 0 && anyHit(/cutscenes\/opening\.webm/), `mode=${st?.cutMode} state=${st?.cutState}`);
  st = await waitFor((s) => s.subtitles.length > 0, 6000, 'legenda do vídeo');
  check('1b. legenda fora do vídeo (SubtitleRenderer + sidecar .cues.json)', (st?.subtitles ?? []).some((t) => /Theo chega em casa/.test(t)), (st?.subtitles ?? []).join(' | '));
  await shot('01-cutscene-video');
  await page.keyboard.press('P');
  await wait(400);
  const pausedState = (await state())?.cutState;
  await page.keyboard.press('P');
  check('1c. pausa/retomada do vídeo (P)', pausedState === 'paused', pausedState);
  st = await waitFor((s) => s.active.includes('SpatialScene') && s.spatial?.ready, 25000, 'fim do vídeo → gameplay');
  check('2. transição vídeo → gameplay 3D (fim do vídeo abre a garagem)', st?.active.includes('SpatialScene') && st?.spatial?.ready, st?.active.join(','));

  // ============================================================ B. mundo espacial
  const s0 = st.spatial;
  check('3. cena espacial real (Babylon): piso, paredes, objetos (meshes ≥ 40)', s0.meshes >= 40, `meshes=${s0.meshes}`);
  check('4. Theo carregado de GLB (glTF) com posição 3D', s0.modelSource === 'glb' && typeof s0.theo.x === 'number' && s0.theo.y === 0, JSON.stringify(s0.theo));
  check('4b. modelo /assets/models/theo.glb requisitado', anyHit(/assets\/models\/theo\.glb/));
  check('5. câmera fixa ativa observando o ambiente', /^cam_/.test(s0.camera), s0.camera);
  await wait(800);
  await shot('02-garagem');

  // movimento por input real (teclado) + colisão com parede
  const t0 = await theo();
  await page.keyboard.down('ArrowRight');
  await waitFor((s) => (s.spatial?.theo?.touching ?? []).some((h) => /^wall_/.test(h)), 4000, 'encostar na parede');
  const tMid = await theo();
  await wait(400);
  const tHold = await theo();
  await page.keyboard.up('ArrowRight');
  await wait(300);
  const t1 = await theo();
  check('6. Theo se move por input de teclado (setas)', Math.hypot(t1.x - t0.x, t1.z - t0.z) > 0.4, `${JSON.stringify(t0)} → ${JSON.stringify(t1)}`);
  const wallId = tMid.touching.find((h) => /^wall_/.test(h));
  const wallAxisStable = wallId === 'wall_w' || wallId === 'wall_e' ? Math.abs(tHold.x - tMid.x) < 0.02 : Math.abs(tHold.z - tMid.z) < 0.02;
  check('7. Theo colide com a parede (continua pressionando e não atravessa)', !!wallId && wallAxisStable && tHold.x > -5 && tHold.x < 5 && tHold.z > -4 && tHold.z < 4, `parede=${wallId} (${tMid.x},${tMid.z}) → (${tHold.x},${tHold.z})`);
  check('7b. aceleração/desaceleração (velocidade volta a 0 ao soltar)', t1.speed === 0, `speed=${t1.speed}`);
  await shot('03-parede');

  // contornar a estante: sul → leste → norte (clique no piso = input real do mouse)
  // estante: x 0.2..2.2, z 2.55..3.15 (perto da parede sul). Rota: ponta oeste → corredor de trás → ponta leste
  await clickFloor(-3.5, 0.5, 'centro-oeste');
  const r0 = await clickFloor(-0.6, 2.4, 'frente da ponta oeste');
  const r1 = await clickFloor(-0.6, 3.6, 'corredor de trás (oeste)');
  const r2a = await clickFloor(1.2, 3.6, 'atrás da estante (meio)');
  const r2 = await clickFloor(2.8, 3.6, 'atrás da estante (leste)');
  const r3 = await clickFloor(3.0, 2.3, 'sai pela ponta leste');
  const tAround = r3.t;
  check('8. contorna a estante (frente → trás → ponta leste) sem atravessá-la', r0.t.x < -0.3 && r1.t.z > 3.3 && r2.t.x > 2.46 && r2.t.z > 3.3 && tAround.x > 2.7 && tAround.z < 2.5, `oeste=(${r0.t.x},${r0.t.z}) trás=(${r1.t.x},${r1.t.z}) trás-leste=(${r2.t.x},${r2.t.z}) fim=(${tAround.x},${tAround.z})`);
  check('8b. câmera troca de enquadramento ao atravessar a garagem (transição suave)', r0.camChanged || r1.camChanged || r2a.camChanged || r2.camChanged || r3.camChanged);
  st = await state();
  check('9. oclusão real: a estante fica entre a câmera e o Theo', st.spatial.occludedBy === 'shelf', `occludedBy=${st.spatial.occludedBy} cam=${st.spatial.camera}`);
  await shot('04-oclusao-estante');

  // save/load no meio da fase
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitFor((s) => s.active.includes('TitleScene'), 8000, 'título');
  await wait(400);
  await page.mouse.click(640, 360);
  await waitFor((s) => s.active.includes('MenuScene'), 8000, 'menu');
  await wait(800);
  const cont = await page.evaluate(() => { const m = window.__UR_GAME__.scene.getScene('MenuScene'); const b = m.children.list.find((c) => c.type === 'Text' && c.input && /CONTINUAR|CONTINUE/.test(c.text)); return b ? { x: b.x + 10, y: b.y } : null; });
  if (cont) await page.mouse.click(cont.x, cont.y);
  st = await waitFor((s) => s.active.includes('SpatialScene') && s.spatial?.ready, 20000, 'continuar → garagem');
  check('10. save/load: CONTINUAR reabre a garagem 3D (fase 1)', !!cont && st?.active.includes('SpatialScene') && st?.spatial?.ready, st?.active.join(','));

  // aproximar da marca de pneu (raycast de linha de visão) e interagir
  await clickFloor(-3.5, -0.6, 'saída da porta');
  await clickFloor(2.3, -0.4, 'marca de pneu');
  st = await waitFor((s) => s.spatial?.focus === 'tire', 5000, 'foco na marca de pneu');
  check('11. interação por proximidade + raycast: foco na marca de pneu', st?.spatial?.focus === 'tire', `focus=${st?.spatial?.focus}`);
  await shot('05-foco-pista');
  await page.keyboard.press('e');
  st = await waitFor((s) => (s.spatial?.panel ?? []).length > 0, 4000, 'painel');
  check('12. interagir (E): Theo reage e abre o painel da escolha "Garagem"', (st?.spatial?.panel ?? []).some((t) => /Garagem/.test(t)), (st?.spatial?.panel ?? []).join(' | '));
  const iconLoaded = await page.waitForFunction(() => window.__UR_GAME__.textures.exists('/images/clues/tire_mark.png'), null, { timeout: 5000 }).then(() => true, () => false);
  check('12b. ícone da pista carregado no painel', iconLoaded && anyHit(/images\/clues\/tire_mark\.png/));
  await shot('06-painel-escolha');
  const btn = await page.evaluate(() => { const s = window.__UR_GAME__.scene.getScene('SpatialScene'); const c = s.children.list.find((o) => o.type === 'Container' && o.depth === 900); const b = c?.list.find((o) => o.type === 'Text' && /INVESTIGAR|INVESTIGATE/.test(o.text)); return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; });
  if (btn) await page.mouse.click(btn.x, btn.y);
  st = await waitFor((s) => s.active.includes('ChoiceScene'), 6000, 'ChoiceScene');
  await wait(1500);
  check('13. escolha feita na cena 3D → consequência narrada', st?.active.includes('ChoiceScene') && anyHit(/phase01_choice_b\.(ogg|mp3)/), st?.active.join(','));
  const saved = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('ultimo_rastro'); r.onsuccess = () => { const db = r.result; const g = db.transaction('saves').objectStore('saves').get('current'); g.onsuccess = () => { db.close(); res(g.result); }; }; }));
  check('14. pista encontrada e salva (tire_mark)', saved?.clues?.includes('tire_mark') && saved?.choices?.['1'] === 'b', JSON.stringify({ clues: saved?.clues, choices: saved?.choices }));
  await page.keyboard.press('Enter'); // pula revelação
  await wait(2600);
  await page.keyboard.press('Enter'); // cliffhanger → próxima
  st = await waitFor((s) => s.active.includes('CutsceneScene') && s.cutMode === 'video', 12000, 'CUTSCENE 02');
  const videoSrc = await page.evaluate(() => { const c = window.__UR_GAME__.scene.getScene('CutsceneScene'); const v = c.children.list.find((o) => o.type === 'Video'); return v?.video?.currentSrc ?? v?.video?.src ?? ''; });
  check('15. transição gameplay → CUTSCENE 02 (vídeo externo parents_gone)', st?.cutMode === 'video' && (/parents_gone/.test(videoSrc) || anyHit(/cutscenes\/parents_gone\.webm/)), `mode=${st?.cutMode} src=${videoSrc.slice(-40)}`);
  await shot('07-cutscene-02');
  await page.keyboard.press('Escape');
  st = await waitFor((s) => s.active.includes('StoryScene'), 12000, 'fase 2');
  check('15b. após a CUTSCENE 02: fase 2 (runtime 2D preservado)', st?.active.includes('StoryScene'), st?.active.join(','));
  check('16. canvas 3D descartado ao sair da slice (sem vazamento)', await page.evaluate(() => !document.getElementById('spatial-canvas')));

  // ============================================================ C. sem vídeo: cutscene em engine → 3D
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await freshStart();
  await page.keyboard.press('Enter');
  await waitFor((s) => s.active.includes('IntroScene'), 6000, 'intro');
  await wait(300);
  await page.keyboard.press('Space');
  st = await waitFor((s) => s.active.includes('CutsceneScene') && s.cutMode === 'stage', 12000, 'cutscene em engine');
  check('17. sem arquivo do Google Flow: cutscene em engine (fallback) toca', st?.cutMode === 'stage', `mode=${st?.cutMode}`);
  await wait(2500);
  await page.keyboard.press('Escape');
  st = await waitFor((s) => s.active.includes('SpatialScene') && s.spatial?.ready, 20000, 'garagem');
  check('17b. cutscene em engine → garagem 3D', st?.spatial?.ready, st?.active.join(','));

  // ============================================================ D. rede / console
  const failed = requests.filter((r) => r.status >= 400 || (r.status === 0 && !/ERR_ABORTED/.test(r.failure ?? '')));
  check('18. nenhum 404/erro de rede', failed.length === 0, failed.slice(0, 6).map((r) => `${r.status} ${r.url}`).join(' | '));
  check('19. runtime não chama ComfyUI/MCP', !requests.some((r) => /:8188|mcp/i.test(r.url)));
  check('20. console sem erros', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
} catch (err) {
  check('QA spatial crash', false, String(err?.stack ?? err));
}
await browser.close();
const summary = { pass: checks.filter((c) => c.ok).length, fail: checks.filter((c) => !c.ok).length, total: checks.length, checks, consoleErrors };
fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
console.log(`\nSUMMARY: ${summary.pass} pass / ${summary.fail} fail of ${summary.total}`);
process.exit(summary.fail ? 1 : 0);
