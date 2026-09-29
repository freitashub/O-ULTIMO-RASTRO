class_name Hud
extends CanvasLayer
## Interface em jogo: prompt de interação, objetivo, caixa de diálogo, painel de escolha, toasts e fade.
## APIs assíncronas (`await hud.say(...)`, `await hud.choose(...)`) para manter os fluxos de fase lineares.

signal advance
signal choice_made(index: int)

const FONT_SIZE := 20
var _prompt: Label
var _objective: Label
var _title: Label
var _subtitle: Label
var _dialog: PanelContainer
var _speaker: Label
var _text: RichTextLabel
var _hint: Label
var _choice_panel: PanelContainer
var _choice_question: Label
var _choice_box: VBoxContainer
var _toast_box: VBoxContainer
var _fade: ColorRect
var _clue_count: Label

var dialog_open := false
var choice_open := false
var _choice_buttons: Array[Button] = []
var _waiting_advance := false
var _typing := false
var _accept_after := 0
var _choice_n := 0


func _ready() -> void:
	layer = 10
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_prompt = _label(root, "", 22, Color(0.95, 0.9, 0.75))
	_prompt.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_prompt.offset_top = -120
	_prompt.offset_bottom = -80
	_prompt.offset_left = -400
	_prompt.offset_right = 400
	_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_prompt.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	_prompt.add_theme_constant_override("outline_size", 6)
	_prompt.visible = false

	_objective = _label(root, "", 15, Color(0.7, 0.72, 0.78))
	_objective.position = Vector2(28, 24)
	_objective.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	_objective.add_theme_constant_override("outline_size", 4)

	_clue_count = _label(root, "", 14, Color(0.83, 0.68, 0.37))
	_clue_count.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	_clue_count.offset_left = -260
	_clue_count.offset_right = -24
	_clue_count.offset_top = 22
	_clue_count.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	_title = _label(root, "", 44, Color(0.92, 0.9, 0.84))
	_title.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_title.offset_left = -500
	_title.offset_right = 500
	_title.offset_top = -70
	_title.offset_bottom = 0
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.modulate.a = 0
	_subtitle = _label(root, "", 20, Color(0.7, 0.72, 0.78))
	_subtitle.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_subtitle.offset_left = -500
	_subtitle.offset_right = 500
	_subtitle.offset_top = 0
	_subtitle.offset_bottom = 40
	_subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle.modulate.a = 0

	_dialog = PanelContainer.new()
	_dialog.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_dialog.offset_left = 90
	_dialog.offset_right = -90
	_dialog.offset_top = -190
	_dialog.offset_bottom = -34
	_dialog.add_theme_stylebox_override("panel", _panel_style())
	_dialog.visible = false
	root.add_child(_dialog)
	var dv := VBoxContainer.new()
	dv.add_theme_constant_override("separation", 6)
	_dialog.add_child(dv)
	_speaker = _label(dv, "", 16, Color(0.83, 0.68, 0.37))
	_text = RichTextLabel.new()
	_text.bbcode_enabled = false
	_text.fit_content = false
	_text.scroll_active = false
	_text.custom_minimum_size = Vector2(0, 72)
	_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_text.add_theme_font_size_override("normal_font_size", FONT_SIZE)
	_text.add_theme_color_override("default_color", Color(0.9, 0.9, 0.88))
	dv.add_child(_text)
	_hint = _label(dv, "▸ E / Espaço", 13, Color(0.55, 0.56, 0.6))
	_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	_choice_panel = PanelContainer.new()
	_choice_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_choice_panel.offset_left = -330
	_choice_panel.offset_right = 330
	_choice_panel.offset_top = -170
	_choice_panel.offset_bottom = 170
	_choice_panel.add_theme_stylebox_override("panel", _panel_style())
	_choice_panel.visible = false
	root.add_child(_choice_panel)
	var cv := VBoxContainer.new()
	cv.add_theme_constant_override("separation", 12)
	_choice_panel.add_child(cv)
	_choice_question = _label(cv, "", 22, Color(0.92, 0.9, 0.84))
	_choice_question.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_choice_box = VBoxContainer.new()
	_choice_box.add_theme_constant_override("separation", 10)
	cv.add_child(_choice_box)

	_toast_box = VBoxContainer.new()
	_toast_box.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	_toast_box.offset_left = -420
	_toast_box.offset_right = -24
	_toast_box.offset_top = 56
	_toast_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_toast_box)

	_fade = ColorRect.new()
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.color = Color.BLACK
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_fade)
	refresh_clue_count()


func _label(parent: Node, text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	parent.add_child(l)
	return l


func _panel_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.05, 0.06, 0.09, 0.92)
	s.border_color = Color(0.32, 0.3, 0.26)
	s.set_border_width_all(1)
	s.set_corner_radius_all(3)
	s.content_margin_left = 26
	s.content_margin_right = 26
	s.content_margin_top = 18
	s.content_margin_bottom = 14
	return s


func refresh_clue_count() -> void:
	_clue_count.text = "%d %s" % [GameState.state["clues"].size(), I18n.t("explore.clues")]


func set_prompt(text: String) -> void:
	_prompt.text = text
	_prompt.visible = text != "" and not dialog_open and not choice_open


func set_objective(text: String) -> void:
	_objective.text = text


func toast(text: String, color: Color = Color(0.83, 0.68, 0.37)) -> void:
	var l := _label(_toast_box, text, 16, color)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("outline_size", 4)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.modulate.a = 0
	var tw := create_tween()
	tw.tween_property(l, "modulate:a", 1.0, 0.25)
	tw.tween_interval(3.2)
	tw.tween_property(l, "modulate:a", 0.0, 0.6)
	tw.finished.connect(l.queue_free)
	refresh_clue_count()


func fade(to_black: bool, duration: float = 0.8) -> void:
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", 1.0 if to_black else 0.0, duration)
	await tw.finished


func set_black() -> void:
	_fade.color.a = 1.0


func show_title(title: String, subtitle: String) -> void:
	_title.text = title
	_subtitle.text = subtitle
	var tw := create_tween()
	tw.tween_property(_title, "modulate:a", 1.0, 0.6)
	tw.parallel().tween_property(_subtitle, "modulate:a", 1.0, 0.9)
	tw.tween_interval(1.6)
	tw.tween_property(_title, "modulate:a", 0.0, 0.7)
	tw.parallel().tween_property(_subtitle, "modulate:a", 0.0, 0.7)
	await tw.finished


func _text_speed() -> float:
	match GameState.state["accessibilitySettings"].get("textSpeed", "normal"):
		"slow": return 28.0
		"fast": return 110.0
		_: return 60.0


## Mostra uma fala e espera o jogador (E/Espaço/Enter). O primeiro toque completa o texto.
func say(text: String, speaker: String = "") -> void:
	dialog_open = true
	_prompt.visible = false
	_dialog.visible = true
	_speaker.text = speaker
	_speaker.visible = speaker != ""
	_text.text = text
	_text.visible_characters = 0
	_typing = true
	_hint.visible = false
	_accept_after = Time.get_ticks_msec() + 180
	var total := text.length()
	var t := 0.0
	while _typing and _text.visible_characters < total:
		await get_tree().process_frame
		t += get_process_delta_time()
		_text.visible_characters = mini(total, int(t * _text_speed()))
	_text.visible_characters = -1
	_typing = false
	_hint.visible = true
	_waiting_advance = true
	await advance
	_waiting_advance = false
	_dialog.visible = false
	dialog_open = false


func choose(question: String, options: Array, focus_index: int = 0) -> int:
	choice_open = true
	_prompt.visible = false
	_choice_question.text = question
	for c in _choice_box.get_children():
		c.queue_free()
	_choice_buttons.clear()
	for i in options.size():
		var b := Button.new()
		b.text = "%d.  %s" % [i + 1, options[i]]
		b.add_theme_font_size_override("font_size", 20)
		b.custom_minimum_size = Vector2(0, 52)
		b.focus_mode = Control.FOCUS_ALL
		b.pressed.connect(_on_choice_pressed.bind(i))
		_choice_box.add_child(b)
		_choice_buttons.append(b)
	_choice_n = options.size()
	_choice_panel.visible = true
	_accept_after = Time.get_ticks_msec() + 220
	await get_tree().process_frame
	if not _choice_buttons.is_empty():
		_choice_buttons[clampi(focus_index, 0, _choice_buttons.size() - 1)].grab_focus()
	var idx: int = await choice_made
	_choice_panel.visible = false
	choice_open = false
	return idx


func _on_choice_pressed(i: int) -> void:
	if Time.get_ticks_msec() < _accept_after:
		return
	choice_made.emit(i)


func _unhandled_input(event: InputEvent) -> void:
	if Time.get_ticks_msec() < _accept_after:
		return
	if _waiting_advance or _typing:
		if event.is_action_pressed("interact"):
			get_viewport().set_input_as_handled()
			if _typing:
				_typing = false
			elif _waiting_advance:
				advance.emit()
		return
	if choice_open:
		for i in _choice_n:
			if event.is_action_pressed("choice_%d" % (i + 1)):
				get_viewport().set_input_as_handled()
				choice_made.emit(i)
				return
		# ENTER/Espaço acionam o botão focado (comportamento padrão do Button); "interact" não deve vazar
		if event.is_action_pressed("interact"):
			get_viewport().set_input_as_handled()
			for b in _choice_buttons:
				if b.has_focus():
					_on_choice_pressed(_choice_buttons.find(b))
					return
