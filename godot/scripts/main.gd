extends Node
## Ponto de entrada: menu mínimo → fase corrente. Roteia `finished` para a próxima fase (ou tela "em construção").
## Argumentos de usuário: `-- --phase=1` inicia direto (QA); `-- --new` ignora o save.

var current: Node
var _menu: Control


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a == "--new":
			GameState.reset()
	for a in args:
		if a.begins_with("--phase="):
			GameState.set_current_phase(int(a.substr(8)))
			goto_phase(int(a.substr(8)))
			return
	_show_menu()


func _show_menu() -> void:
	_clear()
	_menu = Control.new()
	_menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_menu)
	current = _menu
	var bg := ColorRect.new()
	bg.color = Color(0.03, 0.035, 0.05)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu.add_child(bg)
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	box.offset_left = -220
	box.offset_right = 220
	box.offset_top = -170
	box.offset_bottom = 170
	box.add_theme_constant_override("separation", 16)
	_menu.add_child(box)
	var title := Label.new()
	title.text = I18n.t("menu.title")
	title.add_theme_font_size_override("font_size", 46)
	title.add_theme_color_override("font_color", Color(0.92, 0.9, 0.84))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var sub := Label.new()
	sub.text = "versão 3D · vertical slice"
	sub.add_theme_color_override("font_color", Color(0.55, 0.56, 0.6))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(sub)
	var b_new := _button(box, I18n.t("menu.newGame"))
	b_new.pressed.connect(func() -> void:
		GameState.reset()
		goto_phase(1))
	var b_cont := _button(box, I18n.t("menu.continue"))
	b_cont.disabled = not SaveSystem.has_save()
	b_cont.pressed.connect(func() -> void:
		if SaveSystem.continue_game():
			goto_phase(int(GameState.state["currentPhase"])))
	b_new.grab_focus()


func _button(parent: Node, text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 52)
	b.add_theme_font_size_override("font_size", 20)
	parent.add_child(b)
	return b


func _clear() -> void:
	if current and is_instance_valid(current):
		current.queue_free()
	current = null


func goto_phase(n: int) -> void:
	_clear()
	var path := "res://scenes/phases/phase_%02d.tscn" % n
	if ResourceLoader.exists(path):
		var p: PhaseBase = (load(path) as PackedScene).instantiate()
		current = p
		add_child(p)
		p.finished.connect(goto_phase)
		p.back_to_menu.connect(_show_menu)
	else:
		_show_stub(n)


func _show_stub(n: int) -> void:
	var c := Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(c)
	current = c
	var bg := ColorRect.new()
	bg.color = Color.BLACK
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.add_child(bg)
	var l := Label.new()
	var ph := Data.phase(n)
	l.text = "Fase %d — %s\n\nainda não construída em 3D (progresso salvo).\nPressione ESC para voltar ao menu." % [n, ph.get("title", "")]
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.set_anchors_preset(Control.PRESET_FULL_RECT)
	l.add_theme_font_size_override("font_size", 24)
	c.add_child(l)


func _unhandled_input(event: InputEvent) -> void:
	if current is Control and current != _menu and event.is_action_pressed("cancel"):
		_show_menu()
