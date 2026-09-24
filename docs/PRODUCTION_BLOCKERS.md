# PRODUCTION_BLOCKERS — O Último Rastro

Atualizado: 2026-09-24 (fase audiovisual **CONCLUÍDA** — detalhes em `FINAL_AUDIO_VIDEO_REPORT.md`)

## Estado do ambiente (sessão audiovisual)

| Recurso | Estado | Impacto |
|---|---|---|
| ComfyUI `:8188` | **OFFLINE neste container** (instância do autor: Windows/Vega11). Snapshot `comfyui/object_info.json` analisado: nós de áudio existem, **nenhum checkpoint de áudio/vídeo** | não usado nesta fase |
| HuggingFace | bloqueado (proxy 403) | Piper/Kokoro obtidos via GitHub Releases |
| Kokoro-82M ONNX + Piper pt_BR (CPU) | **instalados fora do repo** | TTS real, 3 idiomas |
| ffmpeg 6.1 / espeak-ng / sox (apt) | OK | encode, pitch, cutscenes |
| Node/Playwright | OK (Chromium pré-instalado 1194; Playwright 1.63 → `PW_EXECUTABLE_PATH`/fallback nos scripts) | testes/QA |
| Jogo runtime | OK, sem ComfyUI, sem 404 | — |
| ESLint | não instalado (`npm run lint` falha; não bloqueia) | — |

## Capacidades por categoria

### IMAGEM — ✅ PRODUZIDO (sessão anterior, inalterado)

### VOZ — ✅ PRODUZIDO
- 194 linhas reais (172 pt-BR, 11 en-US, 11 es-ES); 8 identidades vocais; sincronização por duração real.
- **Bloqueio de conteúdo (não técnico):** narrativa das fases e falas de personagens só existem em pt-BR → dublagem en/es dessas 161 linhas depende de tradução do roteiro. Elias não tem falas no roteiro.

### MÚSICA / SFX / AMBIÊNCIA — ✅ PRODUZIDO (procedural)
- 33 trilhas, 35 SFX, 17 ambiências — arquivos reais, validados (sem clipping, loudness controlada, loops limpos).
- Não há modelo generativo de áudio local (Stable Audio/ACE-Step exigem checkpoint; HF bloqueado). Síntese procedural é a alternativa local adotada; substituível por trilha autoral/modelo nos mesmos paths.

### CUTSCENES — ✅ PRODUZIDO (montagem FFmpeg)
- 10 cutscenes (16 vídeos com variantes en/es dos finais), WebM + MP4, legendas pelo jogo, fallback em passos.
- Geração de vídeo por modelo: **não necessária**.

### STT — N/A

## Decisões automáticas em vigor
1. Áudio só com arquivo real; nada marcado como pronto sem arquivo (validadores geram `docs/audio-validation.json` e `docs/video-validation.json`).
2. Cutscenes e áudio são opcionais e manifest-gated; runtime nunca depende do ComfyUI.
3. Paths centralizados: `SceneAudio`, `VoiceLines`, `Cutscenes`, registry, manifest.
4. `?nocutscenes=1` apenas para automação (smoke/final-qa); `final-qa-av.mjs` cobre cutscenes.

## Riscos operacionais conhecidos
- Repositório cresce ~130 MB com os binários de áudio/vídeo (OGG+MP3, WebM+MP4). Se for um problema, mover MP3/MP4 para LFS ou gerar sob demanda (`npm run video:build`).
- Piper pt_BR: leve desnasalização em vogais nasais (limitação do modelo). Alternativa documentada no relatório.
- Safari: reprodução via fallback MP3/MP4 (não testado em Safari real nesta sessão; Chromium testado).

## Gate de saída atual (2026-09-24, fase AV)
- `npm run test` → **126/126**
- `npm run build` → **OK**
- `node smoke-test.mjs` → **16/16**
- `node final-qa-av.mjs` → **31/31**
- `tools/audio/validate.py` → 279/279 · `tools/video/validate.mjs` → 32/32
