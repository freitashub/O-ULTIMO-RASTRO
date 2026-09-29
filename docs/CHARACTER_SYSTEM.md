# Sistema de personagens

## PlayerTheo (`scripts/player/player_theo.gd`)

`CharacterBody3D` (camada 2, máscara 1) + cápsula (raio 0,26 m, altura 1,45 m). Estados: `idle, walk, run, interact, talk, cinematic`.
Sem combate. Controles relativos à câmera com base congelada; `walk_to(p)` para travessias controladas (usa a mesma física);
`enter_talk()`, `play_interact()`, `set_controllable()`, `teleport()`, `facing()`.

O visual é um nó filho (`Visual`). Hoje: `TheoPlaceholderRig` (**placeholder**, ver `docs/PLACEHOLDERS.md`).

## Contrato do visual (o que o modelo real precisa cumprir)

- `set_locomotion(speed_norm, running)`, `play_interact()`, sinal `footstep`, `head_global_position()`.
- Frente do personagem = **−Z** do `Visual` (convenção Godot). O placeholder gira o glTF (+Z) em 180°.
- Quando os modelos reais chegarem: criar `scenes/characters/<id>.tscn` com `Skeleton3D` + `AnimationPlayer`/`AnimationTree` cumprindo esse contrato,
  sem alterar o arquivo-fonte (o ajuste vive na cena derivada).

## Roster (seção 6 do prompt)

| Personagem | Referência visual (fornecida) | Modelo 3D |
|---|---|---|
| Theo (+ transformações 01–04) | `theo.jpg`, `transformacao_theo_01..04.jpg` | **placeholder v3 procedural** (só o normal) |
| Clara, Elias, Prisioneiro | `clara.jpg`, `elias.jpg`, `prisioneiro.jpg` | ausente |
| Silas humano / troll | `silas.jpg`, `silas_troll.jpg` | ausente |
| Troll Vigia / Ferreiro / Guardião | `troll_vigia.jpg`, `troll_ferreiro.jpg`, `troll_guardiao.jpg` | ausente |

As imagens são arte 2D de conceito, não modelos. Ver `docs/3D_AUDIT.md §3`.
