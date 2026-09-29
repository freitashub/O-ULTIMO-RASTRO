extends TestCase
## CinematicCameraManager: seleção por zona, prioridade, histerese, blend, lock.

func _shot(id: String, mn: Vector3, mx: Vector3, prio: int = 0, transition: float = 0.5) -> CameraShot:
	return CameraShot.from_dict({
		"id": id, "camera_position": [0, 3, 5], "fov": 50, "priority": prio, "transition": transition,
		"camera_zone": {"min": [mn.x, mn.y, mn.z], "max": [mx.x, mx.y, mx.z]},
	})


func test_selecao_por_zona() -> void:
	var list: Array[CameraShot] = [_shot("a", Vector3(-5, 0, -5), Vector3(0, 3, 5)), _shot("b", Vector3(0, 0, -5), Vector3(5, 3, 5))]
	check_eq(CinematicCameraManager.select(list, Vector3(-2, 1, 0), null, 0.5).id, "a", "x=-2 → a")
	check_eq(CinematicCameraManager.select(list, Vector3(3, 1, 0), null, 0.5).id, "b", "x=3 → b")


func test_histerese_na_fronteira() -> void:
	var list: Array[CameraShot] = [_shot("a", Vector3(-5, 0, -5), Vector3(0, 3, 5)), _shot("b", Vector3(0, 0, -5), Vector3(5, 3, 5))]
	var cur := CinematicCameraManager.select(list, Vector3(-1, 1, 0), null, 0.5)
	# atravessa a fronteira x=0 por 0.3 m: dentro da margem, mantém "a"
	for x in [0.1, 0.3, 0.1, 0.3]:
		var s := CinematicCameraManager.select(list, Vector3(x, 1, 0), cur, 0.5)
		check_eq(s.id, "a", "não alterna a x=%.1f" % x)
		cur = s
	check_eq(CinematicCameraManager.select(list, Vector3(0.9, 1, 0), cur, 0.5).id, "b", "passou da margem → b")


func test_prioridade_vence() -> void:
	var list: Array[CameraShot] = [_shot("baixa", Vector3(-5, 0, -5), Vector3(5, 3, 5), 0), _shot("alta", Vector3(-1, 0, -1), Vector3(1, 3, 1), 5)]
	check_eq(CinematicCameraManager.select(list, Vector3(0, 1, 0), null, 0.5).id, "alta", "prioridade maior")
	check_eq(CinematicCameraManager.select(list, Vector3(3, 1, 3), null, 0.5).id, "baixa", "fora da zona alta")


func test_fora_de_todas_as_zonas_mantem_atual() -> void:
	var list: Array[CameraShot] = [_shot("a", Vector3(-1, 0, -1), Vector3(1, 3, 1))]
	var cur := CinematicCameraManager.select(list, Vector3(0, 1, 0), null, 0.0)
	check_eq(CinematicCameraManager.select(list, Vector3(50, 1, 50), cur, 0.0).id, "a", "mantém")


func _make_manager(list: Array[CameraShot]) -> Array:
	var root := Node3D.new()
	tree.root.add_child(root)
	var cam := Camera3D.new()
	root.add_child(cam)
	var target := Node3D.new()
	root.add_child(target)
	var m := CinematicCameraManager.new()
	root.add_child(m)
	m.setup(cam, target)
	m.set_process(false)  # passos manuais e determinísticos
	for s in list:
		m.add_shot(s)
	return [root, m, cam, target]


func test_blend_e_corte() -> void:
	var a := _shot("a", Vector3(-5, 0, -5), Vector3(0, 3, 5), 0, 0.5)
	var b := _shot("b", Vector3(0, 0, -5), Vector3(5, 3, 5), 0, 0.0)  # corte seco
	b.position = Vector3(8, 3, 0)
	var parts := _make_manager([a, b] as Array[CameraShot])
	var m: CinematicCameraManager = parts[1]
	var cam: Camera3D = parts[2]
	var target: Node3D = parts[3]
	target.global_position = Vector3(-3, 0, 0)
	m.snap()
	check_eq(m.current_id(), "a", "shot inicial")
	check_near(cam.global_position.z, 5.0, 0.01, "câmera no shot a")
	target.global_position = Vector3(4, 0, 0)
	m.update(0.016)
	check_eq(m.current_id(), "b", "trocou para b")
	check(not m.is_blending(), "transition=0 → corte seco")
	check_near(cam.global_position.x, 8.0, 0.01, "câmera no shot b imediatamente")
	# volta para a com blend de 0.5 s
	target.global_position = Vector3(-4, 0, 0)
	m.update(0.016)
	check(m.is_blending(), "blend em andamento")
	var x_mid := 0.0
	for i in 15:
		m.update(0.016)
	x_mid = cam.global_position.x
	check(x_mid < 8.0 and x_mid > 0.0, "posição intermediária durante o blend (%.2f)" % x_mid)
	for i in 40:
		m.update(0.016)
	check(not m.is_blending(), "blend terminou")
	check_near(cam.global_position.x, 0.0, 0.01, "chegou ao shot a")
	parts[0].queue_free()


func test_lock_e_unlock() -> void:
	var a := _shot("a", Vector3(-5, 0, -5), Vector3(0, 3, 5))
	var b := _shot("b", Vector3(0, 0, -5), Vector3(5, 3, 5))
	var parts := _make_manager([a, b] as Array[CameraShot])
	var m: CinematicCameraManager = parts[1]
	var target: Node3D = parts[3]
	target.global_position = Vector3(-3, 0, 0)
	m.snap()
	m.lock_to("b")
	check(m.is_locked(), "travada")
	m.update(0.016)
	check_eq(m.current_id(), "b", "lock vence a zona")
	m.unlock()
	m.update(0.016)
	check_eq(m.current_id(), "a", "destravou → zona do alvo")
	parts[0].queue_free()


func test_sinal_shot_changed_e_dados() -> void:
	var s := CameraShot.from_dict({"id": "x", "camera_position": [1, 2, 3], "camera_rotation": [-20, 45, 0], "fov": 60})
	check_eq(s.look_mode, "fixed", "rotação explícita → fixed")
	check(not s.has_zone, "sem zona")
	var p := CameraShot.from_dict({"id": "y", "camera_position": [0, 0, 0], "look_target": [1, 1, 1]})
	check_eq(p.look_mode, "point", "look_target como ponto")
	var a := _shot("a", Vector3(-5, 0, -5), Vector3(0, 3, 5))
	var b := _shot("b", Vector3(0, 0, -5), Vector3(5, 3, 5))
	var parts := _make_manager([a, b] as Array[CameraShot])
	var m: CinematicCameraManager = parts[1]
	var changes: Array = []
	m.shot_changed.connect(func(o: String, n: String) -> void: changes.append([o, n]))
	parts[3].global_position = Vector3(-3, 0, 0)
	m.snap()
	parts[3].global_position = Vector3(3, 0, 0)
	m.update(0.016)
	check_eq(changes, [["", "a"], ["a", "b"]], "sequência de trocas")
	parts[0].queue_free()
