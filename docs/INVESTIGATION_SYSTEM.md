# Sistema de investigação

`InvestigationSystem.examine(entry)`: **examinar → descobrir → registrar → adicionar pista → atualizar GameState**.

- Registra `examined_<id>` (primeira vez vs. repetição), liga `flag` (ex.: `saw_tire_mark`, `found_photo_symbol`), adiciona `clue` (ex.: `tire_mark`) e
  emite `clue_discovered` (toast + `sfx_clue_found`). IDs narrativos são os de `clues.json`; nenhum foi renomeado.
- Pistas por escolha continuam sendo concedidas pelo `ChoiceSystem` (mesma regra da versão Phaser: `clueReward` só na escolha correta).
- Consulta: autoload `Clues` (`has_clue`, `get_clue`, `discovered`).

Testes: `test_interaction.gd::test_investigacao_flags_e_pistas` e `test_core.gd` (pista duplicada, save/load).
