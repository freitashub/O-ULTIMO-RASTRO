class_name SaveCodec
extends RefCounted
## Serialização e migração do save (port de migrateSave em src/game/SaveManager.ts).


static func migrate(save: Dictionary) -> Dictionary:
	if int(save.get("saveVersion", 1)) < 2:
		save["cube"] = {
			"positions": [], "solved": false, "attempts": 0, "unlockedFace": false,
			"symbolOrder": [], "diarySymbols": save.get("symbols", []),
		}
		save["saveVersion"] = 2
	if int(save.get("saveVersion", 1)) < 3:
		save["flags"] = save.get("flags", {})
		save["unlockedEndings"] = save.get("unlockedEndings", [save["ending"]] if save.get("ending") != null else [])
		save["language"] = save.get("language", "pt-BR")
		save["audioSettings"] = save.get("audioSettings", GameStateModel.default_audio())
		save["subtitleSettings"] = save.get("subtitleSettings", GameStateModel.default_subtitles())
		save["accessibilitySettings"] = save.get("accessibilitySettings", GameStateModel.default_accessibility())
		save["discoveredCharacters"] = save.get("discoveredCharacters", [])
		save["saveVersion"] = GameStateModel.SAVE_VERSION
	return save


static func encode(state: Dictionary) -> String:
	return JSON.stringify(state)


## Retorna {} se o texto não é um save válido.
static func decode(text: String) -> Dictionary:
	var json := JSON.new()
	if json.parse(text) != OK or typeof(json.data) != TYPE_DICTIONARY:
		return {}
	var d: Dictionary = json.data
	if not d.has("currentPhase") or not d.has("choices"):
		return {}
	return migrate(d)
