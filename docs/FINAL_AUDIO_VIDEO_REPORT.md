# FINAL_AUDIO_VIDEO_REPORT — O Último Rastro

Data: 2026-09-24 · Base: `v0.2.0-visual-complete` (`c10b7c6`) · Branch: `claude/practical-hypatia-34fd8u`

Todos os números abaixo vêm de arquivos reais no repositório e de execuções reais registradas em
`docs/audio-validation.json`, `docs/video-validation.json`, `docs/video-build.json`,
`final-qa-results.json`, `final-qa-av-results.json`.

---

## 1. Resumo

| Categoria | Produzido | Arquivos reais | Integração | Estado |
|---|---:|---|---|---|
| VOICE | 194 linhas (172 pt-BR · 11 en-US · 11 es-ES) | `public/assets/audio/voice/<lang>/*.ogg` + `.mp3` (388 arquivos, 14 MB) | StoryScene, ChoiceScene, EndingScene, CutsceneScene | **CONCLUÍDO** |
| MUSIC | 33 trilhas (20 fases + menu, créditos, investigação, suspense, descoberta, perseguição, trolls, caverna, cubo, transformação, 3 finais) | `public/assets/music/*.ogg` + `.mp3` (66 arquivos, 47 MB, 31,9 min) | todas as cenas via `SceneAudio` | **CONCLUÍDO** (procedural) |
| SFX | 35 efeitos | `public/assets/audio/sfx/*.ogg` + `.mp3` (70 arquivos) | UI, escolhas, cubo, cutscenes | **CONCLUÍDO** (procedural) |
| AMBIENCE | 17 loops de 40 s | `public/assets/audio/ambience/*.ogg` + `.mp3` (34 arquivos) | 20 fases (`phases.json.ambience`), puzzle, finais, créditos | **CONCLUÍDO** (procedural) |
| CUTSCENE | 10 cutscenes (+ variantes en-US/es-ES dos 3 finais) | `public/assets/video/cutscenes/*.webm` + `.mp4` (32 arquivos, 52 MB) | `CutsceneScene` por gatilho | **CONCLUÍDO** |
| TRANSITION | stingers (sfx_suspense_sting), crossfade de música (1,2 s), fade-out de cena | — | ChoiceScene/CutsceneScene | **CONCLUÍDO** |

**Gate final executado nesta sessão**

| Verificação | Resultado |
|---|---|
| `npm run test` | **126/126** (19 arquivos; +15 testes novos) |
| `npm run build` (`tsc --noEmit && vite build`) | **OK** |
| `node smoke-test.mjs` | **16/16**, 0 erros de página (favicon corrigido em `index.html`) |
| `node final-qa.mjs` | ver `docs/FINAL_QA_REPORT.md` (seção AV) |
| `node final-qa-av.mjs` (novo) | **31/31** |
| `python3 tools/audio/validate.py` | 279 arquivos OGG, **0 problemas** |
| `node tools/video/validate.mjs` | 32 vídeos, **32 ok**, 0 telas pretas inesperadas |
| Chamadas ao ComfyUI no runtime | **0** (verificado em QA) |

---

## 2. Ambiente e recursos realmente usados

| Recurso | Como foi obtido | Uso |
|---|---|---|
| ComfyUI `127.0.0.1:8188` | **offline neste container** (instância do autor é Windows/Vega11). Snapshot `comfyui/object_info.json` (639 nós) inspecionado: nós de áudio locais (`EmptyLatentAudio`, `VAEDecodeAudio`, `ConditioningStableAudio`, `TextEncodeAceStepAudio`) **sem checkpoint** em `comfyui/models.json`; TTS/SFX apenas via nós cloud (ElevenLabs, Stability); vídeo local (Wan/LTXV/Hunyuan) sem modelos | não utilizado |
| HuggingFace | bloqueado pelo proxy (403) | — |
| **Kokoro-82M ONNX** (`kokoro-v1.0.onnx` 325 MB + `voices-v1.0.bin`, GitHub Releases `thewh1teagle/kokoro-onnx`) + `kokoro-onnx` (PyPI) | download direto, CPU | TTS pt-br/en-us/es |
| **Piper VITS pt_BR** (`faber`, `cadu`, `jeff`, `edresson`; GitHub Releases `k2-fsa/sherpa-onnx` tts-models) + `piper-tts` 1.8 (PyPI) | download direto, CPU | timbres masculinos pt-BR |
| ffmpeg 6.1 (libvpx-vp9, libopus, libx264, libvorbis, libmp3lame, rubberband, zoompan, xfade) | `apt` (Ubuntu 24.04) | encode, pitch, vídeo |
| espeak-ng 1.51, sox, MBROLA br1/br3/br4 | `apt` | fonemização (Piper/Kokoro); MBROLA não foi necessário |
| numpy / scipy / soundfile | venv (PyPI) | síntese procedural |
| Chromium 1194 pré-instalado (`/opt/pw-browsers/chromium`) | ambiente | QA browser (Playwright 1.63 pede 1243 → `PW_EXECUTABLE_PATH`/fallback nos scripts) |

Nada foi instalado dentro do repositório; os modelos ficam fora do repo (ver §8 para reproduzir).

---

## 3. Vozes

### Identidades vocais (`tools/audio/voices.py` → `VOICES`)

| Personagem | Engine / voz base | Velocidade | Pitch | Processamento | Linhas pt-BR |
|---|---|---:|---:|---|---:|
| narrador | Kokoro `pm_santa` (en `am_michael`, es `em_santa`) | 0,90 | 0 | — | 152 |
| Theo (11 anos) | Kokoro `pm_alex` (en `am_puck`, es `em_alex`) | 1,04 | +3,5 st | highpass 120 Hz | 3 |
| Clara (mãe) | Kokoro `pf_dora` (en `af_heart`, es `ef_dora`) | 0,95 | 0 | lowpass 9 kHz | 4 |
| Elias (pai) | Piper `pt_BR-faber-medium` (en `am_eric`, es `em_alex`) | 0,95 | −1 st | — | **0** (sem falas no roteiro) |
| Silas (policial) | Piper `pt_BR-jeff-medium` (en `am_onyx`, es `em_santa`) | 0,88 | −1 st | eco de sala | 5 |
| troll (vigia/mensageiro/ferreiro/guardião) | Piper `pt_BR-edresson-low` (en `am_fenrir`) | 0,85 | −5 st | tremolo 35 Hz + eco de túnel + lowpass 3,5 kHz | 3 |
| chefe troll / criatura | Piper `pt_BR-jeff-medium` | 0,80 | −6 st | tremolo 28 Hz + eco de caverna | 2 |
| prisioneiro | Piper `pt_BR-cadu-medium` (en `am_liam`) | 0,95 | 0 | banda 300–3200 Hz + eco curto | 3 |

Cadeia comum: `rubberband` (pitch) → efeitos → `apad 0,25 s` → `loudnorm I=-18 TP=-1.5` → 44,1 kHz mono → OGG q3 + MP3 64k.

### Origem dos textos (nenhuma fala inventada)
- Narração: `intro`, `scene`, `revelation`, `cliffhanger` e as 3 `consequence` de cada fase (`phases.json`), inscrição do cubo (`cubeConfig.json`), `intro.text`, 3 finais, 5 `transform.hint.*`, `puzzle.sixthFace`, `title.subtitle` (`i18n`).
- Personagens: todas as falas entre aspas já existentes em `phases.json` (Silas ×6 incl. 1 como criatura, Clara ×4, trolls ×3, prisioneiro ×3, criatura ×1) e as 3 perguntas centrais de Theo da bíblia narrativa (§3).
- Números normalizados para extenso em pt-BR (`23:47` → "vinte e três e quarenta e sete").

### Localização (Fase 9)
- **pt-BR: 172/172** linhas.
- **en-US / es-ES: 11/11** linhas que possuem tradução real (`intro.text`, 3 finais, 5 dicas de transformação, sexta face, subtítulo).
- As 161 linhas restantes (narrativa das 20 fases e falas de personagens) **não têm tradução em `i18n`/`phases.json`** — o jogo exibe esse texto em pt-BR em qualquer idioma. O pipeline está pronto (`VoiceLines.getVoiceLine` faz fallback para pt-BR; `voices.py` gera para os 3 idiomas quando o texto existir). **Bloqueio: conteúdo traduzido, não tecnologia.**

### Validação
`tools/audio/validate.py`: 194/194 OK — loudness −22,1…−17,1 LUFS, pico máx. −0,8 dBTP, sem arquivo vazio/corrompido, todos com fallback MP3. Sincronização legenda↔voz usa `durationMs` real de cada arquivo (`voiceLines.json`).

Limitação conhecida: os modelos Piper pt_BR ignoram o diacrítico de nasalização em alguns fonemas (aviso "Missing phoneme ̃" do próprio modelo) — vogais nasais ("não", "também") saem levemente desnasalizadas nas 13 falas Piper. As 181 linhas Kokoro não têm esse problema.

---

## 4. Música (procedural)

Não existe modelo generativo de música/áudio local disponível (ver §2). A alternativa local técnica adotada foi **síntese procedural determinística** (`tools/audio/synth.py` + `music.py`): pads (saw detunado + filtro varrido), drones harmônicos, piano aditivo, Karplus-Strong, sinos inarmônicos, percussão grave, batimento, reverb por convolução, estéreo Haas. Identidade sonora: **motivo principal em Ré menor** ("tema do rastro") reaparece no menu, créditos, finais e fases de respiro; escalas frígia/harmônica para medo/tensão, lídia para ilusão/descoberta/humor.

| Trilha | Arquivo (`/assets/music/`) | Mood | Duração | Loop |
|---|---|---|---:|---|
| fases 1–20 | `phaseNN_<local>_<emoção>.ogg` (paths já existentes em `phases.json`) | mapa emocional §10 da bíblia | 48–82 s | sim |
| menu | `bgm_menu_tema` | tema | 82 s | sim |
| créditos | `bgm_credits` | créditos | 71 s | sim |
| investigação / suspense / descoberta / perseguição / trolls / caverna | `bgm_investigacao`, `bgm_suspense`, `bgm_descoberta`, `bgm_perseguicao`, `bgm_trolls`, `bgm_caverna` | genéricas (prompt) | 44–66 s | sim |
| Cubo de Orun / transformação | `bgm_cubo_orun`, `bgm_transformacao` | — | 58–64 s | sim |
| finais | `bgm_final_bom`, `bgm_final_ruim`, `bgm_final_secreto` | — | 55–66 s | não (fade final) |

Fase 20 ("sem música"): trilha `phase20_caverna_silencio` é apenas vento + respiração + drone a −22 dB RMS, conforme a bíblia.

Validação: 33/33 — −22,4…−15,3 LUFS, pico máx. −1,1 dBTP, loops com tail dobrado para o início + crossfade 0,8 s. Metadados em `src/data/music.json` (seed por trilha → regeneração idêntica).

**Rotulagem honesta:** é música sintetizada por algoritmo, não trilha autoral nem modelo de IA. É um asset real e funcional; recomenda-se substituição por trilha autoral quando houver (mesmos paths, sem mudança de código).

---

## 5. SFX (procedural) — 35 arquivos

passos (madeira/pedra/cascalho), porta abrir/fechar, grade de metal, metal, madeira rangendo, impacto, papel (folhear/virar), vento, chuva, pegar objeto, sting de suspense, respiração de criatura, rosnado e passo de troll, pulso de transformação, cubo (girar/resolver/falha), UI (click/hover/confirm), investigar, pista encontrada, símbolo encontrado, escolha errada, sino, relógio, sussurro, estática de câmera, pedra deslizando, batimento.
Validação: 35/35 — pico máx. −2,9 dBTP; UI (<0,5 s) fora da medição LUFS por limitação do algoritmo EBU R128.

## 6. Ambiência (procedural) — 17 loops de 40 s

cidade, casa, floresta, igreja, delegacia, interior, subterrâneo, cidade dos trolls, oficina do ferreiro, caverna, montanha, sala da ilusão, Cubo de Orun, 3 finais, estação/porto. Mapeamento por fase em `phases.json.ambience`. Validação: 17/17, −27,6…−18,2 LUFS, pico máx. −2,9 dBTP, loop limpo (tail dobrado + crossfade 1,5 s).

---

## 7. Cutscenes (FFmpeg, sem modelo de vídeo)

`tools/video/build-cutscenes.mjs` monta cada cutscene a partir de `src/data/cutscenes.json`:
plates 2560×1440 (backgrounds; personagens recortados sobre fundo desfocado; troll em "aparição" por colorkey; ícones SVG com glow) → `zoompan` (Ken Burns) → vinheta + grão + letterbox 2,35:1 → `xfade` 1 s → mix (música −13 dB, ambiência −17 dB, vozes 0 dB, SFX −9 dB, limiter) → **WebM VP9+Opus** (primário) e **MP4 H.264+AAC** (fallback Safari). 1280×720 @ 24 fps.

| Cutscene | Gatilho | Shots | Duração | Vozes | Localizada |
|---|---|---:|---:|---|---|
| opening | antes da fase 1 (após Intro) | 3 | 26 s | intro_text, phase01_intro, theo_q1, phase01_scene | — |
| parents_gone | antes da fase 2 | 3 | 23 s | phase01_revelation/cliffhanger, phase02_intro, voz sob o chão | — |
| first_troll | antes da fase 3 | 3 | 24 s | phase03_intro, troll, revelation, cliffhanger | — |
| revelations | antes da fase 14 | 3 | 34 s | Silas ×2, phase13_revelation, phase14 intro/revelation/cliffhanger | — |
| boss | antes da fase 17 | 4 | 29 s | phase16_intro, Clara (ilusão), criatura, cliffhanger, theo_q3 | — |
| transformation | antes da fase 19 | 5 | 27 s | 4 dicas de transformação, theo_q2 | — |
| cube | antes do Puzzle | 8 | 32 s | phase20_intro, inscrição, revelation, dica 20 | — |
| ending_good / ending_bad / ending_secret | ao entrar no final | 2–3 | 16 / 14 / 18 s | texto do final (+ sexta face) | **pt-BR, en-US, es-ES** |

Legendas: renderizadas pelo jogo (`SubtitleRenderer`) a partir de cues calculadas com a duração real de cada voz (`Cutscenes.buildSubtitleCues`), no idioma atual (fallback pt-BR).
Validação (`tools/video/validate.mjs`): 32/32 — codecs corretos, 1280×720, duração = roteiro (±0,01 s), faixa de áudio presente, **nenhuma tela preta ≥ 2,5 s** (blackdetect).

Fallback em runtime (verificado no QA, teste 15): se o vídeo não carrega/decodifica, a mesma cutscene roda em passos do `CutscenePlayer` (música + ambiência do jogo, voz + legenda, zoom lento no poster).

---

## 8. Integração (Fases 8 e 10)

| Sistema | Mudança |
|---|---|
| `AssetsManifest` / `build-manifest.mjs` | categorias `audio` e `video` (mp4 incluído); 558 áudios + 32 vídeos |
| `assetRegistry.json` / `build-registry.mjs` | packs `audio` (92), `voice` (197), `video` (16) — todos `optional`, aliases históricos preservados (`bgm_main`, `ui_click`, …) |
| `OptionalAssets` | `ensureAudio` com par OGG/MP3 (Phaser escolhe o suportado), `ensureVideo` WebM/MP4 |
| `SceneAudio` (novo) | único ponto que monta paths de música/SFX/ambiência/voz; crossfade; ignora trilha já tocando |
| `VoiceLines` (novo) | catálogo + fallback de idioma + ids de linha por fase |
| `Cutscenes` (novo) | catálogo, gatilhos, cues, fallback, flag "vista", bypass `?nocutscenes=1` para automação |
| `AudioManager` | voz única (stop/pause/resume), mute persistido corrigido, `refreshVolumes` após load de save, pausa global |
| `CutscenePlayer` | passo `video` com cues sincronizadas, pausa/retomada/skip, `onError` → fallback |
| `CutsceneScene` (nova) | PULAR (Esc/Espaço/Enter/botão), pausa (P), replay (R), fade-out, roteamento `startWithCutscene` |
| Cenas | Title/Menu: música do menu + SFX; Story: música+ambiência da fase, narração intro→cena com legenda; Choice: SFX de escolha, consequência/revelação/cliffhanger narrados, cutscene por gatilho; Puzzle: música/ambiência do cubo, SFX girar/resolver/falha; Ending: cutscene → música + ambiência + voz do final; Credits: música; Settings: sliders ao vivo (master/música/ambiência/SFX/voz) + mute |
| `phases.json` | campo `ambience` nas 20 fases (espelho `public/data`) |
| i18n | `subtitle.speaker.troll_boss/prisoner`, `cutscene.skip/hint/paused`, `settings.ambienceVolume` (3 idiomas) |
| Save | flags `cutscene_seen_<id>` no `GameState.flags` (v3, sem migração) |

---

## 9. Testes (Fase 11 e 16)

- **Unitários (Vitest):** 126/126. Novos: `VoiceLines` (narração completa das 20 fases, fallback de idioma, arquivos reais), `Cutscenes` (10 cutscenes, cues dentro da duração, fallback, vídeos reais, localização, flags), `SceneAudio` (música/ambiência de cada fase em disco e no manifest, catálogos, candidatos OGG/MP3), `AudioManager` (volumes, mute persistido).
- **Browser (`final-qa-av.mjs`, Chromium headless):** 31/31 — música do menu; SFX de UI; cutscene *opening* em vídeo (requisição WebM 200, objeto Video tocando, legenda visível), **pausa/retomada**, **replay**, **skip**; fase 1 com música/ambiência/voz/legenda; escolha → SFX + voz da consequência → sting + voz do cliffhanger → cutscene *parents_gone* → fase 2 com trilha própria; **save/reload**; **idioma en-US** (vídeo `ending_good.en-US.webm` + legenda e voz em inglês); **mute/unmute** via Settings; **fallback sem vídeo**; 0 requisições 404; 0 chamadas ao ComfyUI; console limpo.
- **Legado:** `smoke-test.mjs` 16/16; `final-qa.mjs` (com `?nocutscenes=1`) — resultado em `final-qa-results.json` / `docs/FINAL_QA_REPORT.md`.

---

## 10. Bloqueios reais e recomendações

### BLOQUEADO POR RECURSO EXTERNO / CONTEÚDO
| Item | Motivo | Recurso necessário |
|---|---|---|
| Vozes en-US/es-ES da narrativa das 20 fases e das falas de personagens (161 linhas) | não existe tradução desses textos no projeto (`phases.json` é só pt-BR; `i18n` cobre UI/intro/finais/dicas) | `phases.en-US.json` / `phases.es-ES.json` (tradução do roteiro). Ao existirem, `voices.py` + `build-cutscenes.mjs` geram vozes e variantes de vídeo sem mudança de código |
| Falas de Elias (pai) | o roteiro atual não contém nenhuma fala dele | linhas de Elias no roteiro (identidade vocal já configurada) |
| Música/SFX por modelo de IA (Stable Audio / ACE-Step) ou trilha autoral | sem checkpoint local; HF bloqueado; ComfyUI offline neste ambiente | opcional: checkpoint de áudio no ComfyUI do autor ou trilha autoral (substituição direta nos mesmos paths) |
| Vídeo gerado por modelo (Wan/LTXV/Kling) | sem modelo local / cloud | **não necessário** — cutscenes entregues por montagem |

### NÃO NECESSÁRIO
- STT, ElevenLabs, ComfyUI online para o runtime, MBROLA (instalado, não usado).

### RECOMENDADO
1. Ouvir as vozes Piper (Silas/troll/prisioneiro) e, se a desnasalização incomodar, migrar esses 13 arquivos para Kokoro `pm_santa` com pitch (basta trocar o engine em `VOICES` e rodar `voices.py --speaker "silas|troll|prisoner"`).
2. Trilha autoral ou modelo de música quando disponível (mesmos nomes de arquivo).
3. Traduzir o roteiro para destravar dublagem en/es completa.
4. Rodar `npm run video:build` na máquina do autor se quiser variantes de resolução maiores (o script aceita `width/height/fps` em `cutscenes.json`).

---

## 11. Reprodução

```bash
# modelos (fora do repo)
MODELS=~/models && mkdir -p $MODELS && cd $MODELS
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
for v in pt_BR-faber-medium pt_BR-cadu-medium pt_BR-jeff-medium pt_BR-edresson-low; do
  curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-$v.tar.bz2 && tar xjf vits-piper-$v.tar.bz2; done
# python
python3 -m venv .venv && . .venv/bin/activate && pip install kokoro-onnx piper-tts soundfile numpy scipy
# sistema: ffmpeg (com libvpx/libopus/libx264/rubberband), espeak-ng
# geração
python tools/audio/voices.py --models $MODELS
python tools/audio/music.py && python tools/audio/sfx.py && python tools/audio/ambience.py
python tools/audio/validate.py
npm run video:build && npm run video:validate
npm run assets:registry && npm run assets:manifest
# gate
npm run test && npm run build && npm run dev &  # :5173
npm run qa:smoke && npm run qa:final && npm run qa:av
```
