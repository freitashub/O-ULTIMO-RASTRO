# Sistema de personagens

## PlayerTheo (`scripts/player/player_theo.gd`)

`CharacterBody3D` (camada 2, máscara 1) + cápsula (raio 0,26 m, altura 1,45 m). Estados: `idle, walk, run, interact, talk, cinematic`.
Sem combate. Controles relativos à câmera com base congelada; `walk_to(p)` para travessias controladas (usa a mesma física);
`enter_talk()`, `play_interact()`, `set_controllable()`, `set_talking()`, `teleport()`, `facing()`.
O modelo vem de `Transformation.theo_variant(fase, nível)`: `theo` até a fase 7; depois `theo_t1…t4` conforme a progressão sutil do roteiro
(7 marca no braço · 11 olhos · 14 sombra · 17 respiração · 20 sexto símbolo — o nível de transformação continua vindo do `ChoiceSystem`).

## CharacterRig (`scripts/characters/character_rig.gd`)

Carrega `res://assets/characters/<id>/<id>.glb`, aplica `CharacterMaterial` (shader de projeção da arte + contorno) e monta
`AnimationPlayer` + `AnimationTree` (máquina de estados: `Locomotion` [BlendSpace1D idle/walk/run] · `Talk` · `Interact` → volta sozinho).
Contrato usado pelo jogo: `set_locomotion(speed_norm, running)`, `play_interact()`, `set_talking(on)`, `current_state()`, sinal `footstep`,
`head_global_position()`, `nose_global_position()`. Frente do personagem = **−Z** do rig (o glTF olha +Z; o rig gira o modelo 180°).

## Elenco

13 modelos gerados por script a partir da arte fornecida (ver `docs/CHARACTER_PIPELINE.md`): Theo (normal + 4 transformações), Clara, Elias, Silas humano,
Silas troll, Prisioneiro, Troll Vigia, Troll Ferreiro, Troll Guardião. Todos com o mesmo esqueleto de 19 ossos e a mesma biblioteca de animações.
Status: **aproximações geradas por código** (não esculpidas); fiéis ao desenho de frente, simplificadas nas laterais/costas.

## Animações disponíveis (só as que a Fase 1 exige)

`idle`, `walk`, `run`, `talk`, `interact`. Demais (`turn`, `fear`, `hurt`, `threat`, `work`, `hug`…) entram quando a fase que as usa for construída.
