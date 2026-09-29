extends Node
## Autoload `SaveSystem`: `user://save_current.json`. No export Web, `user://` é IndexedDB (persistente).

const PATH := "user://save_current.json"
var path_override: String = ""  # testes


func _path() -> String:
	return path_override if path_override != "" else PATH


func has_save() -> bool:
	return FileAccess.file_exists(_path())


func save_game(state: Dictionary = GameState.state) -> bool:
	var f := FileAccess.open(_path(), FileAccess.WRITE)
	if f == null:
		push_error("SaveSystem: não foi possível gravar %s (erro %d)" % [_path(), FileAccess.get_open_error()])
		return false
	f.store_string(SaveCodec.encode(state))
	f.close()
	return true


func load_game() -> Dictionary:
	if not has_save():
		return {}
	return SaveCodec.decode(FileAccess.get_file_as_string(_path()))


func continue_game() -> bool:
	var s := load_game()
	if s.is_empty():
		return false
	GameState.replace(s)
	return true


func delete_save() -> void:
	if has_save():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(_path()))
