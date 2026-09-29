extends Node
## Autoload `I18n`: mesmas chaves e dicionários da versão Phaser (godot/data/i18n/*.json).

const SUPPORTED := ["pt-BR", "en-US", "es-ES"]
const DEFAULT := "pt-BR"

var _dicts: Dictionary = {}


func _ready() -> void:
	for lang in SUPPORTED:
		var path := "res://data/i18n/%s.json" % lang
		if FileAccess.file_exists(path):
			_dicts[lang] = JSON.parse_string(FileAccess.get_file_as_string(path))


func language() -> String:
	return GameState.state.get("language", DEFAULT)


func t(key: String, params: Dictionary = {}) -> String:
	var value: Variant = _dicts.get(language(), {}).get(key)
	if value == null:
		value = _dicts.get(DEFAULT, {}).get(key, key)
	var s := String(value)
	for k in params:
		s = s.replace("{{%s}}" % k, str(params[k]))
	return s
