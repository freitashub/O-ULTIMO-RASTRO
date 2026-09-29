# PHASE 01 — A Casa Vazia (Godot 3D, vertical slice)

**STATUS: IMPLEMENTADA E TESTADA — SEM PASS.** Motivo: o critério de PASS exige personagem real com rig e animações (seção 18/36 do prompt), e os
modelos 3D não existem (a pasta fornecida tem 13 imagens 2D; ver `docs/3D_AUDIT.md §3`). Tudo o que não depende dos modelos está pronto e verde.

## Objetivo

Provar a arquitetura 3D (câmeras fixas, locomoção com colisão, interação, investigação, escolhas físicas, save, transição) com a Fase 1:
sala → três portas (quarto da mãe / garagem / cozinha) → garagem (marca de pneu + fotografia) → Fase 2.

## O que foi implementado

- **Ambientes (blockout):** sala (8×7 m), varanda (a marca de pneu visível pela porta de entrada, como na justificativa da fase) e garagem (8×7 m),
  com paredes, vãos, três portas com dobradiça, mobília, decalques (pneu, óleo, poça), 5 luzes (1 spot com sombra) e névoa fria.
- **Theo jogável:** `PlayerTheo` (CharacterBody3D), andar/correr, controles relativos à câmera com base congelada, estados idle/walk/run/interact/talk/cinematic.
- **Câmeras cinematográficas:** 5 shots (`sala_entrada`, `sala_portas`, `varanda`, `garagem_entrada`, `garagem_fundo`), blend 0,55 s, histerese 0,5 m.
- **Interação:** 10 interativos (relógio parado, casaco da mãe, marca de pneu da varanda, 3 portas-escolha, marca de pneu/bancada/armário/fotografia da garagem).
- **Investigação:** flags `saw_stopped_clock`, `saw_mother_coat`, `saw_tire_mark`, `found_photo_symbol`; pista `tire_mark` pela escolha correta.
- **Escolha física:** interagir com qualquer porta abre "Onde procurar agora?" (a porta tocada vem pré-selecionada); mesma lógica/consequências do Phaser.
- **Fluxo:** rota correta → porta da garagem abre, examina marca de pneu e fotografia → gancho → save → Fase 2. Rotas erradas → consequência, erro registrado,
  revelação + gancho (como na versão Phaser) → save → Fase 2.
- **Áudio:** passos, porta, investigar, pista, erro, confirmação, ambiência da casa e música da fase (13 arquivos, 1,5 MB).
- **UI:** prompt, objetivo, contador de pistas, diálogo com máquina de escrever (velocidade pelas configurações de acessibilidade), painel de escolha (1-3/↑↓/Enter/mouse), toasts, fade.

## Assets e personagens

- Theo: **placeholder** (GLB procedural v3 + animação por código). Demais personagens: não usados na Fase 1.
- Todos os placeholders: `docs/PLACEHOLDERS.md`.

## Testes realizados (`npm run godot:test`, headless)

**34/34 testes, 182 asserções, 0 falhas.** Destaques:

| Item do teste obrigatório (seção 19/25) | Teste |
|---|---|
| Theo aparece, câmera funciona | `test_spawn_e_camera_inicial`, `test_troca_de_camera_por_zona` |
| Theo anda, colisão funciona | `test_colisao_com_parede_norte`, `test_controles_relativos_a_camera_e_base_congelada` |
| Porta funciona | `test_porta_fechada_bloqueia_e_aberta_libera` |
| Objetos/interação/pista | `test_foco_e_prompt_do_casaco`, `test_exame_registra_flag`, `tests/test_interaction.gd` |
| Escolha correta / errada / erro registrado | `test_rota_correta_garagem_pista_save_e_transicao`, `test_rotas_erradas_registram_erro_e_avancam`, `test_core.gd` |
| Save, recarregar, continuar | `test_save_em_disco`, `test_rota_correta_…` (reset → `continue_game`) |
| Próxima fase abre | mesmos testes (`finished(2)`, `currentPhase = 2`, save aponta para 2) |
| Theo nunca oculto pelas câmeras | `test_theo_sempre_visivel_das_cameras` (raios em toda a malha caminhável, cabeça + tronco) |
| Animação / orientação | `test_animacao_placeholder_pernas_alternam`, `test_frente_do_modelo_aponta_para_a_direcao` |

Também: inicialização do jogo sob Xvfb (menu e `--phase=1`) sem `SCRIPT ERROR`; capturas reais em `docs/phases/phase01/cameras.jpg` e `ui.jpg`
(llvmpipe, OpenGL 3.3). Regressão Phaser: `npm test` 146/146 e `npm run build` OK (nada do runtime web foi alterado).

## Problemas encontrados e corrigidos

| Problema | Correção |
|---|---|
| Estante escondia o Theo na câmera da garagem | estante baixada (1,6 m); teste de oclusão agora cobre toda a malha |
| Bancada escondia o torso atrás dela (câmera do fundo) | bancada encurtada e deslocada |
| Câmera da varanda (dentro da sala) não via os cantos da varanda | câmera movida para fora, olhando a fachada |
| `nose` do GLB vira osso no importador da Godot | rig usa `skeleton` (osso `nose`) |
| Autoloads e `add_child` durante o `_ready` do runner | runner aguarda 1 frame |
| Textura procedural "nublada" e decalques com borda dura | ruído suave; máscara de alfa (trilhos de pneu e mancha) |

## Pendências que impedem o PASS

1. **Personagem real (rig + animações)** — decisão do responsável (`docs/PHASE_PIPELINE.md`).
2. **Arte do cenário** (hoje blockout com materiais procedurais) e o símbolo na fotografia.
3. **Vozes** (`voiceLines.json`) ainda não integradas no Godot; hoje só texto.
4. **Export Web e desempenho medido** (sem GPU/templates aqui).
5. Textos de 3 objetos da garagem marcados `authored` (revisão narrativa).

## Desempenho observado

Sem GPU: só validação lógica. Orçamento de projeto: 1 luz com sombra, 4 omni sem sombra, ~40 malhas, texturas 128², áudio 1,5 MB. A medir no computador do usuário (`Quality.level`).

STATUS: NÃO-PASS (bloqueada por pendência 1)
