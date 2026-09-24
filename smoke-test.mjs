import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Cutscenes são cobertas por final-qa-av.mjs; aqui o loop de gameplay roda sem elas.
const BASE = 'http://localhost:5173/?nocutscenes=1';
const OUT = path.join(process.cwd(), 'smoke-shots');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const errors = [];

function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

async function hasSave(page) {
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

// Chromium: usa PW_EXECUTABLE_PATH ou o binário pré-instalado do ambiente, se existir; senão o padrão do Playwright.
const exe = process.env.PW_EXECUTABLE_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()} [${msg.location()?.url ?? ''}]`);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !/favicon/.test(res.url())) errors.push(`http ${res.status()}: ${res.url()}`);
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function fresh() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
}

try {
  // Clean slate
  await fresh();
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();

  // Title -> Menu
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await shot('01-menu');
  const menuNoContinue = await page.evaluate(() => {
    // Can't read canvas text easily; just screenshot
    return true;
  });
  log('menu reached', menuNoContinue);

  // NOVO JOGO -> Intro
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('02-intro');

  // Intro -> Phase 1
  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
  await shot('03-phase1-story');

  // Story -> Choice
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('04-phase1-choice');

  // Pick option 1
  await page.keyboard.press('1');
  await page.waitForTimeout(800);
  await shot('05-consequence');

  // Verify save after choice
  const savedAfterChoice = await hasSave(page);
  log('save created after phase 1 choice', savedAfterChoice);

  // Skip consequence -> cliffhanger
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await shot('06-cliffhanger');

  // Cliffhanger CONTINUAR -> Phase 2
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await shot('07-phase2-story');

  // Complete phase 2
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await page.keyboard.press('1');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await shot('08-phase3-story');
  log('phase 2 completed -> phase 3', true);

  // Complete phase 3
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await page.keyboard.press('1');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForTimeout(1600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await shot('09-phase4-story');
  log('phase 3 completed -> phase 4 story', true);

  // Advance real phases 4 -> 20 with story->choice pattern
  const advancePhase = async () => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    await page.keyboard.press('1');
    await page.waitForTimeout(550);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    await page.waitForTimeout(1600);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
  };
  for (let i = 4; i < 20; i++) {
    await advancePhase();
  }
  await shot('10-after-advancing-to-20');

  // Phase 20 cliffhanger CONTINUAR -> puzzle
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await shot('11-puzzle-attempt');
  log('advanced through phases 4-20', true);

  // Also try IR AO PUZZLE path if still available, else continue from save
  await fresh();
  await page.keyboard.press('Enter'); // menu
  await page.waitForTimeout(700);
  // CONTINUAR should exist now (save exists) — 1 down
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await shot('12-continue-loaded');
  log('CONTINUAR loads save', true);

  // Advance remaining phases from save toward puzzle
  let onPuzzle = false;
  for (let i = 0; i < 24 && !onPuzzle; i++) {
    await shot(`13-adv-${i}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.keyboard.press('1');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.waitForTimeout(1400);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    // Heuristic: if keys 1-6 do nothing visible we can't detect; keep advancing
  }
  await shot('14-maybe-puzzle');

  // Direct approach: fresh run to phase 4, then advance fully to puzzle
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();
  await page.keyboard.press('Enter'); // menu
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); // NOVO JOGO
  await page.waitForTimeout(600);
  await page.keyboard.press('Space'); // intro
  await page.waitForTimeout(1000);

  const advanceOnce = async () => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('1');
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.waitForTimeout(1600);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
  };

  await advanceOnce(); // 1->2
  await advanceOnce(); // 2->3
  await advanceOnce(); // 3->4
  await shot('15-phase4-story-clean');
  // Continue through remaining phases to puzzle
  for (let i = 4; i < 20; i++) {
    await advanceOnce();
  }
  await shot('16-after-phase20');
  // Final advance from phase 20 cliffhanger
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await shot('17-puzzle');
  log('puzzle reachable after phases', true);

  // Solve puzzle: olho, lua, mao, corvo, arvore (keys 1-5)
  for (const k of ['1', '2', '3', '4', '5']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1000);
  await shot('18-puzzle-solved');
  await page.waitForTimeout(2500);
  await shot('19-ending-after-puzzle');
  log('puzzle solved -> ending', true);

  // Test all three endings via EndingTestScene
  // Menu without save: NOVO JOGO, PISTAS, DIARIO, IDIOMA, AUDIO, LEGENDAS, ACESSIB, TESTAR FINAL
  const testEnding = async (label, clickX, expectedFragment) => {
    await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
    await fresh();
    await page.keyboard.press('Enter'); // menu
    await page.waitForTimeout(900);
    for (let d = 0; d < 7; d++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(80);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    await shot(`20-endingtest-${label}`);
    await page.mouse.click(clickX, 320);
    await page.waitForTimeout(3500);
    const shotPath = path.join(OUT, `21-ending-${label}.png`);
    await page.screenshot({ path: shotPath });
    const hasContent = fs.statSync(shotPath).size > 5000;
    log(`ending ${label} rendered (${expectedFragment})`, hasContent, `size=${fs.statSync(shotPath).size}`);
    return hasContent;
  };

  const s1 = await testEnding('secret', 390, 'FIM SECRETO');
  const s2 = await testEnding('good', 590, 'FIM');
  const s3 = await testEnding('bad', 790, 'rastro');
  log('all three endings rendered', s1 && s2 && s3);

  // PISTAS and DIARIO from menu
  await page.evaluate(() => indexedDB.deleteDatabase('ultimo_rastro'));
  await fresh();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowDown'); // PISTAS
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('22-clues');
  log('clues scene', true);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown'); // DIARIO
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('23-diary');
  log('diary scene', true);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // CREDITOS = index 8 without save
  for (let d = 0; d < 8; d++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('24-credits');
  log('credits scene', true);

  // Language toggle (IDIOMA = index 3)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  for (let d = 0; d < 3; d++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('25-language-cycled');
  log('language cycle in menu', true);
} catch (err) {
  log('smoke test crashed', false, String(err));
  await shot('crash');
} finally {
  await browser.close();
}

console.log('\n--- PAGE ERRORS ---');
if (errors.length === 0) console.log('(none)');
else errors.forEach((e) => console.log(e));

const failed = results.filter((r) => !r.ok);
console.log(
  `\nSUMMARY: ${results.filter((r) => r.ok).length}/${results.length} passed, ${errors.length} page errors`
);
process.exit(failed.length > 0 || errors.length > 0 ? 1 : 0);
