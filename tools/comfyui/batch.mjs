/**
 * Patient ComfyUI generation queue for O Último Rastro asset production.
 * Handles server blocking during generation (poll failures are expected).
 * Never imported by game runtime.
 *
 * Usage:
 *   node tools/comfyui/batch.mjs --manifest comfyui/batches/backgrounds.json
 *   node tools/comfyui/batch.mjs --single '{"prompt":{...}}'
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BASE = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';
const ROOT = process.cwd();

async function fetchWithRetry(url, opts = {}, retries = 6) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeoutMs ?? 8000) });
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 + i * 250));
    }
  }
  throw lastErr;
}

async function online() {
  try {
    const res = await fetch(`${BASE}/system_stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function buildWorkflow({ prompt, negative, width = 768, height = 432, steps = 8, cfg = 7, seed = 42, prefix }) {
  return {
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0]
      }
    },
    4: {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: 'v1-5-pruned-emaonly-fp16.safetensors' }
    },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['4', 1]
      }
    },
    7: {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negative || 'text, watermark, signature, username, blurry, lowres, bright, cheerful, cartoon',
        clip: ['4', 1]
      }
    },
    8: { class_type: 'SaveImage', inputs: { filename_prefix: prefix || 'ultimo_rastro/asset', images: ['9', 0] } },
    9: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } }
  };
}

async function queue(workflow) {
  const res = await fetchWithRetry(
    `${BASE}/prompt`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
      timeoutMs: 15000
    },
    3
  );
  const body = await res.text();
  if (!res.ok) throw new Error(`queue ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body).prompt_id;
}

async function waitHistory(id, timeoutMs = 600000) {
  const start = Date.now();
  let lastLog = 0;
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const res = await fetch(`${BASE}/history/${id}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const entry = data[id];
      if (!entry) continue;
      const st = entry.status;
      const outs = entry.outputs || {};
      if (Object.keys(outs).length) {
        return { ok: true, outputs: outs, status: st };
      }
      if (st?.status_str === 'error') {
        return { ok: false, status: st, raw: entry };
      }
      for (const m of st?.messages || []) {
        if (m[0] === 'execution_error') return { ok: false, status: st, raw: m };
      }
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed - lastLog >= 30) {
        console.log(`  ... ${elapsed}s`);
        lastLog = elapsed;
      }
    } catch {
      // expected while server is blocked computing
    }
  }
  // One last chance: entry may have completed just as we timed out
  try {
    const res = await fetch(`${BASE}/history/${id}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const entry = data[id];
      if (entry && Object.keys(entry.outputs || {}).length) {
        return { ok: true, outputs: entry.outputs, status: entry.status };
      }
      if (entry?.status?.status_str === 'error') {
        return { ok: false, status: entry.status, raw: entry };
      }
    }
  } catch {
    /* ignore */
  }
  return { ok: false, timeout: true };
}

function findOutputFiles(outputs) {
  const files = [];
  for (const nodeOut of Object.values(outputs)) {
    if (nodeOut.images) {
      for (const img of nodeOut.images) {
        files.push(img);
      }
    }
  }
  return files;
}

async function downloadImage(img, destPath) {
  // ComfyUI serves /view?filename=&subfolder=&type=
  const qs = new URLSearchParams({
    filename: img.filename,
    subfolder: img.subfolder || '',
    type: img.type || 'output'
  });
  const res = await fetchWithRetry(`${BASE}/view?${qs}`, { timeoutMs: 30000 }, 4);
  if (!res.ok) throw new Error(`view ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const ext = path.extname(destPath).toLowerCase();
  if (ext === '.webp') {
    await sharp(buf).webp({ quality: 90 }).toFile(destPath);
  } else if (ext === '.png') {
    await sharp(buf).png().toFile(destPath);
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(buf).jpeg({ quality: 90 }).toFile(destPath);
  } else {
    fs.writeFileSync(destPath, buf);
  }
  return destPath;
}

function findOutputRoot() {
  // Prefer Vega11 output (the install with checkpoint), else shared.
  const candidates = [
    path.join('C:\\Users\\Wind11\\Downloads\\ComfyUI-Vega11', 'output'),
    path.join('C:\\Users\\Wind11\\AppData\\Local\\Comfy-Desktop\\ComfyUI-Shared', 'output')
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const manifestIdx = args.indexOf('--manifest');
  let items = [];
  if (manifestIdx >= 0) {
    const mf = args[manifestIdx + 1];
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, mf), 'utf8'));
    items = raw.items || raw;
  } else {
    console.log('usage: node tools/comfyui/batch.mjs --manifest <file>');
    process.exit(1);
  }

  if (!(await online())) {
    console.log('SKIP - ComfyUI offline');
    process.exit(0);
  }

  const report = { startedAt: new Date().toISOString(), ok: [], fail: [] };
  for (const item of items) {
    const label = item.id || item.out;
    console.log(`QUEUE ${label}`);
    try {
      const wf = buildWorkflow(item);
      const id = await queue(wf);
      console.log(`  id ${id}`);
      const result = await waitHistory(id, item.timeoutMs || 240000);
        if (!result.ok) {
          const brief = result.timeout
            ? 'timeout'
            : `error:${result.status?.messages?.find?.((m) => m[0] === 'execution_error')?.[1]?.exception_type || result.status?.status_str || 'unknown'}`;
          console.log(`  FAIL ${label} ${brief}`);
          report.fail.push({ id: label, reason: result.timeout ? 'timeout' : 'error', detail: brief });
          continue;
        }
      const files = findOutputFiles(result.outputs);
      if (!files.length) {
        report.fail.push({ id: label, reason: 'no_outputs' });
        console.log('  FAIL no output files');
        continue;
      }
      // download first image
      const dest = path.join(ROOT, item.out);
      await downloadImage(files[0], dest);
      console.log(`  OK -> ${item.out} (${fs.statSync(dest).size} bytes)`);
      report.ok.push({ id: label, out: item.out, promptId: id, seed: item.seed ?? 42, steps: item.steps ?? 8 });
      // write metadata
      const metaPath = path.join(ROOT, 'comfyui', 'meta', `${label}.json`);
      fs.mkdirSync(path.dirname(metaPath), { recursive: true });
      fs.writeFileSync(
        metaPath,
        JSON.stringify(
          {
            id: label,
            promptId: id,
            prompt: item.prompt,
            negative: item.negative,
            width: item.width ?? 768,
            height: item.height ?? 432,
            steps: item.steps ?? 8,
            cfg: item.cfg ?? 7,
            seed: item.seed ?? 42,
            ckpt: 'v1-5-pruned-emaonly-fp16.safetensors',
            workflow: 'txt2img-basic',
            out: item.out,
            generatedAt: new Date().toISOString()
          },
          null,
          2
        )
      );
    } catch (err) {
      console.log(`  FAIL ${label}: ${err.message}`);
      report.fail.push({ id: label, reason: err.message });
    }
  }
  report.finishedAt = new Date().toISOString();
  const reportPath = path.join(ROOT, 'comfyui', 'meta', 'batch-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDONE ok=${report.ok.length} fail=${report.fail.length}`);
  process.exit(report.fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
