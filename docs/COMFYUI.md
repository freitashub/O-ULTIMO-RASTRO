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
