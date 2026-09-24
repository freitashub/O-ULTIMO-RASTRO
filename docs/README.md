# O Último Rastro — Documentação

## Índice

- [Arquitetura](#arquitetura)
- [Fases e Narrativa](#fases-e-narrativa)
- [Save System v3](#save-system-v3)
- [i18n](#i18n)
- [Áudio e Legendas](#áudio-e-legendas)
- [Diálogos e Cutscenes](#diálogos-e-cutscenes)
- [Asset Registry](#asset-registry)
- [ComfyUI (pipeline externo)](COMFYUI.md)
- [Testes](#testes)

## Arquitetura

Stack: **TypeScript + Phaser 4 + Vite + Vitest + Playwright**

```
src/
  main.ts              # bootstrap Phaser
  config/gameConfig.ts
  types/               # GameState v3, Phase, Clue, Symbol
  data/                # phases.json, clues.json, symbols.json, cubeConfig.json, assetRegistry.json
  game/                # GameState, SaveManager, Choice/Clue/Symbol/Ending systems, AudioManager, AssetRegistry, EndingResolver
  systems/             # PhaseLoader, PhaseValidator, DialogueSystem, SubtitleRenderer, CutscenePlayer
  scenes/              # Boot → Preload → Title → Menu → Intro/Story/Choice/... → Puzzle → Ending
  i18n/                # pt-BR, en-US, es-ES + t()
  ui/                  # painéis e botões
```

Cadeia narrativa obrigatória:

```
STORY → CHOICE → CONSEQUENCE → REVELATION → CLIFFHANGER → NEXT
```

3 escolhas por fase, 1 correta.

## Fases e Narrativa

- **20 fases** em `src/data/phases.json` (+ espelho em `public/data/`).
- Fases respiro: **4, 6, 8, 10**.
- Símbolos: fase 2→olho, 3→lua, 5→mao, 9→corvo, 14→arvore.
- Todas as fases possuem `revelation` e `cliffhanger`.
- Conteúdo extraído de `O ÚLTIMO RASTRO.md` e `O ÚLTIMO RASTRO - SOFTWARE.md`.

## Save System v3

- IndexedDB `ultimo_rastro`, store `saves`, chave `current`.
- `SAVE_VERSION = 3`.
- Migração: v1→v2 (cube), v2→v3 (flags, unlockedEndings, language, audio/subtitle/accessibility settings).
- `migrateSave()` é puro e testado.

### Campos v3 novos

- `flags: Record<string, boolean>`
- `unlockedEndings: Array<'good'|'bad'|'secret'>`
- `language: 'pt-BR'|'en-US'|'es-ES'`
- `audioSettings`, `subtitleSettings`, `accessibilitySettings`

## i18n

- `t(key, params?)` com fallback pt-BR.
- Dicionários: `src/i18n/{pt-BR,en-US,es-ES}.json`.
- Troca de idioma no menu (ciclo) e persistência no save.
- Chaves ausentes em DEV emitem `console.warn`.

## Áudio e Legendas

- `AudioManager`: music, ambience, sfx, voice; master/mute/fade.
- `SubtitleRenderer`: cues com speaker, tamanho, fundo, posição.
- `SettingsScene`: abas Áudio / Legendas / Acessibilidade.
- Assets de áudio são **opcionais** (registry `optional: true`); ausência não quebra o jogo.

## Diálogos e Cutscenes

- `DialogueSystem`: play/pause/resume/skip/replay, textSpeed.
- `CutscenePlayer`: steps dialogue/subtitle/wait/sfx/voice/camera.
- Ambos sem dependência de assets obrigatórios.

## Asset Registry

- `src/data/assetRegistry.json` + `src/game/AssetRegistry.ts`.
- Packs: `core` (JSONs obrigatórios), `audio`, `images` (opcionais).
- `PreloadScene` carrega entradas do registry; `loaderror` é tolerado.

## Testes

```bash
npm run test      # unit (Vitest)
npm run build     # tsc --noEmit + vite build
node smoke-test.mjs  # e2e (requer dev server em :5173)
```

Regras de ending (preservadas da spec):

- `errors >= 2` → **bad**
- `errors == 0 && cube.solved && 5 símbolos && hidden_truth` → **secret**
- senão → **good**
