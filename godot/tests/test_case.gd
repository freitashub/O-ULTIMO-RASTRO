class_name TestCase
extends RefCounted
## Base mínima de testes (sem addons). Métodos `test_*` são descobertos pelo runner; `await` é permitido.

var failures: Array[String] = []
var assertions := 0
var tree: SceneTree  # definido pelo runner


func check(cond: bool, msg: String) -> void:
	assertions += 1
	if not cond:
		failures.append(msg)


func check_eq(actual: Variant, expected: Variant, msg: String) -> void:
	assertions += 1
	if actual != expected:
		failures.append("%s (esperado %s, obtido %s)" % [msg, str(expected), str(actual)])


func check_near(actual: float, expected: float, tol: float, msg: String) -> void:
	assertions += 1
	if absf(actual - expected) > tol:
		failures.append("%s (esperado %.3f ±%.3f, obtido %.3f)" % [msg, expected, tol, actual])
