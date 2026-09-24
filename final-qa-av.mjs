/**
 * QA audiovisual + jogabilidade 2D em navegador (Playwright/Chromium, sem flag de autoplay):
 * título/menu, desbloqueio de áudio, cutscenes em engine (StageDirector: atores, legendas, pausa, replay, skip),
 * exploração (andar, hotspots, escolha), música/ambiência/voz por fase, save/reload, idioma, mute.
 * Requer `npm run dev` em :5173. Saída: final-qa-av-results.json + final-qa-av-shots/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// renderer=canvas: Canvas2D é ~2x mais rápido que WebGL por software em Chromium headless.
const BASE = 'http://localhost:5173/?renderer=canvas';
const OUT = path.join(process.cwd(), 'final-qa-av-shots');
const REPORT = path.join(process.cwd(), 'final-qa-av-results.json');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const checks = [];
const consoleErrors = [];
const requests = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
};
const anyHit = (re) => requests.some((r) => re.test(r.url) && (r.status === 200 || r.status === 206));

const exe = process.env.PW_EXECUTABLE_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const url = m.location()?.url ?? '';
  if (/favicon/.test(url)) return;
  consoleErrors.push(`console.error: ${m.text()} [${url}]`);
});
page.on('response', (res) => requests.push({ url: res.url(), status: res.status() }));
page.on('requestfailed', (req) => requests.push({ url: req.url(), status: 0 }));

const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const wait = (ms) => page.waitForTimeout(ms);
const state = () =>
  page.evaluate(() => {
    const g = window.__UR_GAME__;
    if (!g) return null;
    const active = g.scene.getScenes(true).map((s) => s.scene.key);
    const sounds = [];
    for (const s of g.sound.sounds) {
      try { sounds.push({ key: s.key.split('/').pop(), playing: s.isPlaying, volume: +s.volume.toFixed(3) }); } catch { /* som em destruição */ }
    }
    const scene = g.scene.getScenes(true)[0];
    const actors = scene ? scene.children.list.filter((c) => c.type === 'Container' && c.id).map((c) => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y), alpha: +c.alpha.toFixed(2) })) : [];
    const subtitles = g.scene.getScenes(true).flatMap((s) => s.children.list.filter((c) => c.type === 'Text' && c.depth === 1001).map((t) => t.text));
    const cut = g.scene.getScene('CutsceneScene');
    const stage = active.includes('CutsceneScene') && cut?.getDirectorState ? cut.getDirectorState() : 'none';
    const menuItems = active.includes('MenuScene') ? scene.children.list.filter((c) => c.type === 'Text' && c.input).length : 0;
    const panel = active.includes('StoryScene') ? scene.children.list.filter((c) => c.type === 'Container' && c.depth === 900).flatMap((c) => c.list.filter((o) => o.type === 'Text').map((o) => o.text)) : [];
    return { locked: g.sound.locked, active, sounds, actors, subtitles, stage, panel, menuItems };
  });
async function waitFor(pred, timeout = 12000, label = '') {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeout) {
    last = await state();
    if (last && pred(last)) return last;
    await wait(150);
  }
  console.log(`  (timeout esperando ${label}; estado: ${JSON.stringify(last?.active)})`);
  return last;
}
const inScene = (key) => (s) => s.active.includes(key);
const playing = (s, re) => s.sounds.some((x) => re.test(x.key) && x.playing);


/** Seleciona um item do menu pelo rótulo (independe de índice/presença de save). */
async function menuSelect(re) {
  await waitFor((x) => inScene('MenuScene')(x) && x.menuItems > 0, 8000, 'menu pronto');
  await wait(150);
  const pos = await page.evaluate((src) => {
    const m = window.__UR_GAME__.scene.getScene('MenuScene');
    const it = m.children.list.find((c) => c.type === 'Text' && c.input && new RegExp(src).test(c.text));
    return it ? { x: it.x + 10, y: it.y } : null;
  }, re.source);
  if (!pos) return false;
  await page.mouse.click(pos.x, pos.y);
  await wait(400);
  return true;
}

async function freshStart(query = '') {
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await wait(800);
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await waitFor(inScene('TitleScene'), 8000, 'TitleScene');
  await wait(600);
}
async function titleToMenu() {
  await page.mouse.click(640, 360);
  const s = await waitFor((x) => inScene('MenuScene')(x) && x.menuItems > 0 && playing(x, /bgm_menu_tema/), 8000, 'MenuScene pronto + música');
  await wait(300);
  return s;
}
async function newGameToIntro() {
  await page.keyboard.press('Enter');
  await waitFor(inScene('IntroScene'), 6000, 'IntroScene');
  await wait(300);
}

try {
  // ---------------------------------------------------------------- título, menu, áudio
  await freshStart();
  await shot('00-title');
  let st = await titleToMenu();
  check('1. título → menu: áudio desbloqueado no 1º clique e música do menu tocando (sem flag de autoplay)', st && !st.locked && playing(st, /bgm_menu_tema/), JSON.stringify(st?.sounds));
  await shot('01-menu');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  st = await waitFor((x) => inScene('MenuScene')(x), 4000, 'submenu');
  await wait(600);
  check('1b. menu: SFX de navegação requisitado', anyHit(/ui_(hover|click)\.(ogg|mp3)/));
  await shot('01b-menu-extras');
  await page.keyboard.press('Escape');
  await wait(700);

  // ---------------------------------------------------------------- cutscene de abertura (em engine)
  await newGameToIntro();
  await page.keyboard.press('Space');
  st = await waitFor((x) => inScene('CutsceneScene')(x) && x.stage === 'playing' && x.actors.some((a) => a.id === 'theo'), 12000, 'cutscene opening com Theo');
  check('2. cutscene opening: StageDirector tocando com Theo em cena', st?.active.includes('CutsceneScene') && st?.stage === 'playing' && st?.actors.some((a) => a.id === 'theo'), `${st?.active} ${JSON.stringify(st?.actors)}`);
  check('2b. cutscene: música e ambiência da cena', playing(st, /phase01_casa_medo/) && playing(st, /amb_house/), st?.sounds.filter((x) => x.playing).map((x) => x.key).join(','));
  const theoA = st?.actors.find((a) => a.id === 'theo');
  st = await waitFor((x) => x.subtitles.length > 0, 8000, 'legenda');
  check('2c. legenda sincronizada com a voz', (st?.subtitles ?? []).length > 0 && anyHit(/voice\/pt-BR\/(intro_text|phase01_intro)\.(ogg|mp3)/), (st?.subtitles ?? []).join(' | '));
  await wait(2500);
  st = await state();
  const theoB = st?.actors.find((a) => a.id === 'theo');
  check('2d. Theo se move durante a cutscene (animação em engine)', theoA && theoB && theoA.x !== theoB.x, `${JSON.stringify(theoA)} -> ${JSON.stringify(theoB)}`);
  await shot('02-cutscene-opening');
  await page.keyboard.press('P');
  await wait(500);
  const paused = await state();
  await page.keyboard.press('P');
  await wait(500);
  const resumed = await state();
  check('3. pausa (P) e retomada', paused?.stage === 'paused' && resumed?.stage === 'playing', `${paused?.stage} -> ${resumed?.stage}`);
  await page.keyboard.press('R');
  st = await waitFor((x) => inScene('CutsceneScene')(x) && x.stage === 'playing' && x.actors.some((a) => a.id === 'theo' && a.x < 300), 12000, 'replay');
  check('4. replay (R) reinicia a cutscene', st?.stage === 'playing' && st?.actors.some((a) => a.id === 'theo' && a.x < 300), JSON.stringify(st?.actors));
  await page.keyboard.press('Escape');
  st = await waitFor((x) => inScene('StoryScene')(x) && x.actors.some((a) => a.id === 'theo'), 12000, 'StoryScene');
  check('5. skip (Esc) leva à exploração da fase 1', st?.active.includes('StoryScene'), st?.active.join(','));

  // ---------------------------------------------------------------- exploração 2D
  st = await waitFor((x) => playing(x, /phase01_casa_medo/) && playing(x, /amb_house/), 8000, 'áudio fase 1');
  check('6. fase 1: música + ambiência da fase tocando', playing(st, /phase01_casa_medo/) && playing(st, /amb_house/), st?.sounds.filter((x) => x.playing).map((x) => x.key).join(','));
  st = await waitFor((x) => x.subtitles.length > 0, 8000, 'narração');
  check('6b. fase 1: narração com legenda', (st?.subtitles ?? []).length > 0 && anyHit(/voice\/pt-BR\/phase01_intro\.(ogg|mp3)/), (st?.subtitles ?? []).join('|'));
  const t0 = (await state())?.actors.find((a) => a.id === 'theo');
  await page.keyboard.down('ArrowRight');
  await wait(700);
  await page.keyboard.up('ArrowRight');
  await wait(150);
  const t1 = (await state())?.actors.find((a) => a.id === 'theo');
  check('7. Theo anda com as setas', t0 && t1 && t1.x > t0.x + 40, `${JSON.stringify(t0)} -> ${JSON.stringify(t1)}`);
  check('7b. passos com SFX', anyHit(/sfx_step_wood\.(ogg|mp3)/));
  await page.mouse.click(470, 600);
  st = await waitFor((x) => x.panel.length > 0, 8000, 'painel do hotspot');
  check('8. hotspot "Casaco da mãe": Theo vai até o objeto e abre o painel', (st?.panel ?? []).some((t) => /Casaco/.test(t)), (st?.panel ?? []).join(' | '));
  await shot('03-explore-hotspot');
  await page.keyboard.press('Escape');
  await wait(300);
  await page.mouse.click(1180, 440);
  st = await waitFor((x) => x.panel.some((t) => /Garagem/.test(t)), 8000, 'painel Garagem');
  check('8b. escolha "Garagem" como lugar na cena', (st?.panel ?? []).some((t) => /Garagem/.test(t)), (st?.panel ?? []).join(' | '));
  await shot('04-explore-choice');
  await page.keyboard.press('Escape');
  await wait(200);
  await page.keyboard.press('2');
  st = await waitFor((x) => inScene('ChoiceScene')(x), 8000, 'ChoiceScene');
  await wait(1500);
  check('9. investigar (tecla 2): consequência narrada + SFX de pista', st?.active.includes('ChoiceScene') && anyHit(/phase01_choice_b\.(ogg|mp3)/) && anyHit(/sfx_clue_found\.(ogg|mp3)/), st?.active.join(','));
  await page.keyboard.press('Enter');
  await wait(2600);
  check('9b. cliffhanger: sting + voz', anyHit(/sfx_suspense_sting\.(ogg|mp3)/) && anyHit(/phase01_cliffhanger\.(ogg|mp3)/));
  await page.keyboard.press('Enter');
  st = await waitFor((x) => inScene('CutsceneScene')(x) && x.actors.some((a) => a.id === 'clara'), 12000, 'parents_gone');
  check('10. cutscene parents_gone antes da fase 2 (Clara em cena)', st?.active.includes('CutsceneScene') && st?.actors.some((a) => a.id === 'clara'), `${st?.active} ${JSON.stringify(st?.actors)}`);
  await shot('05-cutscene-parents-gone');
  await page.keyboard.press('Escape');
  st = await waitFor((x) => inScene('StoryScene')(x) && playing(x, /phase02_igreja/) && playing(x, /amb_church/), 15000, 'fase 2');
  check('10b. fase 2 com música/ambiência próprias', playing(st, /phase02_igreja/) && playing(st, /amb_church/), st?.sounds.filter((x) => x.playing).map((x) => x.key).join(','));

  // ---------------------------------------------------------------- save/reload
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitFor(inScene('TitleScene'), 8000, 'title');
  await wait(600);
  await titleToMenu();
  const hadContinue = await menuSelect(/CONTINUAR|CONTINUE/);
  check('11a. menu mostra CONTINUAR com save', hadContinue);
  st = await waitFor((x) => inScene('StoryScene')(x) && x.actors.some((a) => a.id === 'theo') && playing(x, /phase02_igreja/), 15000, 'continuar');
  check('11. save/reload: CONTINUAR retoma a fase 2 com Theo e áudio', st?.active.includes('StoryScene') && st?.actors.some((a) => a.id === 'theo') && playing(st, /phase02_igreja/), `${st?.active} ${st?.sounds.filter((x) => x.playing).map((x) => x.key).join(',')}`);

  // ---------------------------------------------------------------- idioma en-US + final via EXTRAS > TESTAR FINAL
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitFor(inScene('TitleScene'), 8000, 'title');
  await wait(600);
  await titleToMenu();
  await menuSelect(/OPÇÕES|OPTIONS|OPCIONES/);
  await menuSelect(/IDIOMA|LANGUAGE/); // pt-BR → en-US
  await wait(300);
  const lang = await page.evaluate(() => { const m = window.__UR_GAME__.scene.getScene('MenuScene'); return m.children.list.filter((c) => c.type === 'Text').map((t) => t.text).find((t) => /LANGUAGE|IDIOMA/.test(t)); });
  check('12. idioma alterna para en-US no menu de opções', /en-US/.test(lang ?? ''), lang);
  await page.keyboard.press('Escape');
  await menuSelect(/EXTRAS/);
  await menuSelect(/TESTAR FINAL|TEST ENDING|PROBAR FINAL/);
  st = await waitFor(inScene('EndingTestScene'), 8000, 'EndingTestScene');
  const goodBtn = await page.evaluate(() => { const s = window.__UR_GAME__.scene.getScene('EndingTestScene'); const b = s.children.list.find((c) => c.type === 'Text' && c.input && /GOOD/i.test(c.text)); return b ? { x: b.x, y: b.y } : null; });
  if (goodBtn) await page.mouse.click(goodBtn.x, goodBtn.y);
  st = await waitFor((x) => inScene('CutsceneScene')(x) && x.subtitles.length > 0, 15000, 'ending_good cutscene');
  check('12b. final bom: cutscene em engine com voz e legenda em inglês', st?.active.includes('CutsceneScene') && anyHit(/voice\/en-US\/ending_good\.(ogg|mp3)/) && (st?.subtitles ?? []).some((t) => /You did not only find/.test(t)), (st?.subtitles ?? []).join('|'));
  await shot('06-ending-good-en');
  await page.keyboard.press('Escape');
  st = await waitFor((x) => inScene('EndingScene')(x) && playing(x, /bgm_final_bom/), 12000, 'EndingScene');
  check('13. EndingScene após a cutscene: música do final', playing(st, /bgm_final_bom/), st?.sounds.filter((x) => x.playing).map((x) => x.key).join(','));

  // ---------------------------------------------------------------- mute via OPÇÕES > ÁUDIO
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitFor(inScene('TitleScene'), 8000, 'title');
  await wait(600);
  await titleToMenu();
  await wait(1800); // fim do fade-in da música
  await menuSelect(/OPÇÕES|OPTIONS|OPCIONES/);
  await menuSelect(/ÁUDIO|AUDIO/);
  st = await waitFor(inScene('SettingsScene'), 8000, 'SettingsScene');
  const muteBtn = await page.evaluate(() => { const s = window.__UR_GAME__.scene.getScene('SettingsScene'); const b = s.children.list.find((c) => c.type === 'Text' && c.input && /Silenciado|Muted|Silenciado/i.test(c.text)); return b ? { x: b.x, y: b.y } : null; });
  if (muteBtn) await page.mouse.click(muteBtn.x + 40, muteBtn.y + 10);
  await wait(1200);
  st = await state();
  const music = st?.sounds.find((x) => /bgm_menu_tema/.test(x.key));
  check('14. mute: volume da música vai a 0', music && music.volume === 0, JSON.stringify(music));
  const muteBtn2 = await page.evaluate(() => { const s = window.__UR_GAME__.scene.getScene('SettingsScene'); const b = s.children.list.find((c) => c.type === 'Text' && c.input && /Silenciado|Muted/i.test(c.text)); return b ? { x: b.x, y: b.y } : null; });
  if (muteBtn2) await page.mouse.click(muteBtn2.x + 40, muteBtn2.y + 10);
  await wait(1200);
  st = await state();
  const music2 = st?.sounds.find((x) => /bgm_menu_tema/.test(x.key));
  check('14b. unmute: volume restaurado', music2 && music2.volume > 0, JSON.stringify(music2));
  await shot('07-settings-audio');

  const failed = requests.filter((r) => r.status >= 400 && !/favicon/.test(r.url));
  check('15. rede: nenhum asset 404', failed.length === 0, failed.slice(0, 6).map((r) => `${r.status} ${r.url}`).join(' | '));
  check('16. runtime não chama ComfyUI', !requests.some((r) => /8188/.test(r.url)));
  const realErrors = consoleErrors.filter((e) => !/Autoplay|play\(\) failed|AudioContext/.test(e));
  check('17. console sem erros', realErrors.length === 0, realErrors.slice(0, 5).join(' | '));
} catch (err) {
  check('QA-AV script crash', false, String(err));
}
await browser.close();
const summary = { pass: checks.filter((c) => c.ok).length, fail: checks.filter((c) => !c.ok).length, total: checks.length, checks, consoleErrors };
fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
console.log(`\nSUMMARY: ${summary.pass} pass / ${summary.fail} fail of ${summary.total}`);
process.exit(summary.fail ? 1 : 0);
