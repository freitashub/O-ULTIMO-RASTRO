# ComfyUI Client (pipeline externo)

Cliente opcional para geração de assets via **ComfyUI**.  
NÃO é dependência do build nem do gameplay — o jogo roda 100% sem ComfyUI.

## Configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `COMFYUI_BASE_URL` | `http://127.0.0.1:8188` | URL base do servidor ComfyUI |

Defina no ambiente do **pipeline de assets** (não no Vite build):

```bash
export COMFYUI_BASE_URL=http://127.0.0.1:8188
```

## Uso

```bash
# Verificar se o ComfyUI está no ar
node tools/comfyui/check.mjs

# Gerar assets de exemplo (requer ComfyUI rodando)
node tools/comfyui/generate.mjs
```

## Estrutura

- `tools/comfyui/check.mjs` — health check
- `tools/comfyui/generate.mjs` — dispara workflows
- `comfyui/workflows/` — JSONs de workflow

## Regras

1. Nunca importar cliente ComfyUI dentro de `src/` do jogo.
2. Nunca quebrar build se ComfyUI estiver offline.
3. Saídas em `public/images/` ou `public/audio/` apenas como opcionais.
4. Assets gerados seguem o mesmo contrato do `assetRegistry.json`.

## Áudio / vídeo (fase AV, 2026-09-24)

- O ComfyUI **não foi usado** para áudio/vídeo: o snapshot `comfyui/object_info.json` contém nós de áudio
  (`EmptyLatentAudio`, `VAEDecodeAudio`, `ConditioningStableAudio`, `TextEncodeAceStepAudio`) mas
  `comfyui/models.json` não lista nenhum checkpoint de áudio; TTS/SFX só existem como nós cloud
  (ElevenLabs/Stability) e os nós de vídeo (Wan/LTXV/Hunyuan) não têm modelos locais.
- Pipeline audiovisual local adotado: `tools/audio/*.py` (Kokoro/Piper + síntese procedural) e
  `tools/video/build-cutscenes.mjs` (FFmpeg). Ver `docs/FINAL_AUDIO_VIDEO_REPORT.md`.
- Se um checkpoint de áudio for instalado no ComfyUI do autor, um workflow pode produzir as trilhas nos
  mesmos paths de `src/data/music.json` sem alteração de runtime.
