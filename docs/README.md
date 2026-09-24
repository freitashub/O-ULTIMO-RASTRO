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
- [Produção audiovisual (vozes, música, SFX, cutscenes)](FINAL_AUDIO_VIDEO_REPORT.md)
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

- `AudioManager`: music, ambience, sfx, voice (uma por vez, pause/resume); master/mute/fade; `refreshVolumes()` após carregar save.
- `SceneAudio`: único ponto que resolve ids → paths (`music.json`, `sfx.json`, `ambience.json`, `voiceLines.json`) e carrega sob demanda (manifest-gated, OGG + MP3).
- `VoiceLines`: catálogo de vozes por id + idioma com fallback pt-BR; ids `phaseNN_intro|scene|revelation|cliffhanger|choice_x`.
- `SubtitleRenderer`: cues com speaker, tamanho, fundo, posição; sincronizadas à duração real da voz.
- `SettingsScene`: sliders master/música/ambiência/SFX/voz + mute, aplicados ao vivo.
- Assets de áudio são **opcionais** (registry `optional: true`); ausência não quebra o jogo.
- Geração: `tools/audio/{voices,music,sfx,ambience}.py` · validação `npm run audio:validate`.

## Diálogos e Cutscenes

- `DialogueSystem`: play/pause/resume/skip/replay, textSpeed.
- `CutscenePlayer`: steps dialogue/subtitle/wait/sfx/voice/camera/**video** (cues de legenda sincronizadas, pausa/retomada, `onError` → fallback).
- `Cutscenes` + `src/data/cutscenes.json`: 10 cutscenes com gatilhos `beforePhase`/`beforePuzzle`/`ending`; `startWithCutscene()` roteia cenas; flag `cutscene_seen_<id>` no save; `?nocutscenes=1` só para automação.
- `CutsceneScene`: WebM/MP4 (`ensureVideo`), PULAR (Esc/Espaço/Enter), pausa (P), replay (R), fallback sem vídeo.
- Vídeos: `npm run video:build` (FFmpeg) · `npm run video:validate`.

## Asset Registry

- `src/data/assetRegistry.json` + `src/game/AssetRegistry.ts`.
- Packs: `core` (JSONs obrigatórios), `audio`, `voice`, `video`, `images` (opcionais). Packs AV regenerados por `npm run assets:registry`.
- `PreloadScene` carrega entradas do registry; `loaderror` é tolerado.

## Testes

```bash
npm run test      # unit (Vitest)
npm run build     # tsc --noEmit + vite build
node smoke-test.mjs  # e2e (requer dev server em :5173)
node final-qa.mjs    # QA completo (gameplay, sem cutscenes)
node final-qa-av.mjs # QA audiovisual (cutscenes, legendas, música, voz, mute, idioma)
```

Regras de ending (preservadas da spec):

- `errors >= 2` → **bad**
- `errors == 0 && cube.solved && 5 símbolos && hidden_truth` → **secret**
- senão → **good**
