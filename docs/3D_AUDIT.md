# 3D AUDIT — migração para Godot (passos 1–2 e 38 do prompt mestre)

Data: 2026-09-29 · Ambiente: container Claude Code (Ubuntu 24.04, 4 núcleos, sem GPU) · Branch `claude/practical-hypatia-34fd8u`.

Checkpoint antes da migração: tag local `checkpoint-phaser-babylon-before-godot` (= `68f80ac`). Pushes de tag retornam 403 nesta sessão; a
tag existe só no container. O commit é o ponto de retorno definitivo.

## 1. Repositórios e ferramentas no ambiente

| Item | O que é | Onde | Decisão |
|---|---|---|---|
| **Godot 4.4.1-stable** (binário oficial) | Engine | `/opt/godot-dl/Godot_v4.4.1-stable_linux.x86_64` (fora do repo) | **Engine principal.** Roda headless e renderiza via Xvfb + llvmpipe (OpenGL 3.3, Compatibility). |
| `godotengine/godot` (código-fonte, tag `4.4.1-stable`) | Fonte da engine (342 MB) | `/opt/src/godot` (fora do repo) | Referência. Não compilada (faltam scons/tempo; binário oficial basta). Nada dele entra no jogo. |
| `leigest519/OpenGame` | Gerador agêntico de jogos (Phaser) | scratchpad da sessão | Referência histórica. Não é engine, não tem sistemas reutilizáveis para Godot. **Fora do projeto final.** |
| ComfyUI | Gerador de imagens | não presente neste container | Fora do projeto (o runtime nunca depende dele). |
| Babylon.js 9.28 | Runtime 3D do vertical slice web | `node_modules` do projeto Phaser | **Não é usado no Godot.** Fica como referência do desenho (layout, colisão, câmeras) e como fallback web enquanto a migração não termina. |
| O3DE | — | não presente | Não adotado. |
| Export templates da Godot (Web) | Necessários para `godot --export-release Web` | não baixados (~1 GB) | Pendente; ver risco R3. |

Nada de engines alternativas foi copiado para dentro do jogo. Dependências novas no projeto final: nenhuma (GDScript puro, sem addons).

## 2. Projeto Phaser atual (fonte de verdade narrativa)

- Phaser 4.2 + TypeScript + Vite; ~2 500 linhas em `src/game` + `src/systems`; 20 arquivos de teste, 144 testes.
- **Dados** (reutilizados sem alteração): `src/data/phases.json` (20 fases, 3 escolhas cada), `clues.json` (21), `symbols.json`, `cubeConfig.json`,
  `voiceLines.json`, `music/sfx/ambience.json`, `src/i18n/{pt-BR,en-US,es-ES}.json` (109 chaves de UI cada; textos de fase só em pt-BR).
- **Sistemas a preservar** (portados fielmente para GDScript, mesma lógica e mesmos IDs):

| Phaser | Godot |
|---|---|
| `GameState` + `types/GameState` (schema v3) | autoload `GameState` + `GameStateModel` |
| `SaveManager` (IndexedDB) | `SaveSystem` (`user://`, que no Web vira IndexedDB; mesmo JSON v3, com `migrate`) |
| `ChoiceSystem.resolveChoice` | `ChoiceSystem.resolve` |
| `ClueSystem` | autoload `Clues` |
| `TransformationSystem` | `Transformation` |
| `DialogueSystem`, `SubtitleRenderer` | `DialogueBox` (legenda + texto) |
| `AudioManager`, `AssetRegistry` | `AudioDirector` (catálogo JSON) |
| `EndingSystem`, `CubePuzzle`, `CutscenePlayer` | fases 20/puzzle — **não iniciados** (regra: uma fase por vez) |

- Vertical slice Babylon (Fase 1, garagem): reaproveitado só como desenho (medidas em metros, câmeras de canto, raio de interação, raycast de linha de visão).

## 3. Personagens fornecidos — **ACHADO CRÍTICO**

Pasta indicada: `C:\Users\Wind11\Downloads\JOGO WEB (ÚLTIMO RASTRO)\personagens 3d`. Recebida como `personagens_3d.zip` e guardada em
`assets_fornecidos/personagens_3d/` (nomes normalizados).

**Conteúdo: 13 imagens JPG (768×1376), arte de conceito 2D de corpo inteiro. Não há nenhum modelo 3D** (sem GLB/glTF/FBX/OBJ/BLEND, sem
esqueleto, sem malha, sem animação).

| Arquivo | Personagem |
|---|---|
| `theo.jpg` | Theo (idêntico à referência já usada, diff 1,1/255) |
| `transformacao_theo_01..04.jpg` | Theo nas etapas de transformação (01 sombra deformada; 02–04 orelhas, palidez, garras) |
| `clara.jpg`, `elias.jpg`, `prisioneiro.jpg` | Clara, Elias, Prisioneiro (acorrentado) |
| `silas.jpg`, `silas_troll.jpg` | Silas humano e Silas troll (distintivo, casaco militar) |
| `troll_ferreiro.jpg`, `troll_guardiao.jpg`, `troll_vigia.jpg` | Troll Ferreiro, Guardião, Vigia |

Consequência: os passos 4–5 do prompt (importar/validar rig, skinning, retargeting) **não têm o que validar**. Os itens 1–18 da seção 5 do prompt só
se aplicam a modelos reais. Ver `docs/PHASE_PIPELINE.md` e o relatório da Fase 1 para as opções e a decisão pendente.

Enquanto isso, o único corpo 3D existente é o **Theo v3 procedural** (gerado por script a partir da arte; esqueleto de 19 ossos). Ele entra na
Godot como **placeholder registrado** (`docs/PLACEHOLDERS.md`), permitido apenas durante blockout (seção 36).

## 4. Ambiente Godot

- 4.4.1 estável, `--headless` OK; renderização real testada: `xvfb-run` + `--rendering-driver opengl3` → `llvmpipe (LLVM 20.1.2)`, captura 1152×648.
- Áudio: sem placa de som (driver dummy) — esperado no container.
- Renderer: **Compatibility (gl_compatibility)**, conforme seção 3.

## 5. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | Sem modelos 3D reais, "personagem pronto" (seção 36) não é atingível | decisão do responsável (docs/PHASE_PIPELINE.md); Fase 1 não recebe PASS antes |
| R2 | Sem GPU: só validação lógica (headless) e visual por software | capturas Xvfb para composição/câmeras; desempenho real deve ser medido na máquina do usuário |
| R3 | Export Web exige templates (~1 GB) e teste em navegador | baixar templates quando a Fase 1 estiver estável; manter o build Phaser/Babylon como fallback |
| R4 | Dois runtimes no mesmo repositório | Godot isolado em `godot/`; dados compartilhados por script (`tools/godot/sync-data.mjs`), sem editar a fonte em dois lugares |
