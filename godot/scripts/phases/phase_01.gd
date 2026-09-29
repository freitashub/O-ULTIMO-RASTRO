class_name Phase01
extends PhaseBase
## Fase 1 — A Casa Vazia (vertical slice). Sala → 3 portas (escolha física) → garagem (pista + fotografia) → Fase 2.
## Lógica narrativa: phases.json/ChoiceSystem (mesmos textos, IDs e consequências da versão Phaser).

var chosen := ""
var choice_result: Dictionary = {}


func _init() -> void:
	phase_id = 1
	layout_name = "phase01"


func _on_choice_door(item: Interactable) -> void:
	_begin_interaction(item)
	var choices: Array = phase["choices"]
	var options: Array = []
	var focus := 0
	for i in choices.size():
		options.append(choices[i]["text"])
		if choices[i]["id"] == item.data["choice"]:
			focus = i
	var idx: int = await hud.choose(I18n.t("choice.question"), options, focus)
	var choice: Dictionary = choices[idx]
	chosen = String(choice["id"])
	AudioDirector.play_sfx("ui_confirm", "Ui")
	choice_result = GameState.resolve_choice(phase, choice)
	SaveSystem.save_game()
	hud.refresh_clue_count()
	var door_id := _door_for_choice(chosen)
	AudioDirector.play_sfx("sfx_door_open", "Sfx", -4.0)
	if refs["doors"].has(door_id):
		(refs["doors"][door_id] as DoorNode).open()
	AudioDirector.play_sfx("sfx_clue_found" if choice_result["correct"] else "sfx_choice_wrong", "Sfx", -4.0)
	await hud.say(String(choice_result["consequence"]))
	if choice_result["clueReward"] != "":
		var c := Clues.get_clue(String(choice_result["clueReward"]))
		hud.toast("%s: %s" % [I18n.t("explore.clues").capitalize(), c.get("text", "")])
	# as três portas ficam decididas: sem nova escolha
	for id in ["door_quarto", "door_cozinha", "door_garagem"]:
		(refs["interactables"][id] as Interactable).enabled = false
	if choice_result["correct"]:
		# rota correta: garagem aberta, explorar e achar a fotografia
		for id in ["garage_tire", "workbench", "cabinet", "photo"]:
			(refs["interactables"][id] as Interactable).enabled = true
		hud.set_objective("Examinar a garagem")
		_end_interaction()
	else:
		# como na versão Phaser: a revelação e o gancho vêm de qualquer forma; o erro fica registrado
		if phase.get("revelation", "") != "":
			await hud.say(String(phase["revelation"]))
		await finish_phase()


func _door_for_choice(choice_id: String) -> String:
	match choice_id:
		"a": return "door_quarto"
		"b": return "door_garagem"
		_: return "door_cozinha"
