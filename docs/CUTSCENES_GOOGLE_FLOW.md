# Cutscenes do Google Flow — como integrar

O jogo toca vídeos externos **localmente**, sem depender do Google Flow em runtime.

## 1. Onde colocar

```
public/cutscenes/<id>.webm        (preferido: VP9 + Opus)
public/cutscenes/<id>.mp4         (fallback: H.264 + AAC, para Safari)
public/cutscenes/<id>.en-US.webm  (opcional: versão localizada)
public/cutscenes/<id>.cues.json   (opcional: legendas)
```

`<id>` é o id da cutscene em `src/data/cutscenes.json`:

| id | Quando toca |
|---|---|
| `opening` | antes da fase 1 (CUTSCENE 01 da vertical slice) |
| `parents_gone` | antes da fase 2 (CUTSCENE 02 da vertical slice) |
| `first_troll` | antes da fase 3 |
| `revelations` | antes da fase 14 |
| `boss` | antes da fase 17 |
| `transformation` | antes da fase 19 |
| `cube` | antes do Cubo de Orun |
| `ending_good`, `ending_bad`, `ending_secret` | nos finais |

Sem arquivo, a cutscene em engine (StageDirector) continua sendo usada. Nenhuma mudança de código é necessária.

## 2. Converter o arquivo exportado do Flow

```bash
ffmpeg -i flow_export.mp4 -c:v libvpx-vp9 -crf 32 -b:v 0 -c:a libopus -b:a 96k -vf scale=1280:-2 public/cutscenes/opening.webm
ffmpeg -i flow_export.mp4 -c:v libx264 -crf 22 -c:a aac -b:a 128k -movflags +faststart -vf scale=1280:-2 public/cutscenes/opening.mp4
```

**Não queime legendas no vídeo.** As legendas são desenhadas pelo jogo (respeitam idioma, tamanho, fundo e liga/desliga).

## 3. Legendas (`<id>.cues.json`)

```json
{
  "cues": [
    { "startMs": 800, "voice": "intro_text" },
    { "startMs": 5200, "endMs": 9000, "text": "Texto livre", "speaker": "narrator" }
  ]
}
```

- `voice` usa o texto localizado e o locutor de `src/data/voiceLines.json`; `endMs` é calculado pela duração da fala se omitido.
- `text`/`speaker` para trechos sem voz catalogada.

## 4. Registrar

```bash
npm run assets:manifest && npm run assets:registry
```

O manifest passa a listar `/cutscenes/...` e o `CutsceneScene` escolhe o vídeo automaticamente
(idioma atual → padrão; WebM → MP4). Controles: Esc/Espaço/Enter pula, P pausa, R repete.
Se o vídeo falhar (rede/codec), a cutscene em engine assume sem travar o jogo.

## 5. Testar

`npm run qa:spatial` já cobre vídeo → gameplay → vídeo usando um vídeo de teste interceptado
(`tests/fixtures/cutscene-fixture.webm`). Com os arquivos reais em `public/cutscenes/`, rode o jogo
e confira o fluxo; o fixture nunca é publicado.
