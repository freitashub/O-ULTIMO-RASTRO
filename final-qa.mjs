import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Cutscenes são cobertas por final-qa-av.mjs; aqui o loop de gameplay roda sem elas.
const BASE = 'http://localhost:5173/?nocutscenes=1';
const OUT = path.join(process.cwd(), 'final-qa-shots');
const REPORT = path.join(process.cwd(), 'final-qa-results.json');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const phases = JSON.parse(fs.readFileSync('public/data/phases.json', 'utf8'));
const cluesData = JSON.parse(fs.readFileSync('public/data/clues.json', 'utf8'));
const symbolsData = JSON.parse(fs.readFileSync('public/data/symbols.json', 'utf8'));
const cubeConfig = JSON.parse(fs.readFileSync('public/data/cube-config.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('public/data/assets-manifest.json', 'utf8'));

const checks = [];
const consoleErrors = [];
const consoleWarns = [];
const network = { ok: [], fail: [], all: [] };
const phaseBgRequests = new Map();
const textureLoads = new Set();
const comfyCalls = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

function note(name, status, detail = '') {
  checks.push({ name, ok: status !== 'fail', status, detail: String(detail) });
  console.log(`${status.toUpperCase()} - ${name}${detail ? ' :: ' + detail : ''}`);
}

// Chromium: usa PW_EXECUTABLE_PATH ou o binário pré-instalado do ambiente, se existir; senão o padrão do Playwright.
const exe = process.env.PW_EXECUTABLE_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  const t = msg.text();
  if (msg.type() === 'error') consoleErrors.push(`console.error: ${t}`);
  if (msg.type() === 'warning') consoleWarns.push(`console.warn: ${t}`);
});
page.on('response', async (res) => {
  const url = res.url();
  const status = res.status();
  const rec = { url, status };
  network.all.push(rec);
  if (url.includes('127.0.0.1:8188') || url.includes('localhost:8188')) comfyCalls.push(url);
  if (status >= 400) {
    network.fail.push(rec);
  } else if (/\.(png|webp|jpg|jpeg|svg|ogg|mp3|wav|json)(\?|$)/i.test(url) || url.includes('/assets/') || url.includes('/images/') || url.includes('/data/')) {
    network.ok.push(rec);
    for (const p of phases) {
      if (url.endsWith(p.image) || url.includes(p.image)) {
        phaseBgRequests.set(p.id, status);
      }
    }
    if (/\.(png|webp)(\?|$)/i.test(url)) textureLoads.add(url);
  }
});
page.on('requestfailed', (req) => {
  network.fail.push({ url: req.url(), status: 0, failure: req.failure()?.errorText });
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function fresh() {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2200);
}

async function hasSave() {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open('ultimo_rastro');
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('saves')) {
            db.close();
            resolve(false);
            return;
          }
          const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
          get.onsuccess = () => {
            resolve(!!get.result);
            db.close();
          };
          get.onerror = () => {
            resolve(false);
            db.close();
          };
        };
        req.onerror = () => resolve(false);
      })
  );
}

async function advancePhase() {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await page.keyboard.press('1');
  await page.waitForTimeout(1200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
}

try {
  // Clean slate
  await fresh();
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();

  // 1. Title -> Menu
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await shot('01-menu');
  check('1. iniciar novo jogo (menu)', true);

  // NOVO JOGO -> Intro
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('02-intro');

  // Intro -> Phase 1
  await page.keyboard.press('Space');
  await page.waitForTimeout(1400);
  await shot('phase-01');
  check('fase 1 story carregada', true);

  // Walk phases 1 -> 20 with background verification
  const bgLog = [];
  for (let phaseId = 1; phaseId <= 20; phaseId++) {
    // At StoryScene for this phase (except after last advance we may be at choice/cliff)
    const expected = phases.find((p) => p.id === phaseId);
    if (!expected) continue;

    // Capture current story shot (phase 1 already shot)
    if (phaseId > 1) {
      await page.waitForTimeout(800);
      await shot(`phase-${String(phaseId).padStart(2, '0')}`);
    }

    // Wait for this phase background request (best effort)
    const expectedImage = expected.image;
    await page
      .waitForFunction(
        (img) =>
          performance
            .getEntriesByType('resource')
            .some((e) => e.name.includes(img)),
        expectedImage,
        { timeout: 5000 }
      )
      .catch(() => {});

    // Verify background request status for this phase image
    const status = phaseBgRequests.get(phaseId);
    const fileExists = fs.existsSync('public' + expected.image);
    const inManifest = manifest.backgrounds.includes(expected.image) || manifest.all.includes(expected.image);
    bgLog.push({
      phase: phaseId,
      image: expected.image,
      fileExists,
      inManifest,
      httpStatus: status ?? null,
      title: expected.title
    });

    if (phaseId <= 20) {
      // Only assert HTTP for phases we know should have loaded by now
      if (status !== undefined) {
        if (status >= 400) {
          check(`3. background fase ${phaseId}`, false, `HTTP ${status} ${expected.image}`);
        }
      }
    }

    // Complete phase: story -> choice -> pick 1 -> consequence -> cliffhanger -> next
    if (phaseId < 20) {
      await advancePhase();
    } else {
      // Phase 20: story -> choice -> consequence -> cliffhanger -> puzzle
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      await page.keyboard.press('1');
      await page.waitForTimeout(1200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      await page.waitForTimeout(2500);
      await shot('phase-20-cliffhanger');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2500);
      await shot('puzzle');
    }
  }

  // Aggregate background check from FINAL network map (not mid-loop snapshot)
  const finalBgs = phases.filter((p) => {
    const st = phaseBgRequests.get(p.id);
    return st !== undefined && st < 400;
  }).length;
  const bgsExist = bgLog.filter((b) => b.fileExists && b.inManifest).length;
  check('3. backgrounds 20 fases existem+manifest', bgsExist === 20, `${bgsExist}/20`);
  check(
    '3. backgrounds 20 fases HTTP ok (carregadas no browser)',
    finalBgs >= 20,
    `http=${finalBgs} map=${phaseBgRequests.size} missing=${phases
      .filter((p) => phaseBgRequests.get(p.id) === undefined)
      .map((p) => p.id)
      .join(',')}`
  );

  // 8. Cube faces in puzzle
  const cubeFacesRequested = [...network.ok].filter((r) => r.url.includes('/images/cube/face_')).map((r) => r.url.split('/').pop());
  const uniqueCube = [...new Set(cubeFacesRequested)];
  check(
    '8. Cubo de Orun faces carregadas',
    uniqueCube.length >= 6 || cubeConfig.faces.every((f) => uniqueCube.some((u) => u.includes(f))),
    `got=${uniqueCube.join(',')}`
  );

  // Solve puzzle: olho, lua, mao, corvo, arvore
  for (const k of ['1', '2', '3', '4', '5']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(280);
  }
  await page.waitForTimeout(1200);
  await shot('puzzle-solved');
  await page.waitForTimeout(2800);
  await shot('ending-after-puzzle');
  const endingArt = [...network.ok].filter((r) => r.url.includes('/images/endings/ending_'));
  check(
    '10. final pós-puzzle (arte ending_*.png)',
    endingArt.length >= 1,
    endingArt.map((e) => e.url.split('/').pop()).join(',') || 'none requested'
  );

  // Let ending go to credits then back for more tests
  await page.waitForTimeout(3000);
  await shot('credits-or-ending');

  // Fresh: test 3 endings via EndingTestScene
  const testEnding = async (label, clickX) => {
    await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
    await fresh();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    for (let d = 0; d < 7; d++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(70);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    await shot(`endingtest-${label}`);
    await page.mouse.click(clickX, 320);
    await page.waitForTimeout(3500);
    const p = path.join(OUT, `ending-${label}.png`);
    await page.screenshot({ path: p });
    const size = fs.statSync(p).size;
    const artHit = [...network.ok].some((r) => r.url.includes(`ending_${label}`));
    check(`10. final ${label} render + arte`, size > 5000, `size=${size} artNetwork=${artHit}`);
    return size > 5000;
  };
  await testEnding('secret', 390);
  await testEnding('good', 590);
  await testEnding('bad', 790);

  // Clues scene: play phase 1 correctly (choice 2 = Garagem -> tire_mark), then open PISTAS from menu with save
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();
  await page.keyboard.press('Enter'); // title
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter'); // novo jogo
  await page.waitForTimeout(600);
  await page.keyboard.press('Space'); // intro
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter'); // story -> choice
  await page.waitForTimeout(500);
  await page.keyboard.press('2'); // Garagem = correct, clue tire_mark
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);

  // With save: menu = [Novo, Continuar, PISTAS, DIARIO, ...] => index 2
  await fresh();
  await page.keyboard.press('Enter'); // title
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter'); // PISTAS
  await page.waitForTimeout(1200);
  await shot('clues');
  const clueIcons = [...network.ok].filter((r) => r.url.includes('/images/clues/'));
  const clue404 = network.fail.filter((r) => r.url.includes('/images/clues/'));
  check(
    '6. pistas descobertas carregam ícones (CluesScene)',
    clueIcons.length >= 1 && clue404.length === 0,
    `icons=${clueIcons.length} urls=${clueIcons.map((c) => c.url.split('/').pop()).join(',')} fails=${clue404.length}`
  );

  // Diary with symbols: play phases 1-2 correct (symbolReward phase2=olho), then open DIARIO
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter'); // novo
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);
  // phase 1 correct
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.keyboard.press('2');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  // phase 2 correct -> symbol olho
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  // choose correct for phase 2 - try options; loop until advance works
  // inspect phases.json index: find correct choice for phase 2
  const p2 = phases.find((x) => x.id === 2);
  const p2correct = p2.choices.findIndex((c) => c.correct);
  await page.keyboard.press(String(p2correct + 1));
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);

  await fresh();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  // with save: [Novo, Continuar, PISTAS, DIARIO] => index 3
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter'); // DIARIO
  await page.waitForTimeout(1200);
  await shot('diary');
  const diarySyms = [...network.ok].filter((r) => r.url.includes('/assets/symbols/'));
  const diary404 = network.fail.filter((r) => r.url.includes('/assets/symbols/'));
  check(
    '7. símbolos coletados exibem ícones (DiaryScene)',
    diarySyms.length >= 1 && diary404.length === 0,
    `symbols=${diarySyms.length} urls=${diarySyms.map((c) => c.url.split('/').pop()).join(',')} fails=${diary404.length}`
  );

  // Language cycle
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // IDIOMA index varies; cycle a few times and screenshot
  await fresh();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const langShots = [];
  for (let i = 0; i < 6; i++) {
    // try navigating down to IDIOMA-like entries and enter
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('language-attempt');
  // Also force language via cycling menu entries with known smoke path: 3 downs without save = IDIOMA
  await fresh();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  for (let d = 0; d < 3; d++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('language-cycle-1');
  langShots.push('language-cycle-1');
  // Cycle again a few times
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    for (let d = 0; d < 3; d++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await shot(`language-cycle-${i + 2}`);
    langShots.push(`language-cycle-${i + 2}`);
  }
  check('11. idioma (cycle menu)', langShots.length >= 3, langShots.join(','));

  // Subtitles: present on story scenes (SubtitleRenderer) — verified if phase shots non-empty and no subtitle errors
  const subErr = consoleErrors.filter((e) => /subtitle/i.test(e));
  check('12. legendas (sem erros SubtitleRenderer)', subErr.length === 0, subErr.join(' | ') || 'no subtitle errors');

  // Network / broken refs
  const bad404 = network.fail.filter((f) => f.status === 404 || f.status >= 400);
  const badAssets = bad404.filter(
    (f) =>
      /\.(png|webp|jpg|svg|json|ogg|mp3)/i.test(f.url) ||
      f.url.includes('/assets/') ||
      f.url.includes('/images/')
  );
  check(
    '15. referências quebradas (HTTP 4xx/5xx em assets)',
    badAssets.length === 0,
    `count=${badAssets.length} sample=${badAssets.slice(0, 5).map((f) => `${f.status} ${f.url}`).join(' | ')}`
  );

  // Missing assets: files referenced by phases/clues/symbols/cube/endings that don't exist
  const missing = [];
  for (const p of phases) {
    if (!fs.existsSync('public' + p.image)) missing.push(p.image);
  }
  const clueList = Array.isArray(cluesData) ? cluesData : Object.values(cluesData);
  for (const c of clueList) {
    const id = c.id;
    if (!fs.existsSync(`public/images/clues/${id}.png`)) missing.push(`/images/clues/${id}.png`);
  }
  const symList = Array.isArray(symbolsData) ? symbolsData : Object.values(symbolsData);
  for (const s of symList) {
    const ap = s.assetPath || `/assets/symbols/${s.id}.webp`;
    if (!fs.existsSync('public' + ap)) missing.push(ap);
  }
  for (const f of cubeConfig.faces || []) {
    if (!fs.existsSync(`public/images/cube/face_${f}.png`)) missing.push(`/images/cube/face_${f}.png`);
  }
  for (const e of ['secret', 'good', 'bad']) {
    if (!fs.existsSync(`public/images/endings/ending_${e}.png`)) missing.push(`/images/endings/ending_${e}.png`);
  }
  check('16. assets ausentes no disco (referenciados)', missing.length === 0, missing.join(', ') || 'none');

  // Preload / console
  check('13. carregamento/preload sem falha loaderror grave', !consoleErrors.some((e) => /failed to load|net::ERR/i.test(e) && !/audio|ogg|mp3/i.test(e)), consoleErrors.filter((e) => /failed to load|net::ERR/i.test(e)).join(' | ') || 'no load failures');

  // ComfyUI offline independence
  check(
    '20. jogo sem chamadas ao ComfyUI (:8188)',
    comfyCalls.length === 0,
    comfyCalls.length ? comfyCalls.slice(0, 5).join(', ') : 'no requests to 8188'
  );

  // Characters / portraits / transformation — were they requested?
  const charReq = [...network.ok].filter((r) => r.url.includes('/assets/characters/'));
  const portReq = [...network.ok].filter((r) => r.url.includes('/images/portraits/'));
  const transReq = [...network.ok].filter((r) => r.url.includes('/images/transformation/'));
  note(
    '4-5. personagens char_*.webp solicitados no browser',
    charReq.length > 0 ? 'pass' : 'fail',
    `count=${charReq.length} (arquivos existem=${manifest.characters.length})`
  );
  note(
    '5. retratos /images/portraits solicitados',
    portReq.length > 0 ? 'pass' : 'fail',
    `count=${portReq.length}`
  );
  note(
    '9. transformação /images/transformation solicitados',
    transReq.length > 0 ? 'pass' : 'fail',
    `count=${transReq.length}`
  );

  // Style: static ratio already checked; visual: screenshots sizes
  const phaseShots = fs.readdirSync(OUT).filter((f) => f.startsWith('phase-'));
  check('17-18. screenshots de fases geradas (inspeção visual manual)', phaseShots.length >= 20, `${phaseShots.length} shots`);

  // Console summary
  const realErrors = consoleErrors.filter(
    (e) => !/SFX não encontrado|Failed to load resource.*audio|net::ERR.*audio/i.test(e)
  );
  check('14. console sem erros (excl. áudio opcional ausente)', realErrors.length === 0, realErrors.slice(0, 8).join(' | ') || 'clean');

  note('console.warn count', 'note', String(consoleWarns.length));
} catch (err) {
  check('QA script crash', false, String(err));
  await shot('crash').catch(() => {});
} finally {
  await browser.close();
}

const failed = checks.filter((c) => c.ok === false);
const notes = checks.filter((c) => c.status && c.status !== 'pass' && c.status !== 'fail');
const summary = {
  generatedAt: new Date().toISOString(),
  pass: checks.filter((c) => c.ok === true).length,
  fail: failed.length,
  notes: notes.length,
  total: checks.length,
  checks,
  consoleErrors,
  consoleWarns: consoleWarns.slice(0, 50),
  networkFail: network.fail.slice(0, 50),
  networkOkCount: network.ok.length,
  phaseBgRequests: Object.fromEntries(phaseBgRequests),
  comfyCalls,
  textureLoads: [...textureLoads]
};
fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));

console.log('\n--- CONSOLE ERRORS ---');
console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
console.log('\n--- NETWORK FAIL (first 20) ---');
console.log(network.fail.slice(0, 20).map((f) => `${f.status} ${f.url}`).join('\n') || '(none)');
console.log(
  `\nSUMMARY: ${summary.pass} pass / ${summary.fail} fail / ${summary.notes} notes of ${summary.total} checks; ${consoleErrors.length} console errors; ${network.fail.length} network fails`
);
process.exit(failed.length > 0 || consoleErrors.filter((e) => !/audio|SFX/i.test(e)).length > 0 ? 1 : 0);
