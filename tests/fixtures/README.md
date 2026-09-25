# Fixtures de teste

- `cutscene-fixture.webm` — padrão de teste (testsrc2 + tom de 330 Hz, 4 s, VP9/Opus) gerado com FFmpeg.
  **Não é asset do jogo**: nunca vai para `public/`. O `qa-spatial.mjs` intercepta requisições a
  `/cutscenes/<id>.webm` e serve este arquivo para testar o caminho vídeo → gameplay → vídeo
  enquanto as cutscenes reais do Google Flow não existem no repositório.
