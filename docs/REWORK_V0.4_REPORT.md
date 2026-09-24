# REWORK v0.4 — RELATÓRIO

Data: 2026-09-24 · Branch `claude/practical-hypatia-34fd8u` · Base do rework: `bab7534` (v0.3.0)

## O que mudou, por problema relatado

| Problema | Entregue | Verificação |
|---|---|---|
| **Áudio não funcionava** | Desbloqueio explícito no primeiro clique/tecla (`AudioHud.unlockAudioOnGesture`), indicador de estado (bloqueado / ativo / mudo) em todas as cenas, dica na tela de título, música só inicia após o desbloqueio. Sliders de Opções › Áudio agem ao vivo (master/música/ambiência/SFX/voz) e mute persiste. | `final-qa-av.mjs` #1 (Chromium **sem** flag de autoplay: `locked=false`, música tocando após 1 clique), #14/#14b (mute/unmute) |
| **Menu cobria o título / amador** | Título com arte de fundo, poeira em partículas, vinheta, tipografia serifada; menu em painel lateral com 5 itens (Novo jogo, Continuar, Extras ›, Opções ›, Apagar save), submenus, descrição do item e estado do save; navegação por teclado e mouse. | screenshots `final-qa-av-shots/00-title.png`, `01-menu.png`, `01b-menu-extras.png` |
| **Nada 2D, sem movimento, objetos descritos não apareciam** | `StoryScene` reescrita como **cena de exploração 2D**: Theo controlável (setas/WASD, clique para ir), sprite com rig procedural (respiração, passos, inclinação, sombra, perspectiva), **objetos da narrativa como hotspots** (casaco, relógio, janela, marcas de arrasto, carta, mapa, pedestal…), escolhas como **lugares na cena** (portas, salas, entradas) ou **diálogo com NPC** (Silas nas fases 13/19, Clara na 16), luz que segue Theo, parallax, clima (poeira/névoa/brasas), SFX de passos por piso, HUD (fase, objetivo, pistas, marca da transformação), atalhos 1-3. Layout das 20 fases em `src/data/scenes.json`. | `final-qa-av.mjs` #5–#10 (andar, hotspot abre painel, escolha na cena, consequência narrada); `smoke-test` 16/16; `final-qa` 23/23 (20 fases, puzzle, 3 finais) |
| **Personagens mal feitos** | Recorte automático de **uma pose** por folha (rembg/u2net), normalização (altura, contraste, contorno, sombra) → `public/assets/sprites/*.png`; rig procedural em vez de folha estática. **Limite:** sem GPU e sem acesso a checkpoints neste ambiente, a arte base continua a das folhas SD1.5; a inconsistência de estilo entre Theo (cartoon) e os demais permanece. Preparado `comfyui/batches/characters-v2.json` (7 jobs, estilo único, pose única, fundo neutro) + `cutout-characters.py --src … --single` para regenerar na sua GPU. | contact sheet dos sprites em `docs/` (ver §Sprites) |
| **Cutscenes amadoras / sem sentido** | Cutscenes **em engine** (`StageDirector`): personagens entram, andam e falam nos mesmos cenários da jogabilidade (Theo chega em casa e vai ao relógio; Clara aparece como vulto; troll surge no túnel e some; Silas e Theo frente a frente; ilusão dos pais se desfaz; transformação em três estágios; cubo; finais com os pais). Câmera (zoom/pan), tremor, flash, luz, clima, SFX e vozes sincronizadas com legendas. Pular/pausar/repetir. Os 32 vídeos FFmpeg (52 MB) foram removidos. | `final-qa-av.mjs` #2–#4 (Theo se move na cutscene, legenda, pausa, replay, skip), #10 (Clara em cena), #12b (final com voz/legenda EN) |

## Gate

| Verificação | Resultado |
|---|---|
| `npm run test` | **126/126** |
| `npm run build` | OK |
| `node smoke-test.mjs` | **16/16** |
| `node final-qa.mjs` | **23/23** (0 console errors, 0 network fails) |
| `node final-qa-av.mjs` | **29/29** |

Screenshots: `final-qa-av-shots/` (título, menu, cutscene de abertura, exploração com hotspot, escolha na cena, cutscene do desaparecimento, final EN, opções de áudio).

## Arquitetura (novos módulos)

- `src/ui/Atmosphere.ts` — fundo/vinheta/clima/luz/fontes; `src/ui/AudioHud.ts` — indicador + desbloqueio.
- `src/game/ActorSprite.ts` — rig procedural; `src/game/SpriteCatalog.ts` — catálogo (sem Phaser, testável).
- `src/game/SceneLayouts.ts` + `src/data/scenes.json` — layout 2D por fase.
- `src/systems/StageDirector.ts` + `src/data/cutscenes.json` (v2) — cutscenes em engine.
- `tools/assets/cutout-characters.py` — sprites; `comfyui/batches/characters-v2.json` — regeneração na GPU.
- `?nocutscenes=1` (automação) e `?renderer=canvas` (headless) — flags de URL, sem efeito no jogo normal.

## Sprites atuais (recortes das folhas existentes)

| id | origem | observação |
|---|---|---|
| theo | `char_theo.webp` pose única | cartoon, limpo |
| theo_t2 / theo_t4 | folhas de transformação | t4 = criatura azulada |
| clara | figura esquerda da folha | etérea (usada como vulto/ilusão) |
| elias | figura central, escurecida | a folha original **não tem rosto** → usado só como silhueta |
| silas | figura central superior | pintura, boa leitura |
| troll | figura central | alongado; usado com alfa oscilante ("aparição") |

## Bloqueios reais

1. **Arte de personagens em estilo único** exige geração de imagem (GPU/ComfyUI). Neste ambiente: sem GPU, HuggingFace/Civitai/ModelScope bloqueados → lote preparado para a sua máquina (`comfyui/batches/characters-v2.json`).
2. **Animação por spritesheet** (ciclo de andar desenhado) não existe; o movimento é procedural. Para ciclos desenhados, gerar frames na GPU (mesmo lote, poses "andando 1/2") e trocar `ActorSprite` para `Sprite` com animação — o resto do sistema não muda.
3. Vozes en/es completas e falas de Elias continuam dependendo de conteúdo (ver `FINAL_AUDIO_VIDEO_REPORT.md`).

## Como rodar

```bash
npm ci && npm run dev      # http://localhost:5173  (clique no título para ativar o som)
npm run test && npm run build
npm run qa:smoke && npm run qa:final && npm run qa:av   # com o dev server no ar
```
Controles: setas/WASD andar · clique ir até · E/Enter interagir · 1-3 investigar direto · Esc menu · cutscenes: Esc/Espaço pular, P pausar, R repetir.
