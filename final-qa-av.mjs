/**
 * QA audiovisual em navegador (Playwright/Chromium): cutscenes (vídeo + legendas + skip/pausa/replay),
 * música/ambiência/voz por fase, SFX de UI, idioma (vídeo localizado), mute/volume e save/reload.
 * Requer `npm run dev` em :5173. Saída: final-qa-av-results.json + final-qa-av-shots/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5173/';
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
const hit = (re) => requests.filter((r) => re.test(r.url) && r.status === 200 || (re.test(r.url) && r.status === 206));
const anyHit = (re) => hit(re).length > 0;

// Chromium: usa PW_EXECUTABLE_PATH ou o binário pré-instalado do ambiente, se existir; senão o padrão do Playwright.
const exe = process.env.PW_EXECUTABLE_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const url = m.location()?.url ?? '';
  if (/favicon/.test(url)) return; // favicon ausente não é erro do jogo
  consoleErrors.push(`console.error: ${m.text()} [${url}]`);
});
page.on('response', (res) => requests.push({ url: res.url(), status: res.status() }));
page.on('requestfailed', (req) => requests.push({ url: req.url(), status: 0 }));

const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const wait = (ms) => page.waitForTimeout(ms);
const gameState = () => page.evaluate(() => {
  const game = window.__UR_GAME__;
  if (!game) return null;
  const active = game.scene.getScenes(true).map((s) => s.scene.key);
  const sounds = game.sound.sounds.map((s) => ({ key: s.key, playing: s.isPlaying, paused: s.isPaused, loop: s.loop, volume: s.volume }));
  const videos = game.scene.getScenes(true).flatMap((s) => s.children.list.filter((c) => c.type === 'Video').map((v) => ({ key: v.cacheKey ?? v._cacheKey, playing: v.isPlaying(), t: v.getCurrentTime(), paused: v.isPaused?.() })));
  const subtitles = game.scene.getScenes(true).flatMap((s) => s.children.list.filter((c) => c.type === 'Text' && c.depth === 1001).map((t) => t.text));
  return { active, sounds, videos, subtitles };
});

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await page.mouse.click(640, 360); // title -> menu (gesto de usuário desbloqueia áudio)
  await wait(1500);
  let st = await gameState();
  check('1. menu: música do menu tocando', st?.sounds.some((s) => /bgm_menu_tema/.test(s.key) && s.playing), JSON.stringify(st?.sounds.map((s) => s.key)));
  check('1b. menu: música requisitada (HTTP 200/206)', anyHit(/bgm_menu_tema\.(ogg|mp3)/));

  // NOVO JOGO -> Intro -> cutscene 'opening' (vídeo)
  await page.keyboard.press('Enter');
  await wait(800);
  check('2. sfx ui_click requisitado', anyHit(/ui_click\.(ogg|mp3)/));
  await page.keyboard.press('Space'); // intro -> cutscene
  await wait(4000);
  st = await gameState();
  check('3. cutscene opening: CutsceneScene ativa', st?.active.includes('CutsceneScene'), st?.active.join(','));
  check('3b. cutscene opening: vídeo webm requisitado', anyHit(/cutscenes\/opening\.webm/));
  check('3c. cutscene opening: objeto Video tocando', st?.videos.some((v) => v.playing), JSON.stringify(st?.videos));
  await wait(3000);
  st = await gameState();
  check('4. legenda sincronizada visível durante o vídeo', (st?.subtitles ?? []).length > 0, (st?.subtitles ?? []).join(' | '));
  await shot('01-cutscene-opening');
  // pausa / retomada
  await page.keyboard.press('P');
  await wait(800);
  const paused = await gameState();
  await page.keyboard.press('P');
  await wait(1200);
  const resumed = await gameState();
  check('5. pausa (P) pausa o vídeo e retoma', paused?.videos.some((v) => !v.playing || v.paused) && resumed?.videos.some((v) => v.playing), `paused=${JSON.stringify(paused?.videos)} resumed=${JSON.stringify(resumed?.videos)}`);
  // replay
  await page.keyboard.press('R');
  await wait(2500);
  st = await gameState();
  check('6. replay (R) reinicia a cutscene', st?.active.includes('CutsceneScene') && st?.videos.some((v) => v.t < 6), JSON.stringify(st?.videos));
  // skip
  await page.keyboard.press('Escape');
  await wait(1500);
  st = await gameState();
  check('7. skip (Esc) leva à StoryScene fase 1', st?.active.includes('StoryScene'), st?.active.join(','));
  check('7b. vídeo destruído após skip', (st?.videos ?? []).length === 0);
  await wait(2500);
  st = await gameState();
  check('8. fase 1: música da fase tocando', st?.sounds.some((s) => /phase01_casa_medo/.test(s.key) && s.playing), st?.sounds.map((s) => s.key).join(','));
  check('8b. fase 1: ambiência tocando', st?.sounds.some((s) => /amb_house/.test(s.key) && s.playing));
  check('8c. fase 1: narração (voz) requisitada', anyHit(/voice\/pt-BR\/phase01_intro\.(ogg|mp3)/));
  check('8d. fase 1: legenda da narração visível', (st?.subtitles ?? []).some((t) => /Theo chega em casa/.test(t)), (st?.subtitles ?? []).join('|'));
  await shot('02-story-phase1-audio');

  // escolha -> consequência (voz) -> cliffhanger -> cutscene parents_gone
  await page.keyboard.press('Enter'); // story -> choice
  await wait(1200);
  await page.keyboard.press('2'); // garagem (correta)
  await wait(1500);
  check('9. escolha: sfx de confirmação + pista', anyHit(/ui_confirm\.(ogg|mp3)/) && anyHit(/sfx_clue_found\.(ogg|mp3)/));
  check('9b. consequência narrada (voz choice_b)', anyHit(/phase01_choice_b\.(ogg|mp3)/));
  await page.keyboard.press('Enter'); // pula revelação
  await wait(2600);
  check('9c. cliffhanger: sting + voz', anyHit(/sfx_suspense_sting\.(ogg|mp3)/) && anyHit(/phase01_cliffhanger\.(ogg|mp3)/));
  await page.keyboard.press('Enter'); // -> cutscene parents_gone
  await wait(3500);
  st = await gameState();
  check('10. cutscene parents_gone dispara antes da fase 2', st?.active.includes('CutsceneScene') && anyHit(/cutscenes\/parents_gone\.webm/), st?.active.join(','));
  await shot('03-cutscene-parents-gone');
  await page.keyboard.press('Escape');
  await wait(2500);
  st = await gameState();
  check('10b. fase 2 com música/ambiência próprias', st?.sounds.some((s) => /phase02_igreja/.test(s.key) && s.playing) && st?.sounds.some((s) => /amb_church/.test(s.key)), st?.sounds.map((s) => s.key).join(','));

  // save/reload: continuar mantém fase 2 e não repete cutscene já vista
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.mouse.click(640, 360);
  await wait(1200);
  await page.keyboard.press('ArrowDown'); // CONTINUAR
  await page.keyboard.press('Enter');
  await wait(3000);
  st = await gameState();
  check('11. save/reload: CONTINUAR volta à StoryScene com áudio', st?.active.includes('StoryScene') && st?.sounds.some((s) => s.playing), st?.active.join(','));

  // idioma en-US: cutscene de final localizada + voz en-US
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.mouse.click(640, 360);
  await wait(1000);
  const menuButtons = await page.evaluate(() => {
    const game = window.__UR_GAME__;
    const menu = game.scene.getScene('MenuScene');
    return menu.children.list.filter((c) => c.type === 'Text' && c.input).map((t) => ({ text: t.text, x: t.x, y: t.y }));
  });
  const langBtn = menuButtons.find((b) => /IDIOMA|LANGUAGE|IDIOMA/.test(b.text));
  if (langBtn) { await page.mouse.click(langBtn.x, langBtn.y); await wait(900); }
  const testBtn = (await page.evaluate(() => {
    const game = window.__UR_GAME__;
    const menu = game.scene.getScene('MenuScene');
    return menu.children.list.filter((c) => c.type === 'Text' && c.input).map((t) => ({ text: t.text, x: t.x, y: t.y }));
  })).find((b) => /TEST|TESTAR|PROBAR/.test(b.text));
  if (testBtn) { await page.mouse.click(testBtn.x, testBtn.y); await wait(1200); }
  const fireBtn = (await page.evaluate(() => {
    const game = window.__UR_GAME__;
    const s = game.scene.getScene('EndingTestScene');
    return s.children.list.filter((c) => c.type === 'Text' && c.input).map((t) => ({ text: t.text, x: t.x, y: t.y }));
  })).find((b) => /GOOD|BOM|BUENO/i.test(b.text));
  if (fireBtn) { await page.mouse.click(fireBtn.x, fireBtn.y); await wait(3500); }
  st = await gameState();
  check('12. idioma en-US: cutscene de final localizada (ending_good.en-US.webm)', anyHit(/ending_good\.en-US\.webm/), st?.active.join(','));
  check('12b. legenda do final em inglês', (st?.subtitles ?? []).some((t) => /You did not only find/.test(t)), (st?.subtitles ?? []).join('|'));
  await shot('04-ending-good-en');
  await page.keyboard.press('Escape');
  await wait(2500);
  st = await gameState();
  check('13. EndingScene após cutscene: música + voz do final', st?.active.includes('EndingScene') && st?.sounds.some((s) => /bgm_final_bom/.test(s.key)) && anyHit(/voice\/en-US\/ending_good\.(ogg|mp3)/), st?.sounds.map((s) => s.key).join(','));

  // mute via settings
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.mouse.click(640, 360);
  await wait(1200);
  const audioBtn = (await page.evaluate(() => {
    const game = window.__UR_GAME__;
    const menu = game.scene.getScene('MenuScene');
    return menu.children.list.filter((c) => c.type === 'Text' && c.input).map((t) => ({ text: t.text, x: t.x, y: t.y }));
  })).find((b) => /ÁUDIO|AUDIO/i.test(b.text));
  if (audioBtn) { await page.mouse.click(audioBtn.x, audioBtn.y); await wait(900); }
  const muteBtn = (await page.evaluate(() => {
    const game = window.__UR_GAME__;
    const s = game.scene.getScene('SettingsScene');
    return s.children.list.filter((c) => c.type === 'Text' && c.input).map((t) => ({ text: t.text, x: t.x, y: t.y }));
  })).find((b) => /Silenciado|Muted|Silenciado/i.test(b.text));
  if (muteBtn) { await page.mouse.click(muteBtn.x + 40, muteBtn.y + 10); await wait(900); }
  st = await gameState();
  const music = st?.sounds.find((s) => /bgm_menu_tema/.test(s.key));
  check('14. mute: volume da música vai a 0', music && music.volume === 0, JSON.stringify(music));
  if (muteBtn) { await page.mouse.click(muteBtn.x + 40, muteBtn.y + 10); await wait(900); }
  st = await gameState();
  const music2 = st?.sounds.find((s) => /bgm_menu_tema/.test(s.key));
  check('14b. unmute: volume restaurado', music2 && music2.volume > 0, JSON.stringify(music2));
  await shot('05-settings-audio');

  const errorsBeforeFallbackTest = consoleErrors.length;
  // fallback sem vídeo: simulamos falha de rede bloqueando os arquivos de vídeo
  await page.route(/cutscenes\/.*\.(webm|mp4)/, (route) => route.abort());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await page.mouse.click(640, 360);
  await wait(1200);
  await page.keyboard.press('Enter');
  await wait(800);
  await page.keyboard.press('Space');
  await wait(5000);
  st = await gameState();
  check('15. fallback sem vídeo: cutscene em passos (voz + legenda + música)', st?.active.includes('CutsceneScene') && (st?.videos ?? []).length === 0 && st?.sounds.some((s) => /phase01_casa_medo/.test(s.key)) && (st?.subtitles ?? []).length > 0, `active=${st?.active.join(',')} subs=${(st?.subtitles ?? []).join('|')} sounds=${st?.sounds.map((s) => s.key).join(',')}`);
  await shot('06-cutscene-fallback');
  await page.keyboard.press('Escape');
  await wait(1500);
  st = await gameState();
  check('15b. fallback: skip funciona', st?.active.includes('StoryScene'));
  await page.unroute(/cutscenes\/.*\.(webm|mp4)/);

  const failed = requests.filter((r) => r.status >= 400 && !/favicon/.test(r.url));
  check('16. rede: nenhum asset audiovisual 404', failed.length === 0, failed.slice(0, 6).map((r) => `${r.status} ${r.url}`).join(' | '));
  const comfy = requests.filter((r) => /8188/.test(r.url));
  check('17. runtime não chama ComfyUI', comfy.length === 0);
  const realErrors = consoleErrors.slice(0, errorsBeforeFallbackTest).filter((e) => !/Autoplay|play\(\) failed|AudioContext/.test(e));
  const fallbackErrors = consoleErrors.slice(errorsBeforeFallbackTest).filter((e) => !/ERR_FAILED|cutscenes\//.test(e));
  check('18. console sem erros (exceto o bloqueio proposital do teste 15)', realErrors.length === 0 && fallbackErrors.length === 0, [...realErrors, ...fallbackErrors].slice(0, 5).join(' | '));
} catch (err) {
  check('QA-AV script crash', false, String(err));
}
await browser.close();
const summary = { pass: checks.filter((c) => c.ok).length, fail: checks.filter((c) => !c.ok).length, total: checks.length, checks, consoleErrors };
fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
console.log(`\nSUMMARY: ${summary.pass} pass / ${summary.fail} fail of ${summary.total}`);
process.exit(summary.fail ? 1 : 0);
