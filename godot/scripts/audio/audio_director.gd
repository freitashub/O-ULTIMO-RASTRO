extends Node
## Autoload `AudioDirector` (esqueleto): barramentos e catálogo de SFX/ambiência/música. Arquivos em res://assets/audio.
## Fase 1 usa poucos ids; o catálogo cresce por fase (regra: não criar biblioteca gigante antes da necessidade).

var _players: Dictionary = {}
var _catalog: Dictionary = {}
var muted := false


func _ready() -> void:
	for bus in ["Music", "Ambience", "Sfx", "Voice", "Ui"]:
		if AudioServer.get_bus_index(bus) == -1:
			AudioServer.add_bus()
			var idx := AudioServer.bus_count - 1
			AudioServer.set_bus_name(idx, bus)
			AudioServer.set_bus_send(idx, "Master")
	var path := "res://assets/audio/catalog.json"
	if FileAccess.file_exists(path):
		_catalog = JSON.parse_string(FileAccess.get_file_as_string(path))


func has_sound(id: String) -> bool:
	return _catalog.has(id) and ResourceLoader.exists(_catalog[id]["file"])


func play_sfx(id: String, bus: String = "Sfx", volume_db: float = 0.0) -> AudioStreamPlayer:
	if muted or not has_sound(id):
		return null
	var p := AudioStreamPlayer.new()
	p.stream = load(_catalog[id]["file"])
	p.bus = bus
	p.volume_db = volume_db + float(_catalog[id].get("gain_db", 0.0))
	add_child(p)
	p.finished.connect(p.queue_free)
	p.play()
	return p


func play_loop(channel: String, id: String, volume_db: float = -6.0) -> void:
	stop_loop(channel)
	if muted or not has_sound(id):
		return
	var p := AudioStreamPlayer.new()
	var stream: AudioStream = load(_catalog[id]["file"])
	if stream is AudioStreamOggVorbis:
		(stream as AudioStreamOggVorbis).loop = true
	p.stream = stream
	p.bus = "Music" if channel == "music" else "Ambience"
	p.volume_db = volume_db
	add_child(p)
	p.play()
	_players[channel] = p


func stop_loop(channel: String) -> void:
	if _players.has(channel):
		(_players[channel] as AudioStreamPlayer).queue_free()
		_players.erase(channel)
