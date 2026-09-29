# Pipeline de assets 3D

```
assets_fornecidos/         originais do responsável pelo projeto (imutáveis)
referencias/personagens/   referências de trabalho (Theo já processado)
godot/assets/              somente o que as fases prontas usam
```

- **Personagens:** a arte fornecida vira GLB por `tools/models/build-character.mjs` (ver `docs/CHARACTER_PIPELINE.md`). Se chegarem modelos esculpidos,
  importar sem editar o original; correções (escala, orientação, mapa de ossos) na cena derivada, cumprindo o contrato do `CharacterRig`.
- **Áudio:** `node tools/godot/sync-audio.mjs` copia só os OGG usados e gera `assets/audio/catalog.json` (1,5 MB na Fase 1).
- **Dados:** `node tools/godot/sync-data.mjs`. **Layout:** `node tools/godot/build-layout-phase01.mjs`. Tudo junto: `npm run godot:sync`.
- **Importação:** `godot --headless --path godot --import` (gera `.godot/`, ignorado; os `.uid`/`.import` são versionados).
- **Qualidade:** `Quality.level` 0/1/2; texturas ≤ 256², materiais compartilhados (`LayoutBuilder._material` faz cache).
- **Placeholders:** tudo que não é arte final está em `docs/PLACEHOLDERS.md`.
