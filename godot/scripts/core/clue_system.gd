extends Node
## Autoload `Clues` (port de ClueSystem.ts + registro de descoberta da InvestigationSystem).


func has_clue(clue_id: String) -> bool:
	return GameState.has_clue(clue_id)


func get_clue(clue_id: String) -> Dictionary:
	return Data.clue(clue_id)


func discovered() -> Array:
	var out: Array = []
	for c in Data.clues:
		if GameState.has_clue(c["id"]):
			out.append(c)
	return out
