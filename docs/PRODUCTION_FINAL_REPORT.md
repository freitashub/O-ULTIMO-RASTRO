# PRODUCTION_FINAL_REPORT — O Último Rastro

Data: 2026-09-24  
Status: **PRODUÇÃO DE ASSETS CONCLUÍDA** (dentro do limite técnico do ambiente)

---

## 1. Verificação final (gate de saída)

| Verificação | Resultado |
|---|---|
| `npm run test` | **111/111 passed** (15 arquivos) |
| `npm run build` (`tsc --noEmit && vite build`) | **OK** (`dist/assets/index-_AfzXAxc.js`, 1 438 kB) |
| `node smoke-test.mjs` (dev `:5173`) | **16/16 passed, 0 page errors** |
| Manifest de assets | `public/data/assets-manifest.json` == `src/data/assets-manifest.json` |
| Registry | `src/data/assetRegistry.json` == `public/data/assetRegistry.json` |

Screenshots E2E: `smoke-shots/` (menu, 20 fases, 3 finais, pistas, diário, créditos, i18n).

---

## 2. Inventário de assets produzidos

### Manifest (`assets-manifest.json`, gerado 2026-09-24)

| Categoria | Qtd | Local |
|---|---:|---|
| Backgrounds (fases) | **20/20** | `public/assets/backgrounds/phase-01…20-*.webp` |
| Personagens | **7/7** | `public/assets/characters/char_{theo,clara,elias,silas,troll,theo_t2,theo_t4}.webp` |
| Símbolos | **6** | `public/assets/symbols/*.webp` + `*.svg` |
| Retratos | **5** | `public/images/portraits/*.png` |
| Pistas (clues) | **21** | `public/images/clues/*.png` |
| Faces do Cubo | **6** | `public/images/cube/*.png` |
| Finais | **3** | `public/images/endings/*.png` |
| Transformação | **5** | `public/images/transformation/*.png` |
| **Total no manifest** | **131** | (`all`) |

### Registry (`assetRegistry.json`)

| Pack | Entradas |
|---|---:|
| `core` | 7 |
| `audio` | 12 (todas `optional`) |
| `images` | 79 (bg + símbolos + retratos + pistas + cubo + finais + transformação + **7 personagens**) |

### Outros
- Arte vetorial SVG original (símbolos/UI/cubo/pistas/endings) — definitiva.
- Metadados de geração: `comfyui/meta/` (36 arquivos: `bg_phase*.json`, `char_*.json`, logs de batch).
- Batches: `comfyui/batches/{backgrounds,backgrounds-remaining,backgrounds-640,characters,characters-lean,char-t4,char-t4-lean,char-t4-ultra}.json`.

---

## 3. Pipeline ComfyUI (produção real)

- **Instância:** Vega11 DirectML `http://127.0.0.1:8188` (`--directml --lowvram --cpu-vae --use-split-cross-attention`).
- **Checkpoint:** `v1-5-pruned-emaonly-fp16.safetensors` (SD1.5).
- **Workflow:** `tools/comfyui/batch.mjs` — queue → poll `/history` → `/view` → sharp → `.webp` (+ meta JSON).
- **Resoluções usadas:** backgrounds 640×360 / 6 steps; personagens 480×720 / 6 steps; fallback ultra-lean 320×480 / 4 steps (após crashes DirectML).
- **`char_theo_t4`:** gerado em ultra-lean 320×480 / 4 steps / seed 4214 (promptId `5854806d-…`), meta em `comfyui/meta/char_theo_t4.json`.

### Instabilidade observada e mitigada
| Problema | Mitigação aplicada |
|---|---|
| `UnicodeDecodeError` em KSampler após filas longas | Reiniciar ComfyUI e reenfileirar |
| OOM / hang DirectML ~1 GB em 480×720+ | Interromper job, reiniciar, reenfileirar em res menor |
| `waitHistory` timeout (240s) com job ainda rodando | Timeout 600s + re-checagem pós-timeout + salvage via `/history` e `/view` |
| Batch report com tracebacks gigantes | Relatório truncado (id/reason/detail curto) |
| PowerShell `Out-File -Encoding utf8` grava BOM | Escrever JSON via Node `fs.writeFileSync` |

---

## 4. O que permanece bloqueado (limite técnico real)

### Áudio / Música / SFX / TTS — **BLOQUEADO**
- `StabilityTextToAudio` → Unauthorized / requer login ComfyOrg.
- ElevenLabs → sem API key (voices 0).
- Sem checkpoints de áudio locais no ComfyUI.
- **Decisão:** permanece `optional` no registry; **nunca gerar fake**.

### Vídeo / Cutscene — **BLOQUEADO**
- Nós de vídeo são cloud (Kling/Wan/etc.) sem modelos locais.
- Cutscenes continuam em código (`CutscenePlayer`) sem filme.
- **Decisão:** registrar como faltante.

### ESLint — **não instalado**
- `npm run lint` falha; não bloqueia build/test (TypeScript + Vitest cobrem o gate).

### STT — N/A (não aplicável ao escopo atual)

---

## 5. Decisões automáticas registradas

1. Pipeline + docs + referências + metadados + workflows produzidos mesmo com falhas pontuais do ComfyUI.
2. **Art vetorial original (SVG)** é asset real e definitivo para símbolos/UI/cubo.
3. Cenas complexas e personagens full-body: preferir ComfyUI; indisponível → registrar faltante (não fake).
4. Áudio: só com modelo real; senão `optional` no registry.

---

## 6. Como executar

```bash
# dependências
npm install

# dev
npm run dev          # http://localhost:5173

# gate de qualidade
npm run test         # 111/111
npm run build        # tsc + vite
node smoke-test.mjs  # 16/16 (requer dev em :5173)

# regenerar manifest de assets
node tools/assets/build-manifest.mjs

# regenerar um lote (requer ComfyUI online em :8188)
node tools/comfyui/batch.mjs --manifest comfyui/batches/backgrounds-640.json
```

---

## 7. Conclusão

A produção de assets de imagem (backgrounds, personagens, símbolos, pistas, cubo, finais, transformação) está **completa e integrada** (manifest + registry sincronizados, testes e smoke verdes).  

Os únicos itens não entregues são **áudio/TTS** e **vídeo/cutscene**, bloqueados por **falta de modelo local e credencial cloud** — registrados como `optional`/faltantes, sem placeholders falsos, conforme política de produção.  
