extends Node
## QA visual (precisa de renderização: xvfb-run + --rendering-driver opengl3). Salva capturas em --out=DIR.
## Uso: xvfb-run -a godot --path godot --rendering-driver opengl3 res://tests/qa_shots.tscn -- --out=/tmp/shots

var out_dir := "/tmp/ur_shots"
var phase: Phase01


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out_dir = a.substr(6)
	DirAccess.make_dir_recursive_absolute(out_dir)
	GameState.reset()
	phase = Phase01.new()
	phase.auto_intro = false
	add_child(phase)
	await _frames(8)
	phase.hud._fade.color.a = 0.0
	var spots := [
		["01_spawn_sala_entrada", Vector3(-1.6, 0, 1.2), 0.0],
		["02_sala_portas", Vector3(-3.0, 0, -2.6), 0.0],
		["03_porta_garagem", Vector3(0.8, 0, -1.0), 90.0],
		["04_varanda", Vector3(-4.0, 0, 4.6), 180.0],
		["05_garagem_entrada", Vector3(3.4, 0, -1.0), -90.0],
		["06_garagem_fundo", Vector3(8.6, 0, 0.2), -90.0],
	]
	for s in spots:
		phase.player.teleport(s[1], deg_to_rad(s[2]))
		phase.cameras.snap()
		await _frames(6)
		_save(s[0])
	# UI: prompt, diálogo e escolha
	phase.player.teleport(Vector3(-2.5, 0, 2.2), 0.0)
	phase.cameras.snap()
	await _frames(10)
	_save("07_prompt_casaco")
	phase.busy = true
	phase.hud.say("O casaco de Clara está no chão, ainda úmido. Ela nunca deixaria isso aqui.", "Casaco da mãe")
	await _frames(40)
	_save("08_dialogo")
	phase.hud.advance.emit()
	phase.hud._accept_after = 0
	phase.hud._typing = false
	await _frames(4)
	phase.hud.dialog_open = false
	phase.hud._dialog.visible = false
	phase.hud._waiting_advance = false
	phase.hud.choose(I18n.t("choice.question"), ["Quarto da mãe", "Garagem", "Cozinha"], 1)
	await _frames(12)
	_save("09_escolha")
	get_tree().quit(0)


func _frames(n: int) -> void:
	for i in n:
		await get_tree().process_frame


func _save(name: String) -> void:
	var img := get_viewport().get_texture().get_image()
	img.save_png("%s/%s.png" % [out_dir, name])
	print("captura: ", name, " ", img.get_size())
