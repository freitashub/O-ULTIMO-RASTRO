# Pipeline de assets 3D

```
assets_fornecidos/         originais do responsável pelo projeto (imutáveis)
referencias/personagens/   referências de trabalho (Theo já processado)
godot/assets/              somente o que as fases prontas usam
```

- **Modelos (GLB/glTF preferido):** importar sem editar o original; correções (escala, orientação, mapa de ossos) na cena derivada. Checklist
  de 18 itens da seção 5 do prompt por personagem, registrado em `docs/CHARACTER_SYSTEM.md`.
- **Áudio:** `node tools/godot/sync-audio.mjs` copia só os OGG usados e gera `assets/audio/catalog.json` (1,5 MB na Fase 1).
- **Dados:** `node tools/godot/sync-data.mjs`. **Layout:** `node tools/godot/build-layout-phase01.mjs`. Tudo junto: `npm run godot:sync`.
- **Importação:** `godot --headless --path godot --import` (gera `.godot/`, ignorado; os `.uid`/`.import` são versionados).
- **Qualidade:** `Quality.level` 0/1/2; texturas ≤ 256², materiais compartilhados (`LayoutBuilder._material` faz cache).
- **Placeholders:** tudo que não é arte final está em `docs/PLACEHOLDERS.md`.
