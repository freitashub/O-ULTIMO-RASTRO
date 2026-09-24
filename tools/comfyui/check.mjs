/**
 * ComfyUI health check — optional pipeline tool.
 * Never imported by the game runtime.
 *
 * Usage: node tools/comfyui/check.mjs
 */

const BASE = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';

try {
  const res = await fetch(`${BASE}/system_stats`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) {
    console.error(`FAIL - ComfyUI responded ${res.status} at ${BASE}`);
    process.exit(1);
  }
  const stats = await res.json();
  console.log('PASS - ComfyUI online');
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
} catch (err) {
  console.error(`FAIL - ComfyUI unreachable at ${BASE}:`, err.message);
  console.error('Game runs without ComfyUI. This check is only for the asset pipeline.');
  process.exit(1);
}
