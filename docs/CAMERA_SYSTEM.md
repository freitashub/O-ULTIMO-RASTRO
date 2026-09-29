# Sistema de câmeras (CinematicCameraManager)

Câmeras fixas cinematográficas (decisão obrigatória, seção 9 do prompt): a posição é fixa por zona; o olhar pode acompanhar Theo
com amortecimento.

## Declaração (por fase, no layout JSON)

```json
{ "id": "sala_portas", "camera_position": [-5.6, 2.6, 2.6], "fov": 46, "priority": 0, "transition": 0.55,
  "follow_damping": 5, "camera_zone": { "min": [-6, -1, -4], "max": [2, 4, -0.3] } }
```

Campos: `camera_zone` (volume AABB), `camera_position`, `camera_rotation` (graus; olhar fixo) **ou** `look_target: [x,y,z]` (ponto) **ou** nada
(segue Theo), `look_offset`, `transition` (s; 0 = corte), `priority`, `fov` (vertical, graus), `follow_damping`.

## Regras

1. Entre as zonas que contêm Theo vence a de **maior prioridade**.
2. **Histerese** (`hysteresis`, padrão 0,5 m): o shot atual só é trocado se o candidato tem prioridade estritamente maior *ou* Theo saiu da
   zona atual expandida pela margem. Não há oscilação na fronteira.
3. Troca com **blend** (posição/rotação/FOV, ease smoothstep) ou corte seco.
4. `lock_to(id)` / `unlock()` para cutscenes e momentos narrativos; `snap()` posiciona sem blend.
5. Sinal `shot_changed(old,new)`; `PlayerTheo` mantém a base de controles congelada enquanto a tecla é mantida (troca de câmera não inverte o comando).

## Verificação automática

`tests/test_camera.gd` (seleção, histerese, prioridade, blend/corte, lock, sinal) e `test_phase01.gd::test_theo_sempre_visivel_das_cameras`, que
lança raios de cada câmera até a cabeça e o tronco de Theo em toda a malha caminhável (passo de 0,5 m) e exige zero oclusões por cenário/props.
