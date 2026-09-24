# README — O Último Rastro

Jogo narrativo 2D web: **TypeScript + Phaser 4 + Vite + Vitest + Playwright**.

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run build      # tsc + vite build
node smoke-test.mjs  # e2e (dev server rodando)
```

## Funcionalidades

- 20 fases com cadeia STORY → CHOICE → CONSEQUENCE → REVELATION → CLIFFHANGER → NEXT
- Save IndexedDB v3 com migração
- i18n: pt-BR / en-US / es-ES
- Áudio modular + legendas + configurações de acessibilidade
- Cubo de Orun configurável
- 3 finais: good / bad / secret
- Pipeline ComfyUI **opcional** (fora do runtime) — ver `docs/COMFYUI.md`

## Documentação

- `docs/README.md` — arquitetura e sistemas
- `docs/HISTORY.md` — changelog
- `docs/COMFYUI.md` — pipeline externo
- `O ÚLTIMO RASTRO.md` / `O ÚLTIMO RASTRO - SOFTWARE.md` — specs
