# SETUP AUDIT — ambiente MCP/3D (antes de qualquer alteração)

Data: 2026-09-25 · Ambiente: container Claude Code na nuvem (Ubuntu 24.04), repositório clonado em `/home/user/O-ULTIMO-RASTRO`.

| Item | Encontrado |
|---|---|
| Git | working tree limpo · branch `claude/practical-hypatia-34fd8u` · HEAD `b7530c9` (v0.4.0) · remoto: `main` (c10b7c6) e esta branch |
| Node.js | **v22.22.2** (≥ 20 exigido pelo Playwright MCP — OK) |
| npm | 10.9.7 |
| Claude Code | 2.1.282 |
| MCPs configurados (CLI) | nenhum (`claude mcp list` → "No MCP servers configured") |
| GitHub nesta sessão | integração GitHub do claude.ai ativa (ferramentas `mcp__github__*`; `list_branches` respondeu) |
| `package.json` | `phaser ^4.2.1`; dev: vite 8, vitest 5, typescript 7, playwright 1.63, fake-indexeddb |
| `package-lock.json` | lockfileVersion 3 |
| `npm run test` | **126/126** (19 arquivos) |
| `npm run build` | OK — bundle 1 598 kB (aviso de chunk > 1 500 kB) |
| Cutscenes do Google Flow | **nenhum arquivo de vídeo** no repositório (`public/cutscenes/` inexistente) |
| Runtime atual | Phaser 4; exploração 2D (StoryScene) sobre fundo estático; cutscenes em engine 2D (StageDirector) |

## Pacotes disponíveis no npm (verificado)

| Pacote | Versão |
|---|---|
| `@babylonjs/core`, `@babylonjs/loaders` | 9.28.0 |
| `@gltf-transform/cli`, `@gltf-transform/core` | 4.5.0 |
| `@playwright/mcp` | 0.0.82 |
| `@babylonjs/mcp-servers` | 9.28.0 (dispatcher `nme`, `nge`, `nrge`, `npe`, `gui`, `flow-graph`, `smart-filters`) |
| `spectorjs` | 0.9.33 |
| `@github/github-mcp-server` | não publicado no npm (servidor oficial é remoto HTTP ou binário/Docker) |

## Observações que orientam o plano

1. **Branch:** esta sessão só tem permissão de push para `claude/practical-hypatia-34fd8u` (push de outras refs retorna HTTP 403, como ocorreu com a tag v0.3.0). O trabalho segue nessa branch, que já é dedicada e separada de `main`; o nome sugerido `feature/spatial-runtime-vertical-slice` pode ser criado no seu clone a partir dela.
2. **MCPs:** a configuração via `claude mcp add` no container é efêmera. Para valer na sua máquina, a configuração vai para `.mcp.json` (escopo de projeto, versionado, sem tokens — o PAT do GitHub vem de variável de ambiente).
3. **Bundle:** Babylon.js é grande; o runtime espacial deve ser carregado sob demanda (`import()` dinâmico) para não pesar no menu e nas outras fases.
4. **Testabilidade:** Babylon oferece `NullEngine`, que permite testar colisão e raycast em Node (Vitest) sem WebGL.
