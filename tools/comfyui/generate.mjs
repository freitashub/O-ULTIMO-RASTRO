/**
 * ComfyUI generate — optional asset pipeline.
 * Never imported by the game runtime.
 *
 * Usage: node tools/comfyui/generate.mjs
 * Requires ComfyUI running and workflow JSONs in comfyui/workflows/
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';
const WORKFLOWS = path.join(process.cwd(), 'comfyui', 'workflows');

async function checkOnline() {
  try {
    const res = await fetch(`${BASE}/system_stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function queueWorkflow(workflow) {
  const prompt = Object.fromEntries(
    Object.entries(workflow).filter(([key]) => !key.startsWith('_'))
  );
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`queue failed: ${res.status} ${body}`);
  }
  return res.json();
}

const online = await checkOnline();
if (!online) {
  console.log(`SKIP - ComfyUI offline at ${BASE}. Game is unaffected.`);
  process.exit(0);
}

if (!fs.existsSync(WORKFLOWS)) {
  console.log('SKIP - no workflows directory at comfyui/workflows/');
  process.exit(0);
}

const files = fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.log('SKIP - no workflow JSON files found.');
  process.exit(0);
}

let ok = 0;
let fail = 0;
for (const file of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(WORKFLOWS, file), 'utf8'));
    const result = await queueWorkflow(raw);
    console.log(`PASS - queued ${file} → ${result.prompt_id}`);
    ok += 1;
  } catch (err) {
    console.error(`FAIL - ${file}: ${err.message}`);
    fail += 1;
  }
}

console.log(`\nDONE: ${ok} queued, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
