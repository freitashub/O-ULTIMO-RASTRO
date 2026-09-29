# Placeholders e aproximações registrados (seção 36 do prompt)

| Item | O que é | Onde | Substituição |
|---|---|---|---|
| Modelos dos 13 personagens | **Aproximações geradas por script** a partir da arte fornecida (não esculpidos): volumes simples, fiéis de frente, cor chapada nas laterais/costas | `godot/assets/characters/<id>/<id>.glb` (`tools/models/characters/*.mjs`) | modelos esculpidos/riggados, se o responsável fornecer (contrato do `CharacterRig`) |
| Animações | biblioteca procedural (idle, walk, run, talk, interact) | `godot/assets/animations/humanoid_library.res` | animações de animador/mocap; demais entram por fase |
| Troll Vigia | arte em perfil → de frente só cor chapada | `tools/models/characters/troll_vigia.mjs` | modelo esculpido |
| Sombra deformada do Theo (t2) | não modelada (a arte a mostra como sombra separada) | — | efeito de sombra na fase 14 |
| Cenário da Fase 1 | caixas com material procedural (ruído) e decalques procedurais; sem malhas modeladas | `godot/data/layouts/phase01.json` | fase de ARTE (blockout → gameplay → arte) |
| Fotografia/símbolo | quad sem imagem do símbolo | interativo `photo` | textura do símbolo |
| Textos de objetos da garagem | `authored: true` em `build-layout-phase01.mjs` (bancada, armário, marca de pneu na garagem) — a fonte narrativa não tem texto para eles | layout | revisão narrativa |
| Fase 2 | tela "ainda não construída" | `main.gd::_show_stub` | Fase 2 real |
| Menu | menu mínimo de QA | `scripts/main.gd` | menu final |
| Vozes | ainda não ligadas ao Godot (só texto) | — | `AudioDirector` + `voiceLines.json` |
