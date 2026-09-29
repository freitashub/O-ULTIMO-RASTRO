# Pipeline por fase

`PHASE_BUILD → PHASE_TEST → PHASE_FIX → PHASE_RETEST → PHASE_PASS` (nunca `BUILD → NEXT`).

Blockout → colisão → câmeras → gameplay → interação → iluminação → arte → áudio → polimento → teste.

**Critério de entrada da próxima fase:** fase anterior com `STATUS: PASS` em `docs/phases/PHASE_NN_REPORT.md`, `npm run godot:test` verde,
`npm test` (Phaser) verde, save/continuar OK, sem erros no log, sem asset ausente.

**Critério de PASS (seção 18):** ambiente, colisões, câmeras, personagem, animações, iluminação, interação, objetos, pistas, diálogo, escolhas,
consequências, transições, áudio, save, carregamento, saída, testes, sem erro crítico, sem asset ausente, **sem placeholder não declarado**.
Personagem/animação só contam como prontos com modelo real e rig funcional (seção 36).

## Situação

| Fase | Status |
|---|---|
| 1 | `docs/phases/PHASE_01_REPORT.md` — **implementada e testada; sem PASS** (cenário ainda em blockout, vozes não ligadas, export Web não testado) |
| 2–20 | não iniciadas (bloqueadas pela regra fase a fase) |

## Decisão tomada: modelos 3D dos personagens

A pasta fornecida continha **imagens** (arte de conceito), não modelos. O responsável decidiu: *"você faz tudo utilizando as imagens"* — os 13 modelos, o esqueleto e os
GLB são gerados por script a partir da arte (`docs/CHARACTER_PIPELINE.md`). Continuam aceitos modelos esculpidos no futuro (substituem sem mudar a lógica).
