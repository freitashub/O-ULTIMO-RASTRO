# Sistema de animação

Estado atual (Fase 1, placeholder): `TheoPlaceholderRig` anima 15 ossos por código a cada frame.

- **Caminhada/corrida:** coxas alternadas (±0,52 rad × velocidade normalizada), joelho dobra na fase de balanço, pé compensa, braços opostos
  às pernas com cotovelo, balanço de quadril e contra-rotação da coluna, cabeça estabilizada. Fase avança mais rápido com a velocidade.
- **Parado:** respiração no tórax, leve olhar lateral da cabeça.
- **Interagir:** braço direito estende e a coluna se inclina (0,9 s).
- **Passos:** sinal `footstep` na troca de sinal do seno da fase → `AudioDirector.play_sfx("sfx_step_wood")`.

Testes: `test_animacao_placeholder_pernas_alternam` (diferença entre coxas > 0,5 rad, joelho > 0,3 rad) e
`test_frente_do_modelo_aponta_para_a_direcao` (o osso `nose` fica à frente da direção de movimento).

## Plano para os modelos reais (seções 7–8 do prompt)

1. Validar esqueleto por personagem (nomes, hierarquia, rest pose, escala, pesos).
2. Humanoides: `Skeleton3D` + `BoneMap` + `SkeletonProfileHumanoid`; criaturas: estratégia própria (sem forçar o perfil humanoide).
3. `AnimationPlayer` + `AnimationTree` (máquina de estados Idle/Walk/Run/Interact/Talk…), transições com blend curto.
4. Só as animações que a fase em construção exige (pasta `animations/<personagem>/`).
Bloqueado até existirem modelos (`docs/3D_AUDIT.md §3`).
