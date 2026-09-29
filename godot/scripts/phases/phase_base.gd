class_name PhaseBase
extends Node3D
## Base de fase 3D: monta mundo (layout JSON), Theo, câmeras cinematográficas, interação, investigação, HUD e áudio,
## e resolve interações genéricas ("examine"). Cada fase sobrescreve só o que é específico dela.

signal finished(next_phase: int)
signal back_to_menu

var phase_id := 1
var layout_name := "phase01"
var layout: Dictionary
var phase: Dictionary
var refs: Dictionary
var player: PlayerTheo
var cam: Camera3D
var cameras: CinematicCameraManager
var interaction: InteractionSystem
var investigation: InvestigationSystem
var hud: Hud
var busy := false
var auto_intro := true


func _ready() -> void:
	phase = Data.phase(phase_id)
	layout = Data.layout(layout_name)
	assert(not layout.is_empty(), "layout %s ausente" % layout_name)
	refs = LayoutBuilder.build(layout, self)
	cam = Camera3D.new()
	cam.name = "PhaseCamera"
	cam.near = 0.1
	cam.far = 60.0
	cam.current = true
	add_child(cam)
	player = PlayerTheo.new()
	player.name = "Theo"
	add_child(player)
	var sp: Dictionary = layout["spawn"]
	player.teleport(Vector3(sp["pos"][0], sp["pos"][1], sp["pos"][2]), deg_to_rad(float(sp.get("yaw_deg", 0.0))))
	cameras = CinematicCameraManager.new()
	cameras.name = "CameraManager"
	add_child(cameras)
	cameras.setup(cam, player)
	cameras.add_shots_from_data(layout["cameras"])
	player.camera_manager = cameras
	cameras.snap()
	interaction = InteractionSystem.new()
	interaction.name = "Interaction"
	add_child(interaction)
	interaction.setup(player)
	investigation = InvestigationSystem.new()
	investigation.name = "Investigation"
	add_child(investigation)
	hud = Hud.new()
	hud.name = "Hud"
	add_child(hud)
	hud.set_black()
	interaction.focus_changed.connect(_on_focus_changed)
	interaction.activated.connect(_on_activated)
	investigation.clue_discovered.connect(_on_clue_discovered)
	player.footstep.connect(_on_footstep)
	GameState.set_current_phase(phase_id)
	hud.set_objective(String(layout.get("objective", phase.get("objective", ""))))
	_start_audio()
	if auto_intro:
		_intro.call_deferred()


func _start_audio() -> void:
	var a: Dictionary = layout.get("audio", {})
	if a.has("ambience"):
		AudioDirector.play_loop("ambience", a["ambience"], -8.0)
	if a.has("music"):
		AudioDirector.play_loop("music", a["music"], -12.0)


func _exit_tree() -> void:
	AudioDirector.stop_loop("ambience")
	AudioDirector.stop_loop("music")


func _intro() -> void:
	busy = true
	player.set_controllable(false)
	await hud.fade(false, 1.2)
	await hud.show_title("%d · %s" % [phase_id, phase["title"]], phase.get("objective", ""))
	await hud.say(phase["intro"])
	await hud.say(phase["scene"])
	busy = false
	player.set_controllable(true)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel"):
		back_to_menu.emit()
		return
	if event.is_action_pressed("interact") and not busy and not hud.dialog_open and not hud.choice_open:
		if interaction.activate():
			get_viewport().set_input_as_handled()


func _process(_dt: float) -> void:
	# prompt de interação
	if busy or hud.dialog_open or hud.choice_open or interaction.focus == null:
		hud.set_prompt("")
	else:
		hud.set_prompt("[E]  %s" % interaction.focus.label)


func _on_focus_changed(_item: Interactable) -> void:
	pass


func _on_footstep() -> void:
	AudioDirector.play_sfx("sfx_step_wood", "Sfx", -10.0)


func _on_clue_discovered(clue_id: String) -> void:
	var c := Clues.get_clue(clue_id)
	AudioDirector.play_sfx("sfx_clue_found", "Sfx", -4.0)
	hud.toast("%s: %s" % [I18n.t("explore.clues").capitalize(), c.get("text", clue_id)])


func _on_activated(item: Interactable) -> void:
	if busy:
		return
	match String(item.data.get("type", "examine")):
		"examine":
			await _examine(item)
		"choice":
			await _on_choice_door(item)


func _begin_interaction(item: Interactable) -> void:
	busy = true
	interaction.enabled = false
	interaction.refresh()
	player.face_point(item.global_position)
	player.enter_talk()
	player.play_interact()


func _end_interaction() -> void:
	busy = false
	interaction.enabled = true
	player.set_controllable(true)


func _examine(item: Interactable) -> void:
	_begin_interaction(item)
	AudioDirector.play_sfx("sfx_investigate", "Sfx", -6.0)
	var result := investigation.examine(item.data)
	if String(result["text"]) != "":
		await hud.say(String(result["text"]), item.label)
	hud.refresh_clue_count()
	var then := String(item.data.get("then", ""))
	if then == "finish_phase":
		await finish_phase()
		return
	_end_interaction()


## Override na fase quando a porta/escolha tem fluxo próprio.
func _on_choice_door(_item: Interactable) -> void:
	pass


func finish_phase() -> void:
	busy = true
	interaction.enabled = false
	if phase.get("cliffhanger", "") != "":
		await hud.say(String(phase["cliffhanger"]))
	await hud.fade(true, 1.0)
	GameState.set_current_phase(phase_id + 1)
	SaveSystem.save_game()
	finished.emit(phase_id + 1)
