# FINAL_QA_REPORT — O Último Rastro

Data: 2026-09-24  
Escopo: verificação browser final dos 131 assets nas 20 fases + integração completa (personagens / retratos / transformação) + gate de build/testes.

---

## 1. Resumo executivo

| Verificação | Resultado |
|---|---|
| `final-qa.mjs` (novo jogo → 20 fases → puzzle → 3 finais → pistas → diário → i18n) | **23 pass / 0 fail / 1 note** (23 checks) |
| `npm run test` | **111/111 passed** (15 arquivos) |
| `npm run build` (`tsc --noEmit && vite build`) | **OK** (`dist/assets/index-B93bShnl.js`, 1 440 kB) |
| `node smoke-test.mjs` (dev `:5173`) | **16/16 passed, 0 page errors** |
| Console errors (QA) | **0** |
| Network fails / 404s em assets (QA) | **0** |
| Chamadas a ComfyUI `:8188` no runtime | **0** |

**Estado: QA técnico verde.** Integração completa de personagens, retratos e transformação implementada e verificada em browser.

---

## 2. Fases testadas (browser real)

Playthrough completo **fase 1 → 20** via teclado (story → choice → consequence → cliffhanger):

| Verificação | Resultado |
|---|---|
| Backgrounds existem + manifest | **20/20** |
| Backgrounds HTTP 200 no browser | **20/20** (map 1–20 = 200) |
| Screenshots de fases | **21** (`phase-01` … `phase-20` + cliffhanger) |
| Pós-fase 20 | cliffhanger → **PuzzleScene** (6 faces HTTP 200) → resolução (olho, lua, mão, corvo, árvore) → **EndingScene** `ending_bad.png` |
| 3 finais via EndingTestScene | secret (27 214 B), good (20 410 B), bad (14 796 B) — arte carregada via rede |

---

## 3. Assets carregados no browser (verificado por rede HTTP)

| Categoria | Solicitados | HTTP ok | 404 | Evidência |
|---|---:|---:|---:|---|
| Backgrounds (20 fases) | 20 | 20 | 0 | `phaseBgRequests` 1–20 = 200 |
| Faces do cubo | 6 | 6 | 0 | `face_{olho,lua,mao,corvo,arvore,rosto}.png` |
| Finais | 3 | 3 | 0 | `ending_{secret,good,bad}.png` |
| Pistas (CluesScene) | ≥1 | ≥1 | 0 | `tire_mark.png` + screenshot `clues.png` |
| Símbolos (DiaryScene) | ≥1 | ≥1 | 0 | `olho.webp` + screenshot `diary.png` |
| Personagens `char_*.webp` | **9** | 9 | 0 | theo, troll, silas, clara, elias, theo_t2/t4… |
| Retratos `/images/portraits/` | **7** | 7 | 0 | theo, troll, silas, clara, elias… |
| Transformação `/images/transformation/` | **1** | 1 | 0 | `theo_t4.png` (overlay em fases com efeito) |

Aspect ratios estáticos (sharp): backgrounds 16:9 (1.7778), ícones quadrados, characters 2:3 — **zero distorção por proporção**.

---

## 4. Problemas técnicos encontrados e corrigidos

### 4.1 IDs de pistas ≠ nomes de arquivo (corrigido)
- 8 IDs longos em JSON vs nomes curtos em `public/images/clues/`.
- PNG+SVG copiados/renomeados para os IDs do JSON (sem arte nova). 21/21 verificados.

### 4.2 Menu não hidratava save ao abrir PISTAS/DIÁRIO (corrigido)
- `MenuScene` agora chama `loadGame()`/`setState()` (`hydrateFromSave`) antes de `CluesScene`/`DiaryScene`.
- Verificado browser: pista `tire_mark` e símbolo `olho` com ícones HTTP 200.

### 4.3 Sintaxe do script de QA (corrigido)
- Trecho inválido no check "15" de `final-qa.mjs` substituído.

### 4.4 QA: snapshot de backgrounds no meio do loop (corrigido)
- Check usava status congelado por fase; agora avalia o **mapa final** de rede após o playthrough completo.

### 4.5 QA: waits do walkthrough insuficientes p/ load assíncrono de arte (corrigido)
- `advancePhase` e fase 20 com waits maiores + `waitForFunction` pelo background esperado.
- Resultado: cubo e ending pós-puzzle alcançados; 20/20 backgrounds HTTP.

### 4.6 QA: `note()` contava "pass" como fail (corrigido)
- `ok: status === 'note'` marcava notes de integração como `ok:false` mesmo com status `pass`.

---

## 5. Integração completa (personagens / retratos / transformação)

**Decisão do usuário:** opção **"Integração completa"**.

### Implementação

| Arquivo | Mudança |
|---|---|
| `src/game/CharacterMap.ts` (novo) | Mapeamentos fase→personagem/retrato (1–20); `getCharacterPath`, `getPortraitPath`, `getTransformationImagePath(level)`, `getTransformedCharacterPath(level)` |
| `src/scenes/StoryScene.ts` | `ensureCharacterArt()` antes do render; sprite full-body 200×300 (x = width−150); overlay de transformação (alpha 0.55, tint 0xaa88ff) quando `shouldShowTransformationEffect`; wordWrap reduzido (`width − 320`) |
| `src/scenes/ChoiceScene.ts` | Retrato 80×80 no canto superior direito (`width−90, 70`); `headerTexts: Array<Text \| Image>` |
| `src/scenes/MenuScene.ts` | `hydrateFromSave()` (fix 4.2) |

### Mapeamento fase → personagem (resumo)

| Personagem | Fases |
|---|---|
| theo (ou o t2/t4 conforme nível) | 1, 2, 5, 12, 14, 15, 20 |
| troll | 3, 6, 8–11 |
| silas | 4, 13, 19 |
| clara | 7, 16, 17 |
| elias | 18 |

Transformação: overlay `theo_t{level}.png` em fases com `shouldShowTransformationEffect`; sprite base de Theo trocado para `char_theo_t2`/`char_theo_t4` quando `transformationLevel ≥ 2`/`≥ 4`.

### Verificação browser (QA pós-integração)

| Check | Resultado |
|---|---|
| Personagens solicitados | **9 requests, 0 fail** |
| Retratos solicitados | **7 requests, 0 fail** |
| Transformação solicitada | **1 request** (`theo_t4.png`), 0 fail |

---

## 6. Console / rede / offline

- **Console errors:** 0 (exclui áudio opcional ausente).
- **Console warns:** 4 (GPU stall ReadPixels — não bloqueantes, screenshots).
- **HTTP 4xx/5xx em assets:** 0.
- **ComfyUI `:8188`:** 0 chamadas durante o jogo.

---

## 7. Gate final

| Comando | Resultado |
|---|---|
| `npm run test` | **PASS 111/111** |
| `npm run build` | **PASS** (`dist/assets/index-B93bShnl.js`) |
| `node smoke-test.mjs` | **PASS 16/16, 0 page errors** |
| `node final-qa.mjs` | **PASS 23 / FAIL 0 / NOTE 1** |

**Estado final:** produção de assets **concluída** (131); integração completa **implementada e verificada**; QA técnico **verde** para backgrounds, personagens, retratos, transformação, pistas, símbolos, cubo, finais, i18n, console e build.

**Bloqueios restantes (limite técnico, não bloqueiam o jogo):**
- Áudio/música/SFX/TTS: sem modelo local/credencial → registry `optional`, nunca fake.
- Cutscenes/vídeo: cloud sem modelos locais → faltante registrado.
- ESLint não instalado (`npm run lint` falha — conhecido).

---

## 8. Artefatos

- Script: `final-qa.mjs`
- Resultados: `final-qa-results.json`
- Screenshots: `final-qa-shots/` (21 fases + menu, intro, puzzle, 3 finais, clues, diary, i18n)
- Smoke: `smoke-test.mjs`, `smoke-shots/`
- Relatórios de produção: `docs/PRODUCTION_FINAL_REPORT.md`, `docs/PRODUCTION_BLOCKERS.md`
