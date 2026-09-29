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
| 1 | `docs/phases/PHASE_01_REPORT.md` — **implementada e testada; sem PASS** (personagem real ausente) |
| 2–20 | não iniciadas (bloqueadas pela regra fase a fase) |

## Decisão pendente: como obter os modelos 3D dos personagens

A pasta fornecida contém **imagens** (arte de conceito), não modelos. Opções:

| Opção | O que fazer | Prós | Contras |
|---|---|---|---|
| A. Você gera os GLB | imagem → 3D com ferramenta web (Meshy, Tripo, Hunyuan3D, Rodin…) → auto-rig (Mixamo ou a própria ferramenta) → GLB em `assets_fornecidos/personagens_3d/<id>.glb` | fidelidade ao desenho, corpo esculpido, humanoides prontos para retargeting | precisa de contas/créditos; trolls costumam sair sem rig bom |
| B. Eu gero por script | mesmo método do Theo v3 (glTF-Transform, esqueleto próprio) para os 9 personagens | 100 % dentro do repositório, reprodutível | qualidade estilizada/"low-poly"; trolls e criaturas ficam simplificados |
| C. Híbrido | A para humanoides (Theo, Clara, Elias, Silas, Prisioneiro), B para criaturas | melhor custo/benefício | mais coordenação |

Recomendação: **C**. Em qualquer opção o Theo entra primeiro (Fase 1) e os demais só quando a fase que os usa for construída.
