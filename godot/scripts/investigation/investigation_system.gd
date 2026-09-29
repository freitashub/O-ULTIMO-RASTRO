class_name InvestigationSystem
extends Node
## Examinar → descobrir → registrar → adicionar pista → atualizar GameState.
## Os IDs de pistas/flags são os narrativos existentes (clues.json); nada é inventado aqui.

signal examined(entry_id: String, first_time: bool)
signal clue_discovered(clue_id: String)


func examine(entry: Dictionary) -> Dictionary:
	var id := String(entry.get("id", ""))
	var first := not GameState.has_flag("examined_%s" % id)
	if id != "":
		GameState.set_flag("examined_%s" % id)
	if entry.has("flag"):
		GameState.set_flag(String(entry["flag"]))
	var clue_new := false
	if entry.has("clue"):
		clue_new = GameState.add_clue(String(entry["clue"]))
		if clue_new:
			clue_discovered.emit(String(entry["clue"]))
	examined.emit(id, first)
	return {"first_time": first, "clue_added": clue_new, "text": String(entry.get("text", ""))}
