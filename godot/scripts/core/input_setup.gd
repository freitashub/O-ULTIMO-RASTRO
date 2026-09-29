extends Node
## Autoload `InputSetup`: registra as ações de entrada por código (mantém o projeto.godot legível e testável).

const ACTIONS := {
	"move_forward": [KEY_W, KEY_UP],
	"move_back": [KEY_S, KEY_DOWN],
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"run": [KEY_SHIFT],
	"interact": [KEY_E, KEY_ENTER, KEY_SPACE],
	"cancel": [KEY_ESCAPE],
	"choice_1": [KEY_1],
	"choice_2": [KEY_2],
	"choice_3": [KEY_3],
	"open_clues": [KEY_TAB, KEY_I],
}


func _ready() -> void:
	for action in ACTIONS:
		if not InputMap.has_action(action):
			InputMap.add_action(action, 0.2)
		for key in ACTIONS[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
