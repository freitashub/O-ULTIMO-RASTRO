# Referências de personagens

Coloque aqui as imagens de referência de cada personagem. Elas guiam a
modelagem 3D (proporções, cores, roupas, cabelo, rosto) usada no runtime
espacial (Babylon.js).

## Como organizar

Uma subpasta por personagem, com o nome em minúsculas:

```
referencias/personagens/
  theo/
    frente.png
    lado.png
    costas.png
    rosto.png        (opcional, close do rosto)
    notas.md         (opcional: idade, altura, detalhes)
  <outro-personagem>/
    ...
```

## O que ajuda mais

- Vista de frente, de lado e de costas, corpo inteiro, pose neutra
  (braços levemente afastados do corpo — "pose A" ou "pose T" é ideal).
- Fundo liso, boa luz, sem cortes nos pés/mãos.
- PNG ou JPG, 1024 px ou mais no lado maior.
- Um close do rosto se houver traços importantes (cicatriz, óculos, sardas).

## Como enviar

- Pelo GitHub: abra esta pasta no repositório, "Add file" → "Upload files",
  na branch de desenvolvimento; ou
- anexe as imagens diretamente no chat.

Essas imagens são apenas referência de desenvolvimento; o jogo não as
carrega em runtime.

## Status

| Personagem | Referência | Assets derivados |
|---|---|---|
| Theo (normal) | `theo/theo_normal.webp` | sprite 2D, retrato, textura do rosto e modelo 3D — `npm run assets:theo` |

O pipeline recorta o fundo branco sem redesenhar a arte (`tools/art/`), mede proporções e cores na
imagem e gera o modelo 3D por script (`tools/models/build-theo-glb.mjs`). Versões transformadas
(`theo_t2`, `theo_t4`) continuam com a arte antiga até chegarem as referências delas.
