extends Node
## Autoload `GameState`: guarda o estado corrente (Dictionary, schema v3) e expõe os mutadores.
## Toda a lógica pura está em GameStateModel.

signal changed
signal clue_added(clue_id: String)

var state: Dictionary = GameStateModel.create_initial()


func reset() -> void:
	state = GameStateModel.create_initial()
	changed.emit()


func replace(new_state: Dictionary) -> void:
	state = new_state
	changed.emit()


func set_current_phase(phase_id: int) -> void:
	state["currentPhase"] = phase_id
	changed.emit()


func set_flag(flag: String, value: bool = true) -> void:
	GameStateModel.set_flag(state, flag, value)
	changed.emit()


func has_flag(flag: String) -> bool:
	return GameStateModel.has_flag(state, flag)


func add_clue(clue_id: String) -> bool:
	var is_new := GameStateModel.add_clue(state, clue_id)
	if is_new:
		clue_added.emit(clue_id)
		changed.emit()
	return is_new


func has_clue(clue_id: String) -> bool:
	return GameStateModel.has_clue(state, clue_id)


func resolve_choice(phase: Dictionary, choice: Dictionary) -> Dictionary:
	var before_clues: Array = state["clues"].duplicate()
	var result := ChoiceSystem.resolve(phase, choice, state)
	for c in state["clues"]:
		if not c in before_clues:
			clue_added.emit(c)
	changed.emit()
	return result
