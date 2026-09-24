# AUDIO_VIDEO_PRODUCTION_PLAN — O Último Rastro

Data: 2026-09-24 · Base: `v0.2.0-visual-complete` (`c10b7c6`)

## 1. Auditoria (estado encontrado)

| Sistema | Estado em c10b7c6 |
|---|---|
| `AudioManager.ts` | canais master/music/sfx/voice/ambience, fade, mute — **nenhuma cena chama música/ambiência/voz** (só `ui_click` em Settings, sem arquivo) |
| `DialogueSystem.ts` | `voiceAsset` suportado, nunca preenchido |
| `SubtitleRenderer.ts` | funcional; usado só para 1ª linha do intro da fase (3,5 s fixos) |
| `CutscenePlayer.ts` | passos `dialogue/subtitle/wait/sfx/voice/camera`; sem passo de vídeo; nenhuma cena usa |
| `assetRegistry.json` pack `audio` | 12 entradas `optional` apontando para `/audio/*.mp3` **inexistentes** |
| `phases.json` | 20 fases referenciam `/assets/music/phaseNN_<emoção>.ogg` — **0/20 arquivos existem**; campo `ambience` nunca preenchido |
| `public/audio`, `public/assets/music`, `public/assets/video` | não existem |
| i18n | `subtitle.speaker.*` para theo/clara/elias/silas/troll/narrator |

### Inventário de assets faltantes

| Categoria | Necessário | Fonte do texto/trigger |
|---|---|---|
| VOICE | narrador: intro/scene/revelation/cliffhanger + 3 consequências × 20 fases; intro.text; 3 finais; inscrição do cubo; 5 dicas de transformação | `phases.json`, `i18n/*.json`, `cubeConfig.json` |
| VOICE | personagens: falas entre aspas já existentes no roteiro (Silas ×6, Clara ×4, troll ×4, prisioneiro ×3, criatura ×1); Theo: 3 perguntas centrais da bíblia (§3) | `phases.json`, `O ÚLTIMO RASTRO.md` |
| VOICE (en-US/es-ES) | somente linhas que possuem tradução real: intro, 3 finais, dicas de transformação, sexta face | `i18n/en-US.json`, `i18n/es-ES.json` |
| MUSIC | 20 trilhas de fase (paths já fixados em `phases.json`) + menu, créditos, cubo, transformação, 3 finais | mapa emocional §10 da bíblia |
| SFX | passos, portas, vento, chuva, papel, madeira, metal, impacto, objetos, suspense, criatura, troll, transformação, cubo, UI, investigação | prompt |
| AMBIENCE | cidade, casa, floresta, delegacia, interior, subterrâneo, trolls, caverna, cubo, finais | prompt + cenários das fases |
| CUTSCENE | abertura, desaparecimento, primeiro troll, revelações, chefe, transformação, cubo, final bom/ruim/secreto | assets visuais existentes |
| TRANSITION | stingers curtos entre Story→Choice→Cliffhanger, fade de música | — |

## 2. Recursos reais disponíveis neste ambiente

| Recurso | Estado | Uso |
|---|---|---|
| ComfyUI `127.0.0.1:8188` | **OFFLINE** neste container (roda na máquina Windows/Vega11 do autor). Snapshot `comfyui/object_info.json` (639 nós) analisado: nós de áudio locais existentes = `EmptyLatentAudio/VAEDecodeAudio/ConditioningStableAudio/TextEncodeAceStepAudio` (**sem checkpoint de áudio em `comfyui/models.json`**); TTS/SFX = ElevenLabs (cloud); vídeo = Wan/LTXV/Hunyuan (sem modelo local) + APIs cloud | não utilizável para áudio/vídeo sem modelos |
| HuggingFace | bloqueado pelo proxy (403) | — |
| PyPI, GitHub Releases, apt (Ubuntu 24.04) | acessíveis | instalação local |
| **Kokoro-82M ONNX** (`kokoro-onnx` + `kokoro-v1.0.onnx` + `voices-v1.0.bin`, GitHub Releases) | instalado, CPU | TTS pt-br / en-us / es (vozes pf_dora, pm_alex, pm_santa, af_*, am_*, ef_dora, em_*) |
| **Piper VITS pt_BR** (`sherpa-onnx`, vozes faber/cadu/jeff/edresson, GitHub Releases k2-fsa) | instalado, CPU | TTS pt-BR masculino (variedade de timbres) |
| ffmpeg 6.1 (libvpx-vp9, libopus, libx264, libvorbis, libmp3lame, rubberband, zoompan, xfade) | instalado via apt | codificação de áudio, pitch shift, cutscenes |
| espeak-ng, sox | instalados via apt | fonemização / fallback |
| numpy/scipy/soundfile | venv | síntese procedural de música/SFX/ambiência |

## 3. Decisões de produção

1. **Vozes**: geração neural local (Kokoro + Piper). Identidade vocal por personagem definida em `tools/audio/voices.py` (voz base + velocidade + pitch + processamento). Nenhuma fala inventada: linhas vêm de `phases.json`, `i18n` e da bíblia.
2. **Música/ambiência/SFX**: não existe modelo generativo de áudio local (Stable Audio/ACE-Step exigiriam checkpoint + GPU; HF bloqueado). Alternativa local técnica adequada: **síntese procedural determinística** (`tools/audio/*.py`, seed fixa por trilha) — arquivos reais, loops limpos, normalizados a −16 LUFS (música/ambiência) e −18 LUFS (SFX), pico ≤ −1 dBTP. Rotulado no relatório como *procedural*; substituível por trilha autoral/modelo quando disponível sem mudar integração.
3. **Cutscenes**: montagem cinematográfica com ffmpeg a partir de backgrounds/personagens/finais/transformação existentes (zoom, pan, xfade, vinheta, grão, letterbox) + mix de voz/música/ambiência/SFX. Saída **WebM (VP9+Opus)** e fallback **MP4 (H.264+AAC)**, 1280×720@24. Legendas renderizadas pelo jogo a partir de cues sincronizadas em `cutscenes.json`. Fallback final: sequência de passos do `CutscenePlayer` sobre a imagem estática.
4. **Formatos de áudio**: OGG Vorbis (primário) + MP3 (fallback Safari). Phaser recebe `[ogg, mp3]`.
5. **Paths** (nunca espalhados no código; centralizados em registry/manifest/`voiceLines.json`/`cutscenes.json`):
   - `/assets/music/*.ogg|mp3` (paths de `phases.json` preservados)
   - `/assets/audio/ambience/*.ogg|mp3`
   - `/assets/audio/sfx/*.ogg|mp3`
   - `/assets/audio/voice/{pt-BR,en-US,es-ES}/*.ogg|mp3`
   - `/assets/video/cutscenes/*.webm|mp4`
6. **Runtime**: continua sem ComfyUI; assets são opcionais e gateados pelo manifest.

## 4. Sequência de execução
1. Vozes → `voiceLines.json`
2. Música / SFX / ambiência → manifest
3. Cutscenes → `cutscenes.json`
4. Integração (AudioManager helpers, VoiceLines, CutscenePlayer `video`, cenas, registry, manifest builder)
5. QA: `npm run test`, `npm run build`, `node smoke-test.mjs`, `node final-qa.mjs` (+ checks de áudio/vídeo)
6. Docs: `PRODUCTION_BLOCKERS.md`, `PRODUCTION_FINAL_REPORT.md`, `FINAL_AUDIO_VIDEO_REPORT.md`

## 5. Status de execução (2026-09-24)

| Etapa | Estado |
|---|---|
| 1. Vozes → `voiceLines.json` | ✅ 194 linhas |
| 2. Música / SFX / ambiência | ✅ 33 / 35 / 17 |
| 3. Cutscenes → `cutscenes.json` + WebM/MP4 | ✅ 10 (+6 variantes) |
| 4. Integração | ✅ (SceneAudio, VoiceLines, Cutscenes, CutscenePlayer `video`, CutsceneScene, cenas, registry, manifest) |
| 5. QA | ✅ test 126/126 · build OK · smoke 16/16 · final-qa-av 31/31 · áudio 279/279 · vídeo 32/32 |
| 6. Docs | ✅ `PRODUCTION_BLOCKERS.md`, `PRODUCTION_FINAL_REPORT.md`, `FINAL_AUDIO_VIDEO_REPORT.md` |
