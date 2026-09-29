# Sistema de interação

`Interactable` (Node3D no piso, `height` = ponto de interesse) + `InteractionSystem` (foco/ativação) + handlers da fase.

- **Foco:** dentro de `radius` (distância no plano XZ), habilitado, com **linha de visão** (raio da altura dos olhos até o ponto de interesse contra o
  mundo, tolerância 0,45 m para objetos encostados em paredes/portas) e desempate por proximidade e orientação (`dist − 0,6·dot(facing)`).
- **Prompt:** `[E]  <rótulo>`; `E`/`Enter`/`Espaço` ativam; enquanto há diálogo/escolha o foco é suprimido.
- **Dados (`on_interact`):** `{type:"examine", id, text, flag?, clue?, then?}` ou `{type:"choice", choice:"a|b|c"}`. `then:"finish_phase"` encerra a fase.
- **Campos por interativo:** id, tipo, texto, consequência (flag/pista/escolha), som (`sfx_investigate`, `sfx_door_open`…), estado (`enabled`).
- Portas: `DoorNode` (dobradiça, colisor desligado ao abrir, sinal `opened`).

Testes: `tests/test_interaction.gd` (foco, raio, parede bloqueia, ativação, desabilitado) e os fluxos de `test_phase01.gd`.
