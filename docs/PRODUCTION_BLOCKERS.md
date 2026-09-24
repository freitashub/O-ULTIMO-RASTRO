# PRODUCTION_BLOCKERS — O Último Rastro

Atualizado: 2026-09-24 (produção de assets **CONCLUÍDA**; bloqueios restantes = limite técnico)

## Estado do ambiente

| Recurso | Estado | Impacto |
|---|---|---|
| ComfyUI `:8188` (Vega11 DirectML) | **ONLINE** (health 200) | Geração txt2img funcional |
| Node/Playwright | OK | Testes e build |
| Vite dev `:5173` | OK | Smoke test |
| Jogo runtime | OK | Funciona sem ComfyUI |
| ESLint | **não instalado** | `npm run lint` falha (não bloqueia build/test) |

## Capacidades por categoria

### IMAGEM — ✅ PRODUZIDO
- Workflow padrão txt2img: **disponível** (`tools/comfyui/batch.mjs`, `comfyui/workflows/`)
- Checkpoint: `v1-5-pruned-emaonly-fp16.safetensors` (SD1.5)
- Pipeline: queue → history poll → `/view` download → sharp → webp
- **Operacional:** 640×360 / 6 steps ~3–5 min; 480×720 funciona; **320×480 / 4 steps** usado como fallback estável após crashes DirectML
- **Instabilidade:** filas longas → `UnicodeDecodeError` em KSampler; OOM/hang ~1 GB VRAM — **mitigação: reiniciar ComfyUI, reduzir res/steps, reenfileirar** (aplicada com sucesso em `char_theo_t4`)
- Arte vetorial SVG original: **definitiva** para símbolos/UI/cubo/pistas/retratos/endings
- **Entregue:** 20 backgrounds + 7 personagens + 6 símbolos + 5 retratos + 21 clues + 6 cubo + 3 finais + 5 transformação = **131 no manifest**

### ÁUDIO / TTS / MUSIC / SFX — ❌ BLOQUEADO (limite técnico)
- `StabilityTextToAudio` → **Unauthorized / requer login ComfyOrg**
- ElevenLabs → **sem API key / voices 0**
- Sem checkpoints de áudio locais
- **Bloqueio real:** áudio permanece `optional` no registry; **nunca gerar fake**

### VIDEO / CUTSCENE — ❌ BLOQUEADO (limite técnico)
- Nós de vídeo são cloud (Kling/Wan/etc.) sem modelos locais
- Cutscenes usam sistema em código (`CutscenePlayer`) sem filme
- **Bloqueio real:** registrar como faltante (não há modelo local)

### STT — N/A

## Decisões automáticas em vigor
1. Pipeline + docs + referências + metadados + workflows produzidos mesmo com falhas pontuais
2. **Art vetorial original (SVG)** é asset real e definitivo para símbolos/UI/cubo
3. Cenas complexas e personagens full-body: preferir ComfyUI; se indisponível, registrar faltantes
4. Áudio: só com modelo real; senão optional no registry

## Riscos operacionais conhecidos
- RAM/DirectML 1GB: resoluções ≥768 e steps altos aumentam risco de OOM/hang — preferir ≤640 e ≤6 steps
- ComfyUI Desktop ROCm (`%LOCALAPPDATA%\Comfy-Desktop`) **crasha** com "No CUDA GPUs are available" — usar só Vega11
- `waitHistory` pode reportar timeout com job ainda rodando — sempre rechecar `/history` e salvage via `/view`
- PowerShell `Out-File -Encoding utf8` grava BOM — escrever JSON via Node
- Batch report truncado para evitar tracebacks gigantes

## O que NÃO é bloqueio
- Testes (111/111), build, smoke (16/16), docs, i18n, integração registry/manifest — executáveis offline

## Gate de saída atual (2026-09-24)
- `npm run test` → **111/111**
- `npm run build` → **OK**
- `node smoke-test.mjs` → **16/16, 0 page errors**
- Manifest == registry sincronizados; **131** entradas de imagem
