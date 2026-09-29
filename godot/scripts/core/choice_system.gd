class_name ChoiceSystem
extends RefCounted
## Port de src/game/ChoiceSystem.ts — mesma lógica, mesmos flags.


static func resolve(phase: Dictionary, choice: Dictionary, state: Dictionary) -> Dictionary:
	GameStateModel.register_choice(state, int(phase["id"]), String(choice["id"]))
	var correct: bool = choice.get("correct", false)
	if correct:
		if choice.has("clueReward"):
			GameStateModel.add_clue(state, String(choice["clueReward"]))
		if phase.has("clueReward"):
			GameStateModel.add_clue(state, String(phase["clueReward"]))
		if phase.has("symbolReward"):
			var sym := String(phase["symbolReward"])
			if not sym in state["symbols"]:
				state["symbols"].append(sym)
				state["cube"]["diarySymbols"].append(sym)
				state["flags"]["symbol_%s" % sym] = true
		state["flags"]["phase_%d_correct" % int(phase["id"])] = true
	else:
		GameStateModel.increment_errors(state)
		state["transformationLevel"] = mini(int(state["transformationLevel"]) + int(choice.get("transformationDelta", 1)), 5)
		state["flags"]["phase_%d_wrong" % int(phase["id"])] = true
	return {
		"correct": correct,
		"consequence": String(choice.get("consequence", "")),
		"clueReward": choice.get("clueReward", ""),
		"symbolReward": phase.get("symbolReward", ""),
	}
