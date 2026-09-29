# Placeholders registrados (seção 36 do prompt)

| Item | O que é | Onde | Substituição |
|---|---|---|---|
| Corpo do Theo | GLB procedural v3 (19 ossos + marcador), gerado da arte de referência por `tools/models/build-theo-glb.mjs` | `godot/assets/characters/placeholder/theo_v3_placeholder.glb` | modelo 3D real do Theo (não fornecido) |
| Animação do Theo | procedural por código (`TheoPlaceholderRig`) | `godot/scripts/player/theo_placeholder_rig.gd` | `AnimationPlayer` + `AnimationTree` com animações reais |
| Cenário da Fase 1 | caixas com material procedural (ruído) e decalques procedurais; sem malhas modeladas | `godot/data/layouts/phase01.json` | fase de ARTE (depois de blockout → gameplay) |
| Fotografia/símbolo | quad sem imagem do símbolo | interativo `photo` | textura do símbolo (arte) |
| Textos de objetos da garagem | "authored: true" em `build-layout-phase01.mjs` (bancada, armário, marca de pneu na garagem) — a fonte narrativa não tem texto para eles | layout | revisão narrativa |
| Fase 2 | tela "ainda não construída" | `main.gd::_show_stub` | Fase 2 real |
| Menu | menu mínimo de QA | `scripts/main.gd` | menu final |
