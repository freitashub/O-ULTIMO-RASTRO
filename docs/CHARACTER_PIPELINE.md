# Pipeline de personagens 3D (arte → GLB com esqueleto → Godot)

Os personagens fornecidos são **arte 2D** (`assets_fornecidos/personagens_3d/*.jpg`). Por decisão do responsável ("você faz tudo"), os modelos 3D,
o esqueleto e os GLB são **gerados por script** a partir dessa arte, sem Blender e sem alterar o desenho.

```
arte (jpg) ──► tools/models/characters/<id>.mjs   pontos-chave (px) + larguras + adereços
                     │
                     ▼
        tools/models/lib/humanoid.mjs             malha contínua + esqueleto de 19 ossos + UV de projeção + cor por vértice
                     │  (glTF-Transform)
                     ▼
        godot/assets/characters/<id>/<id>.glb     1 malha, 1 material, 1 textura (a própria arte, JPEG)
                     │
                     ▼
   Godot: CharacterMaterial (shader de projeção + contorno) · CharacterRig (AnimationPlayer + AnimationTree)
```

## Como o modelo fica fiel ao desenho

- **Proporções reais:** cada spec mede na arte a cabeça, ombros, cotovelos, punhos, quadris, joelhos, tornozelos e larguras (px); a altura em metros
  converte tudo (`height_m / (pé − topo da cabeça)`).
- **Projeção frontal da arte:** cada vértice recebe `UV = (x/W, y/H)` da arte (personagens em perfil, como o Troll Vigia, usam projeção lateral) e
  `COLOR_0 = (cor chapada amostrada da arte, peso de frente)`. O shader mostra a arte onde a superfície olha para a câmera do desenho e a cor chapada
  nas laterais/costas. Resultado: de frente o personagem *é* o desenho (rosto, roupas, adereços pintados); de lado/costas é uma versão simplificada.
- **Fundo:** removido por flood fill + bolsões de branco puro (vãos entre dedos), preenchido pela cor vizinha (sem halo) e erodido 3 px.
- **Contorno de nanquim:** casco invertido (`character_outline.gdshader`), fator por vértice em `UV2.x` (0 em detalhes pequenos como nariz/orelha/garras).
- **Geometria auxiliar (adereços):** bolsa (Theo, Elias), livro, boné, algemas + correntes (Prisioneiro), martelo, machado, chifres, capa, garras.

## Esqueleto comum (19 ossos + `nose`)

`hips → spine → chest → neck → head (+nose)`; `chest → shoulder_L/R → upperarm → forearm → hand`; `hips → thigh → shin → foot`. `_L` = esquerda do personagem
(+X, direita da imagem). Repouso = pose da arte (rotações identidade), então a **mesma biblioteca de animações** serve a todos (humanos e criaturas bípedes).
`godot/assets/characters/humanoid_bone_map.tres` mapeia os 19 ossos para `SkeletonProfileHumanoid` (retargeting com animações externas no futuro).

## Elenco gerado (13 modelos)

| id | Arte | Altura | Observações |
|---|---|---|---|
| theo | theo.jpg | 1,45 | bolsa a tiracolo |
| theo_t1 … theo_t4 | transformacao_theo_01..04.jpg | 1,45 | mesma silhueta; t3/t4: orelhas pontudas, antebraços finos com garras; t4: cabeça projetada à frente e orelhas grandes. A sombra deformada de t2 é um efeito à parte (não modelada). |
| clara | clara.jpg | 1,66 | cabelo comprido; braço esquerdo dobrado sobre o peito |
| elias | elias.jpg | 1,78 | bolsa, livro, mão sobre o peito |
| silas | silas.jpg | 1,82 | casaco militar, boné na mão |
| silas_troll | silas_troll.jpg | 2,15 | alto, curvado, garras, distintivo |
| prisioneiro | prisioneiro.jpg | 1,70 | curvado, descalço, algemas com correntes |
| troll_vigia | troll_vigia.jpg | 1,62 | arte em **perfil**; capa; de frente usa cor chapada (a menos fiel) |
| troll_ferreiro | troll_ferreiro.jpg | 1,85 | avental, chifres, martelo |
| troll_guardiao | troll_guardiao.jpg | 2,40 | gigante corcunda, machado de pedra |

## Limites honestos

- São **aproximações geradas por código**, não esculturas de artista: volumes simples (tubos/elipsoides), sem dedos individuais, sem malha de cabelo detalhada.
- Fidelidade máxima de frente; laterais/costas usam cor chapada (a arte só mostra um ângulo).
- Poses de repouso seguem a arte (Clara com o braço dobrado, Vigia curvado): as animações comuns funcionam, mas ficam menos naturais nesses casos.
- Se o responsável fornecer modelos esculpidos/riggados no futuro, entram no lugar via `scenes/characters` sem mudar a lógica (contrato do `CharacterRig`).

## Comandos

```
node tools/models/annotate-grid.mjs assets_fornecidos/personagens_3d/<arte>.jpg /tmp/grade.png   # grade para ler pontos-chave
node tools/models/build-character.mjs all            # regenera todos os GLB (ou: theo clara …)
npm run godot:characters                             # GLB + biblioteca de animações + BoneMap + importação
tools/godot/char-view.sh theo clara [--pose=walk]    # renderiza frente/3-4/perfil/costas (Xvfb)
GODOT=<binário> npm run godot:test                   # testes (inclui tests/test_characters.gd)
```
