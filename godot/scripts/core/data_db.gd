extends Node
## Autoload `Data`: carrega os JSON narrativos sincronizados de src/data (tools/godot/sync-data.mjs).

var phases: Array = []
var clues: Array = []
var symbols: Array = []
var voice_lines: Dictionary = {}
var _layouts: Dictionary = {}


func _ready() -> void:
	phases = _read("res://data/phases.json", [])
	clues = _read("res://data/clues.json", [])
	symbols = _read("res://data/symbols.json", [])
	voice_lines = _read("res://data/voiceLines.json", {})


func _read(path: String, fallback: Variant) -> Variant:
	if not FileAccess.file_exists(path):
		push_error("Data: arquivo ausente %s" % path)
		return fallback
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed == null:
		push_error("Data: JSON inválido %s" % path)
		return fallback
	return parsed


func phase(phase_id: int) -> Dictionary:
	for p in phases:
		if int(p["id"]) == phase_id:
			return p
	return {}


func clue(clue_id: String) -> Dictionary:
	for c in clues:
		if c["id"] == clue_id:
			return c
	return {}


func layout(name: String) -> Dictionary:
	if not _layouts.has(name):
		_layouts[name] = _read("res://data/layouts/%s.json" % name, {})
	return _layouts[name]


func voice_line(line_id: String) -> Dictionary:
	for l in voice_lines.get("lines", []):
		if l["id"] == line_id:
			return l
	return {}
