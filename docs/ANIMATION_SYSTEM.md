# Sistema de animação

## Estado atual

Biblioteca compartilhada `godot/assets/animations/humanoid_library.res`, gerada por `godot/tools/build_animations.gd` (fórmulas de ciclo → trilhas de
rotação por osso, caminho `Skeleton3D:<osso>` relativo ao nó pai do esqueleto, portanto válido para todos os personagens):

| Animação | Duração | Conteúdo |
|---|---|---|
| idle | 4 s (laço) | respiração no tórax, olhar lateral da cabeça, leve transferência de peso |
| walk | 1,05 s (laço) | coxas alternadas (±0,52 rad), joelho dobra no balanço, pé compensa, braços opostos com cotovelo, balanço de quadril e contra-rotação da coluna |
| run | 0,64 s (laço) | idem com amplitudes maiores e inclinação do tronco |
| talk | 3,2 s (laço) | idle + gestos do braço direito e aceno da cabeça |
| interact | 1 s (uma vez) | braço direito estende e a coluna se inclina |

`CharacterRig` monta `AnimationTree` com `AnimationNodeStateMachine`: `Locomotion` (BlendSpace1D: idle 0 · walk 0,54 · run 1,0, alimentado pela velocidade),
`Talk`, `Interact` (transição automática de volta ao terminar), cross-fade de 0,2 s. Passos: sinal `footstep` na troca de sinal da coxa esquerda.

## Retargeting

`godot/assets/characters/humanoid_bone_map.tres` mapeia os 19 ossos para `SkeletonProfileHumanoid` (gerado por `godot/tools/build_bonemap.gd`).
Como todos os esqueletos compartilham nomes e orientação, a biblioteca é reaproveitada sem retargeting; o BoneMap serve para importar animações externas.
Criaturas não são forçadas a perfis diferentes: usam o mesmo esqueleto bípede adaptado às proporções da arte.

## Testes

`tests/test_characters.gd`: todos os ossos animados existem em todos os 13 esqueletos; laços/one-shot corretos; locomoção (coxas > 0,5 rad, joelho > 0,3 rad),
volta ao repouso, estados Talk/Interact e retorno para 5 personagens (humano, criatura corcunda, gigante).

## Próximas animações (por fase, não antes)

turn, start/stop-walk, look, crouch, inspect, fear, hurt, fall (Theo); gesture, hug, emotional (Clara); investigate (Elias); threat, observe, work (trolls);
weak movement (Prisioneiro). Cada uma entra em `build_animations.gd` quando uma fase a exigir.
