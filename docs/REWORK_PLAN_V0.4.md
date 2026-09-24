# REWORK PLAN v0.4 — jogabilidade 2D, personagens, menu, áudio, cutscenes

Data: 2026-09-24 · Base: `bab7534` (branch `claude/practical-hypatia-34fd8u`)

## Diagnóstico (o que está errado, por ordem de importância)

| # | Problema relatado | Causa encontrada | Ação |
|---|---|---|---|
| 1 | "Nada 2D, sem movimentação, os objetos descritos não aparecem" | `StoryScene` é um painel de texto sobre um background estático. Não há personagem controlável, hotspots, objetos nem câmera. As 21 pistas têm ícones (`public/images/clues/*.png`) que nunca aparecem na cena. | **Nova `ExploreScene`**: Theo anda (teclado/clique), objetos da cena como hotspots (casaco, relógio, marca de pneu…), escolhas viram lugares para investigar, câmera segue, parallax, partículas (chuva, poeira, névoa), luz. Dados em `src/data/scenes.json`. |
| 2 | "Áudio não funcionou" | Áudio depende do primeiro gesto do usuário (política dos navegadores); não há indicador visível nem desbloqueio explícito; se o jogo for aberto via `file://` ou de um build antigo (`main`) nada toca. | Desbloqueio explícito no primeiro clique/tecla, indicador 🔊/🔇 em todas as cenas, teste em Chromium **sem** flag de autoplay, aviso na tela do título. |
| 3 | "Menu cobre o título, amador" | 10 botões empilhados a partir de `height/2 - 300`, sobrepondo o título em y=100; sem arte, sem hierarquia. | Título com arte de fundo, chuva e vinheta; menu principal com 5 itens e submenus (Extras, Opções); tipografia serifada; navegação por teclado mantida. |
| 4 | "Personagens mal feitos" | Folhas de concept (3–6 poses, fundo cinza, rabiscos) usadas inteiras como "personagem"; estilos inconsistentes entre folhas (Theo cartoon, Silas pintura, Clara/troll etéreos). | **Sem GPU e sem acesso a checkpoints neste ambiente** (HF/Civitai/ModelScope bloqueados). Feito aqui: recorte automático (rembg/u2net, obtido do GitHub) de **uma pose** por personagem → sprites transparentes, normalizados (altura, contraste, contorno, sombra) + **rig procedural** (respiração, passo, inclinação, flip). Preparado para a sua GPU: lote ComfyUI `comfyui/batches/characters-v2.json` com prompts de estilo único e pipeline de recorte. |
| 5 | "Cutscenes não fazem sentido / amadoras" | Vídeos Ken Burns sobre folhas de concept; sem personagens em cena, sem relação com o local. | Cutscenes **dentro da engine** (`StageDirector`): mesmos cenários e sprites da jogabilidade, personagens entram/andam/falam, câmera, luz e partículas; roteiro em `cutscenes.json` (ações). Vídeos FFmpeg removidos do runtime (ferramenta mantida). |

## Etapas (ordem de execução)

1. **E1 Áudio** — desbloqueio + indicador + teste real.
2. **E2 Menu/Título** — redesenho.
3. **E3 Sprites** — recorte + normalização + rig procedural.
4. **E4 Jogabilidade 2D** — `ExploreScene`, `scenes.json` (20 fases), hotspots, câmera, partículas, HUD, integração com `ChoiceScene`.
5. **E5 Cutscenes em engine** — `StageDirector`, roteiros por ação, remoção dos vídeos.
6. **E6 QA/Docs** — `final-qa.mjs`/`smoke-test.mjs`/`final-qa-av.mjs` atualizados, testes unitários, relatório, lote ComfyUI para GPU.

Cada etapa termina com testes + commit.
