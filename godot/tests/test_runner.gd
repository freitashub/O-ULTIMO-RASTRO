extends Node
## Runner headless: godot --headless --path godot res://tests/test_runner.tscn [-- --only=nome]
## Sai com código 0 (tudo passou) ou 1.

const SUITES := [
	"res://tests/test_core.gd",
	"res://tests/test_camera.gd",
	"res://tests/test_interaction.gd",
	"res://tests/test_phase01.gd",
]


func _ready() -> void:
	await get_tree().process_frame  # fora da fase de setup da árvore (permite add_child em testes)
	var only := ""
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--only="):
			only = a.substr(7)
	var total := 0
	var failed := 0
	var assertions := 0
	for path in SUITES:
		if only != "" and not path.contains(only):
			continue
		var suite: TestCase = load(path).new()
		suite.tree = get_tree()
		for m in suite.get_method_list():
			var name: String = m["name"]
			if not name.begins_with("test_"):
				continue
			total += 1
			var before := suite.failures.size()
			await suite.call(name)
			if suite.failures.size() > before:
				failed += 1
				print("  FAIL %s::%s" % [path.get_file(), name])
				for i in range(before, suite.failures.size()):
					print("       - ", suite.failures[i])
			else:
				print("  ok   %s::%s" % [path.get_file(), name])
		assertions += suite.assertions
	print("TESTES: %d/%d passaram (%d asserções)" % [total - failed, total, assertions])
	get_tree().quit(1 if failed > 0 else 0)
