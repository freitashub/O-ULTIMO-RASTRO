# SETUP REPORT — ambiente MCP/3D + vertical slice espacial da Fase 1

Data: 2026-09-25 · Branch: `claude/practical-hypatia-34fd8u` · Base: `b7530c9` (v0.4.0)
Auditoria prévia: `docs/SETUP_AUDIT.md`.

## 1. Node encontrado
**v22.22.2** (Playwright MCP exige ≥ 20 — OK; nada foi atualizado).

## 2. npm encontrado
**10.9.7**.

## 3. MCPs configurados

Configuração versionada em `.mcp.json` (escopo de projeto, sem segredos). Cada servidor stdio foi verificado com handshake MCP real (`initialize` + `tools/list`).

| MCP | Configuração | Verificação nesta sessão |
|---|---|---|
| **Playwright** | `npx -y @playwright/mcp@latest` | handshake OK: *Playwright 1.64*, **25 ferramentas** (`browser_navigate`, `browser_evaluate`, `browser_console_messages`…) |
| **GitHub** (oficial, remoto HTTP) | `https://api.githubcopilot.com/mcp/` com `Authorization: Bearer ${GITHUB_PAT}` | o endpoint remoto é bloqueado pelo proxy deste container e exige PAT; **nesta sessão o GitHub MCP funciona pela integração do claude.ai** (`list_branches` respondeu com `main` e esta branch) |
| **Babylon Node Material** | `npx -y @babylonjs/mcp-servers nme` | handshake OK: **25 ferramentas** (`create_material`, `start_session`…) |
| **Babylon Node Geometry** | `npx -y @babylonjs/mcp-servers nge` | handshake OK: **25 ferramentas** (`create_geometry`…) |

Ao abrir o projeto no Claude Code, os servidores de `.mcp.json` aparecem como *Pending approval* até você aprová-los (`claude` → aprovar). Para o GitHub remoto, defina a variável `GITHUB_PAT` no seu ambiente (nunca em arquivo versionado).

Avaliados e **não mantidos**:
- **Babylon GUI MCP / Flow Graph MCP** — handshake OK (29 e 26 ferramentas), mas a slice não usa Babylon GUI (o HUD continua no Phaser) nem Flow Graph (a lógica de interação é TypeScript testável).
- **Spector.js MCP** — não é publicado no npm: exige clonar o repositório, compilar (`npm run mcp:build`) e baixar um Chromium próprio (`npx playwright install chromium`). Não houve problema de renderização que justificasse; o Playwright MCP e o `qa-spatial.mjs` já cobrem console, capturas e estado da cena. Pode ser adicionado se surgir cena vazia, textura faltando ou gargalo de draw calls.

## 4. Dependências instaladas

| Pacote | Tipo | Uso |
|---|---|---|
| `@babylonjs/core` 9.28 | runtime | engine 3D, cena, câmeras, luzes, sombras, raycast |
| `@babylonjs/loaders` 9.28 | runtime | carregamento do GLB do Theo |
| `@gltf-transform/cli` 4.5 | dev | `gltf-transform validate` / `inspect` |
| `@gltf-transform/core` 4.5 | dev | geração do `theo.glb` por script e leitura nos testes |

Babylon é carregado com `import()` dinâmico: vai para um chunk próprio (~1,5 MB, 365 KB gzip) baixado só ao entrar na garagem. O bundle principal não cresceu.

## 5. Dependências que não foram necessárias

`babylonjs` (monolítico), `@babylonjs/gui`, `spectorjs`, `@babylonjs/havok` (física), qualquer engine/editor 3D, Docker, Python para autoria 3D, CUDA, modelos de IA locais, `@modelcontextprotocol/server-github`.

## 6. Arquivos modificados

**Novos**
- `src/spatial/garageLayout.ts` — layout da garagem (dados puros), seleção de câmera, interação, controlador de personagem
- `src/spatial/SpatialWorld.ts` — mundo 3D (Babylon)
- `src/scenes/SpatialScene.ts` — cena Phaser que hospeda o mundo 3D (HUD, legendas, áudio, escolha)
- `tools/models/build-theo-glb.mjs` → `public/assets/models/theo.glb` (68 KB, 21 nós, validado sem erros/avisos)
- `tests/unit/SpatialWorld.test.ts` (17 testes, Babylon `NullEngine`)
- `qa-spatial.mjs` (+ `qa-spatial-results.json`, `qa-spatial-shots/`)
- `tests/fixtures/cutscene-fixture.webm` (+ README) — vídeo de teste, nunca publicado
- `.mcp.json`, `docs/SETUP_AUDIT.md`, `docs/SETUP_REPORT.md`, `docs/CUTSCENES_GOOGLE_FLOW.md`

**Alterados**
- `src/scenes/StoryScene.ts` — fase 1 abre a `SpatialScene` (fallback 2D com `force2d`/`?spatial=0`)
- `src/scenes/CutsceneScene.ts`, `src/game/Cutscenes.ts` — vídeos externos em `public/cutscenes/` + legendas por sidecar, fallback para a cutscene em engine
- `src/config/gameConfig.ts` — canvas Phaser transparente (HUD sobre o 3D)
- `src/main.ts`, `src/game/AssetRegistry.ts`, `src/i18n/*.json`
- `tools/assets/build-manifest.mjs`, `tools/assets/build-registry.mjs` — `models`, `cutscenes`
- `final-qa-av.mjs` — cobre o runtime 2D (`?spatial=0`); a fase 1 3D é coberta pelo `qa-spatial.mjs`
- `package.json` — deps + scripts `qa:spatial`, `assets:models`

Nenhum sistema narrativo foi removido: GameState, SaveManager, ChoiceSystem, ClueSystem, TransformationSystem, EndingSystem, DialogueSystem, CutscenePlayer, SubtitleRenderer, i18n, Settings, AudioManager, AssetRegistry e as 20 fases continuam os mesmos. As fases 2–20 seguem no runtime 2D.

## 7. Branch atual
`claude/practical-hypatia-34fd8u`. Esta sessão só pode fazer push para esta branch (outras refs retornam HTTP 403). Para usar o nome sugerido no seu clone: `git fetch origin claude/practical-hypatia-34fd8u && git branch feature/spatial-runtime-vertical-slice origin/claude/practical-hypatia-34fd8u`.

## 8. Testes executados

| Comando | Resultado |
|---|---|
| `npm run test` | **143/143** (20 arquivos; eram 126) |
| `npm run build` | **OK** |
| `npm run assets:models` | GLB gerado; `gltf-transform validate`: 0 erros, 0 avisos |

## 9. Build
OK (`tsc --noEmit && vite build`). Chunks: `index` 1 611 kB (antes 1 598 kB) e `SpatialWorld` 1 529 kB sob demanda.

## 10. Smoke test e QA em navegador

| Script | Resultado |
|---|---|
| `node smoke-test.mjs` | **16/16**, 0 erros de página (passa pela fase 1 em 3D) |
| `node final-qa.mjs` | **23/23**, 0 erros de console, 0 falhas de rede (20 fases, cubo, 3 finais) |
| `node final-qa-av.mjs` | **29/29** (runtime 2D, cutscenes em engine, áudio, idioma, mute) |
| `node qa-spatial.mjs` | **28/28** — fluxo principal da slice (abaixo) |

`qa-spatial.mjs` reproduz: vídeo externo da CUTSCENE 01 com legenda do jogo e pausa → garagem 3D → Theo do GLB → movimento pelas setas → colisão com a parede (continua pressionando e para) → contorno da estante por cliques no piso → troca de câmera → oclusão pela estante → save/reload no meio da fase → foco na marca de pneu por proximidade + raycast → `E` → painel com ícone da pista → INVESTIGAR → consequência narrada → pista `tire_mark` salva → CUTSCENE 02 em vídeo → fase 2 → canvas 3D descartado → sem vídeo, cutscene em engine → garagem → 0 erros de rede/console, 0 chamadas a ComfyUI/MCP.

## 11. Status da vertical slice

| Critério de aceite | Status |
|---|---|
| Claude consegue iniciar o projeto | ✅ `npm ci && npm run dev` |
| GitHub MCP funciona | ✅ nesta sessão (integração do claude.ai) · ⚠️ servidor remoto de `.mcp.json` precisa de `GITHUB_PAT` e aprovação na sua máquina |
| Playwright MCP funciona | ✅ servidor verificado (25 ferramentas) · ⚠️ aprovar no Claude Code local |
| Babylon MCP funciona ou documentado | ✅ `nme`/`nge` verificados; `gui`/`flow-graph` documentados como desnecessários |
| Babylon.js instalado | ✅ |
| GLB/glTF carrega | ✅ `theo.glb` via `@babylonjs/loaders` (QA #4) |
| Cena espacial real | ✅ 55 meshes: piso, 4 paredes, portão, 2 portas, bancada, caixa de ferramentas, armário, estante, 3 caixas, casaco, lâmpada, decalques |
| Theo com posição espacial | ✅ `Vector3` + orientação (yaw) |
| Movimento por input real | ✅ teclado (setas/WASD, relativo à câmera) e clique no piso com desvio de obstáculos |
| Colisão com paredes | ✅ controlador cinemático próprio (a colisão mesh×mesh do Babylon 9.28 não disparou em nenhum teste) |
| Objetos com profundidade / ocultam Theo | ✅ depth buffer real; estante esconde o Theo no canto sudeste (unit + QA #9) |
| Câmera observa o espaço | ✅ 2 câmeras fixas de canto, alvo acompanha o Theo, transição suave de 0,55 s |
| Interação por proximidade/raycast | ✅ raio + linha de visão (objetos sólidos bloqueiam) |
| Pista encontrada | ✅ `tire_mark` no save |
| Escolha funciona | ✅ painel → `ChoiceScene` (consequência, revelação, cliffhanger) |
| Cutscene inicial / final | ✅ em engine (padrão) · ✅ vídeo externo testado com fixture interceptado |
| Transições cutscene ↔ gameplay | ✅ nos dois sentidos, com vídeo e sem vídeo |
| Save/load preservado | ✅ CONTINUAR reabre a garagem; pista/escolha persistem |
| Sem 404 / sem erro de console | ✅ |
| Testes e build | ✅ |
| Playwright reproduz o fluxo | ✅ 28/28 |

**Conclusão:** a vertical slice está tecnicamente concluída — **CUTSCENE → MUNDO 3D REAL → JOGADOR CONTROLA THEO → INVESTIGA → ESCOLHE → CUTSCENE** roda e é testada de ponta a ponta. Dois itens dependem de você (não de código): as cutscenes reais do Google Flow e a credencial/aprovação dos MCPs na sua máquina.

## 12. Erros encontrados

1. Colisão do Babylon 9.28 (`moveWithCollisions`) não detecta obstáculos — nem com NullEngine, nem com o pacote completo, em quatro variações.
2. No `NullEngine`, matrizes de mundo só existem após o primeiro render: raycast e picking viam tudo na origem.
3. Materiais PBR do GLB ficavam quase pretos sem mapa de ambiente (Theo invisível).
4. A estante no centro escondia o Theo em boa parte da garagem, inclusive na pista.
5. A câmera leste olhava através da estante (só a cabeça do Theo aparecia).
6. Clique-para-andar em linha reta desistia ao encostar num obstáculo.
7. Scripts de QA: pontos de clique fora do quadro da câmera; checagens rodando antes de o ícone/vídeo carregarem; `final-qa-av` testava a fase 1 em 2D.

## 13. Erros corrigidos

1. Controlador cinemático próprio (círculo × caixas orientadas com subpassos e deslizamento), coberto por testes.
2. Cálculo explícito das matrizes de mundo e render inicial ao montar a cena.
3. Conversão PBR → material padrão (cor base em gama) + luz de personagem fraca.
4. Estante movida para perto da parede sul: oclusão pontual no canto sudeste; teste unitário garante que 9 pontos de jogo ficam visíveis (cabeça e tronco).
5. Câmera leste reposicionada no meio da parede leste.
6. Desvio local (direções defletidas ±35°/70°/105°) + desistência após 2,5 s sem progresso; teste unitário com as caixas do canto.
7. QA: waypoints intermediários visíveis, esperas por condição, verificação pelo `src` do vídeo, `?spatial=0` no `final-qa-av`.

## 14. Próximos passos

1. **Você:** colocar os vídeos do Google Flow em `public/cutscenes/` (ver `docs/CUTSCENES_GOOGLE_FLOW.md`), rodar `npm run assets:manifest && npm run assets:registry`.
2. **Você:** definir `GITHUB_PAT` e aprovar os MCPs de `.mcp.json` no Claude Code local.
3. Substituir os placeholders por assets finais (GLB do Theo e props) — o pipeline GLB → validação → carregamento já funciona; o Babylon NME MCP pode autorar os materiais góticos.
4. Refinar a direção de arte da garagem (iluminação volumétrica, pós-processamento leve, som espacial).
5. Migrar a próxima fase usando o mesmo padrão (`garageLayout` → layout da fase + `SPATIAL_PHASES` no `StoryScene`), uma por vez, sempre com teste NullEngine + roteiro no `qa-spatial.mjs`.
