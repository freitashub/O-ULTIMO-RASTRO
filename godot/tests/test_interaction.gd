extends TestCase
## InteractionSystem (raio, linha de visão, foco, ativação) e InvestigationSystem (flags, pistas).

func _world() -> Dictionary:
	var root := Node3D.new()
	tree.root.add_child(root)
	# chão + parede entre A e B
	var floor_body := StaticBody3D.new()
	floor_body.collision_layer = 1
	var fs := CollisionShape3D.new()
	var fb := BoxShape3D.new()
	fb.size = Vector3(20, 0.2, 20)
	fs.shape = fb
	floor_body.add_child(fs)
	floor_body.position.y = -0.1
	root.add_child(floor_body)
	var wall := StaticBody3D.new()
	wall.collision_layer = 1
	var ws := CollisionShape3D.new()
	var wb := BoxShape3D.new()
	wb.size = Vector3(0.2, 3, 4)
	ws.shape = wb
	wall.add_child(ws)
	wall.position = Vector3(1.0, 1.5, 0)
	root.add_child(wall)
	var player := PlayerTheo.new()
	root.add_child(player)
	var sys := InteractionSystem.new()
	root.add_child(sys)
	sys.setup(player)
	sys.set_physics_process(false)
	return {"root": root, "player": player, "sys": sys}


func _item(root: Node3D, id: String, pos: Vector3, radius: float = 1.5) -> Interactable:
	var it := Interactable.new()
	it.id = id
	it.label = id
	it.radius = radius
	root.add_child(it)
	it.position = pos
	return it


func _physics(n: int) -> void:
	for i in n:
		await tree.physics_frame


func test_foco_por_raio_e_mais_proximo() -> void:
	var w := _world()
	var root: Node3D = w["root"]
	var player: PlayerTheo = w["player"]
	var sys: InteractionSystem = w["sys"]
	player.teleport(Vector3(-3, 0, 0), 0.0)
	var a := _item(root, "perto", Vector3(-3, 0, -1.0))
	var b := _item(root, "longe", Vector3(-3, 0, -1.4))
	await _physics(2)
	check_eq(sys.find_best(), a, "escolhe o mais próximo")
	a.enabled = false
	check_eq(sys.find_best(), b, "desabilitado é ignorado")
	b.enabled = false
	check(sys.find_best() == null, "sem interativos habilitados")
	root.queue_free()


func test_fora_do_raio() -> void:
	var w := _world()
	var root: Node3D = w["root"]
	var player: PlayerTheo = w["player"]
	var sys: InteractionSystem = w["sys"]
	player.teleport(Vector3(-5, 0, 0), 0.0)
	_item(root, "x", Vector3(-5, 0, -3.0), 1.5)
	await _physics(2)
	check(sys.find_best() == null, "além do raio → sem foco")
	root.queue_free()


func test_linha_de_visao_bloqueada_por_parede() -> void:
	var w := _world()
	var root: Node3D = w["root"]
	var player: PlayerTheo = w["player"]
	var sys: InteractionSystem = w["sys"]
	player.teleport(Vector3(0.4, 0, 0), 0.0)
	var behind := _item(root, "atras_da_parede", Vector3(1.6, 0, 0), 1.6)
	behind.height = 1.0
	await _physics(2)
	check(sys.find_best() == null, "objeto atrás da parede não recebe foco")
	player.teleport(Vector3(0.4, 0, 3.0), 0.0)
	behind.position = Vector3(0.4, 0, 2.0)
	await _physics(2)
	check_eq(sys.find_best(), behind, "sem parede no caminho → foco")
	root.queue_free()


func test_ativacao_emite_sinal() -> void:
	var w := _world()
	var root: Node3D = w["root"]
	var player: PlayerTheo = w["player"]
	var sys: InteractionSystem = w["sys"]
	player.teleport(Vector3(-3, 0, 0), 0.0)
	var a := _item(root, "alvo", Vector3(-3, 0, -1.0))
	var got: Array = []
	sys.activated.connect(func(it: Interactable) -> void: got.append(it.id))
	check(not sys.activate(), "sem foco não ativa")
	await _physics(2)
	sys.refresh()
	check(sys.activate(), "com foco ativa")
	check_eq(got, ["alvo"], "sinal com o id")
	sys.enabled = false
	sys.refresh()
	check(sys.focus == null, "sistema desabilitado limpa o foco")
	root.queue_free()


func test_investigacao_flags_e_pistas() -> void:
	GameState.reset()
	var inv := InvestigationSystem.new()
	tree.root.add_child(inv)
	var seen: Array = []
	inv.clue_discovered.connect(func(c: String) -> void: seen.append(c))
	var r1 := inv.examine({"id": "garage_tire", "text": "t", "flag": "saw_tire_mark", "clue": "tire_mark"})
	check(r1["first_time"], "primeira vez")
	check(r1["clue_added"], "pista nova")
	check(GameState.has_flag("saw_tire_mark"), "flag da pista ligada")
	check(GameState.has_flag("examined_garage_tire"), "registro de exame")
	check(GameState.has_clue("tire_mark"), "pista no estado")
	var r2 := inv.examine({"id": "garage_tire", "text": "t", "flag": "saw_tire_mark", "clue": "tire_mark"})
	check(not r2["first_time"], "segunda vez não é inédita")
	check(not r2["clue_added"], "pista não duplica")
	check_eq(seen, ["tire_mark"], "sinal emitido uma vez")
	inv.queue_free()
	GameState.reset()
