class_name GameStateModel
extends RefCounted
## Modelo puro do estado do jogo (mesmo schema v3 da versão Phaser: src/types/GameState.ts).
## Funções estáticas sobre um Dictionary — testáveis sem SceneTree. Chaves em camelCase de propósito:
## o JSON de save é idêntico ao da versão web.

const SAVE_VERSION := 3


static func default_audio() -> Dictionary:
	return {
		"masterVolume": 1.0, "musicVolume": 0.6, "sfxVolume": 0.8,
		"voiceVolume": 1.0, "ambienceVolume": 0.7, "muted": false,
	}


static func default_subtitles() -> Dictionary:
	return {"enabled": true, "fontSize": 18, "position": "bottom", "background": true}


static func default_accessibility() -> Dictionary:
	return {"highContrast": false, "textSpeed": "normal", "reduceMotion": false}


static func create_initial() -> Dictionary:
	return {
		"saveVersion": SAVE_VERSION,
		"currentPhase": 1,
		"errors": 0,
		"choices": {},
		"clues": [],
		"symbols": [],
		"discoveredCharacters": [],
		"trustPolice": 50,
		"transformationLevel": 0,
		"cube": {
			"positions": [], "solved": false, "attempts": 0,
			"unlockedFace": false, "symbolOrder": [], "diarySymbols": [],
		},
		"ending": null,
		"flags": {},
		"unlockedEndings": [],
		"language": "pt-BR",
		"audioSettings": default_audio(),
		"subtitleSettings": default_subtitles(),
		"accessibilitySettings": default_accessibility(),
	}


static func register_choice(state: Dictionary, phase_id: int, choice_id: String) -> void:
	state["choices"][str(phase_id)] = choice_id


static func increment_errors(state: Dictionary) -> void:
	state["errors"] = int(state["errors"]) + 1


static func change_police_trust(state: Dictionary, delta: int) -> void:
	state["trustPolice"] = clampi(int(state["trustPolice"]) + delta, 0, 100)


static func set_flag(state: Dictionary, flag: String, value: bool = true) -> void:
	state["flags"][flag] = value


static func has_flag(state: Dictionary, flag: String) -> bool:
	return state["flags"].get(flag, false) == true


static func add_clue(state: Dictionary, clue_id: String) -> bool:
	## Retorna true se a pista é nova.
	if clue_id in state["clues"]:
		return false
	state["clues"].append(clue_id)
	state["flags"]["clue_%s" % clue_id] = true
	return true


static func has_clue(state: Dictionary, clue_id: String) -> bool:
	return clue_id in state["clues"]


static func unlock_ending(state: Dictionary, ending: String) -> void:
	if not ending in state["unlockedEndings"]:
		state["unlockedEndings"].append(ending)
