# Arquitetura 3D (Godot 4.4, renderer Compatibility)

A versão 3D vive em `godot/` e **não toca** no runtime Phaser (`src/`). Os dois compartilham os dados narrativos (`src/data`, `src/i18n`),
copiados por `tools/godot/sync-data.mjs` — a fonte única continua em `src/`.

```
godot/
  project.godot            Compatibility · 1280×720 · autoloads
  data/                    JSON sincronizados (phases, clues, symbols, i18n…) + layouts/ (3D)
  scripts/core/            GameStateModel, ChoiceSystem, SaveCodec (puros) + autoloads GameState, Data, I18n, Clues, SaveSystem, InputSetup
  scripts/camera/          CameraShot, CinematicCameraManager
  scripts/player/          PlayerTheo (CharacterBody3D)
  scripts/characters/      CharacterRig (GLB + AnimationPlayer/Tree), CharacterMaterial (shader de projeção da arte + contorno)
  scripts/interaction/     Interactable, InteractionSystem
  scripts/investigation/   InvestigationSystem
  scripts/phases/          PhaseBase, Phase01, LayoutBuilder, DoorNode, Quality
  scripts/ui/              Hud (prompt, diálogo, escolha, toast, fade)
  scripts/audio/           AudioDirector (autoload, catálogo em assets/audio/catalog.json)
  scenes/                  main.tscn (menu → fase), phases/phase_NN.tscn
  shaders/                 character_projection, character_outline
  tools/                   build_animations.gd, build_bonemap.gd (geração de recursos, rodam headless)
  assets/                  characters/<id>/<id>.glb (13), animations/humanoid_library.res, audio (só o que as fases prontas usam)
  tests/                   runner headless + suítes + qa_shots (capturas)
```

## Princípios

- **Dados guiam a fase.** Um layout JSON (`godot/data/layouts/phaseNN.json`, gerado por `tools/godot/build-layout-phaseNN.mjs`) descreve caixas com
  colisão, decalques, portas, luzes, interativos e câmeras. `LayoutBuilder` monta tudo. Blockout primeiro, arte depois.
- **Lógica narrativa idêntica à versão Phaser.** `ChoiceSystem`, esquema de save v3 e IDs de pistas/flags foram portados 1:1 e têm testes que
  comparam com o comportamento original (erro → `errors+1`, `transformationLevel+1`, flags `phase_N_correct/wrong`, `clue_<id>`).
- **Sem lógica em scripts por objeto.** Cada interativo carrega `on_interact` (tipo/texto/flag/pista); a fase decide o que fazer.
- **Uma fase por vez** (`docs/PHASE_PIPELINE.md`). `PhaseBase` cobre o que é comum; cada fase sobrescreve só o específico.
- **Desempenho:** `Quality` (0/1/2) limita sombras dinâmicas (uma SpotLight com sombra, resto sem), luzes de preenchimento e atlas.

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| GDScript puro, sem addons | zero dependências; testes headless próprios (`tests/`) |
| Layout por JSON gerado por script | reprodutível, diff legível, sem editor gráfico neste ambiente |
| Colisão real (`CharacterBody3D` + `StaticBody3D`) | substitui o controlador cinemático caseiro da versão Babylon |
| Câmeras: volumes AABB + prioridade + histerese (não `Area3D`) | seleção pura e testável sem física; sem custo por frame de sinais |
| Save em `user://save_current.json`, mesmo JSON v3 | no export Web `user://` é IndexedDB; compatível com os saves do Phaser |
| Personagens gerados por script da arte, mesmo esqueleto de 19 ossos | sem modelos 3D fornecidos; uma biblioteca de animações serve a todos (`docs/CHARACTER_PIPELINE.md`) |

## Fora de escopo por enquanto (regra: fase a fase)

Fases 2–20, Cubo de Orun 3D, finais, transformação visual de Theo, cutscenes em tempo real, vozes no Godot, export Web.
