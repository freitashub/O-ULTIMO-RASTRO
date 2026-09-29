extends TestCase
## Fase 1 (vertical slice): câmeras, colisão, portas, interação, pistas, escolhas, save e transição.

const SAVE := "user://test_phase01.json"


func _new_phase() -> Phase01:
	GameState.reset()
	SaveSystem.path_override = SAVE
	SaveSystem.delete_save()
	var p := Phase01.new()
	p.auto_intro = false
	tree.root.add_child(p)
	await tree.process_frame
	p.hud._fade.color.a = 0.0
	return p


func _free(p: Phase01) -> void:
	p.queue_free()
	SaveSystem.delete_save()
	SaveSystem.path_override = ""
	GameState.reset()


func _physics(n: int) -> void:
	for i in n:
		await tree.physics_frame


## Conduz diálogos/escolhas até `done` ficar verdadeiro (ou estourar o limite).
func _drive(p: Phase01, choice_index: int, done: Callable, limit: int = 900) -> bool:
	for i in limit:
		await tree.physics_frame
		if done.call():
			return true
		if p.hud.choice_open:
			p.hud._accept_after = 0
			p.hud.choice_made.emit(choice_index)
		elif p.hud.dialog_open:
			p.hud._accept_after = 0
			if p.hud._typing:
				p.hud._typing = false
			elif p.hud._waiting_advance:
				p.hud.advance.emit()
	return done.call()


func test_spawn_e_camera_inicial() -> void:
	var p := await _new_phase()
	var sp: Array = p.layout["spawn"]["pos"]
	check_near(p.player.global_position.x, sp[0], 0.01, "spawn x")
	check_near(p.player.global_position.z, sp[2], 0.01, "spawn z")
	check_eq(p.cameras.current_id(), "sala_entrada", "câmera inicial")
	check_eq(p.cam.current, true, "câmera da fase é a atual")
	_free(p)


func test_troca_de_camera_por_zona() -> void:
	var p := await _new_phase()
	var cases := [
		[Vector3(-1.6, 0, 1.2), "sala_entrada"],
		[Vector3(-3.0, 0, -2.8), "sala_portas"],
		[Vector3(-3.0, 0, 5.0), "varanda"],
		[Vector3(3.4, 0, -1.0), "garagem_entrada"],
		[Vector3(8.6, 0, 0.2), "garagem_fundo"],
	]
	for c in cases:
		p.player.teleport(c[0])
		p.cameras.snap()
		check_eq(p.cameras.current_id(), c[1], "zona de %s" % c[1])
	_free(p)


func test_colisao_com_parede_norte() -> void:
	var p := await _new_phase()
	p.player.teleport(Vector3(-3.0, 0, -2.5), 0.0)  # entre as portas: parede sólida
	p.player.walk_to(Vector3(-3.0, 0, -6.0))  # tenta atravessar a parede
	await _physics(150)
	var z := p.player.global_position.z
	check(z >= -4.0 + PlayerTheo.RADIUS - 0.03, "não atravessa a parede norte (z=%.2f)" % z)
	check(z < -3.6, "encostou na parede (z=%.2f)" % z)
	_free(p)


func test_porta_fechada_bloqueia_e_aberta_libera() -> void:
	var p := await _new_phase()
	var door: DoorNode = p.refs["doors"]["door_garagem"]
	p.player.teleport(Vector3(1.0, 0, -1.0), deg_to_rad(-90.0))
	p.player.walk_to(Vector3(4.0, 0, -1.0))
	await _physics(120)
	check(p.player.global_position.x < 1.85, "porta fechada bloqueia (x=%.2f)" % p.player.global_position.x)
	door.open(true)
	await _physics(4)
	p.player.walk_to(Vector3(4.0, 0, -1.0))
	await _physics(200)
	check(p.player.global_position.x > 3.8, "porta aberta libera a passagem (x=%.2f)" % p.player.global_position.x)
	_free(p)


func test_controles_relativos_a_camera_e_base_congelada() -> void:
	var p := await _new_phase()
	p.player.teleport(Vector3(-3.0, 0, -2.0), 0.0)
	p.cameras.snap()
	p.player.set_controllable(true)
	await _physics(3)
	var cf := -p.cam.global_transform.basis.z
	cf.y = 0
	cf = cf.normalized()
	Input.action_press("move_forward")
	await _physics(20)
	var v1 := Vector3(p.player.velocity.x, 0, p.player.velocity.z).normalized()
	check(v1.dot(cf) > 0.95, "frente = direção da câmera (dot %.2f)" % v1.dot(cf))
	# troca de câmera com a tecla mantida: a direção não pode inverter
	p.cameras.lock_to("garagem_entrada")
	p.cameras.update(0.1)
	await _physics(15)
	var v2 := Vector3(p.player.velocity.x, 0, p.player.velocity.z).normalized()
	check(v2.dot(v1) > 0.95, "base congelada enquanto a tecla é mantida (dot %.2f)" % v2.dot(v1))
	Input.action_release("move_forward")
	await _physics(30)
	p.player.velocity = Vector3.ZERO
	p.cameras.snap()
	await _physics(3)
	var cf2 := -p.cam.global_transform.basis.z
	cf2.y = 0
	cf2 = cf2.normalized()
	Input.action_press("move_forward")
	await _physics(20)
	var v3 := Vector3(p.player.velocity.x, 0, p.player.velocity.z).normalized()
	Input.action_release("move_forward")
	check(v3.dot(cf2) > 0.9, "após soltar, a base acompanha a nova câmera (dot %.2f)" % v3.dot(cf2))
	_free(p)


func test_theo_sempre_visivel_das_cameras() -> void:
	## Nenhum cenário/prop pode ocultar a cabeça ou o tronco do Theo em posições caminháveis.
	var p := await _new_phase()
	var space := p.player.get_world_3d().direct_space_state
	var bad: Array = []
	var checked := 0
	var rooms := [[-5.6, 1.6, -3.6, 2.6], [2.6, 9.4, -3.6, 2.6], [-6.0, 0.2, 3.3, 6.8]]
	for r in rooms:
		var x: float = r[0]
		while x <= r[1]:
			var z: float = r[2]
			while z <= r[3]:
				var pos := Vector3(x, 0, z)
				if _walkable(space, pos):
					checked += 1
					var shot := CinematicCameraManager.select(p.cameras.shots, pos, null, 0.0)
					for h in [1.25, 0.7]:
						if _blocked(space, shot.position, pos + Vector3(0, h, 0)):
							bad.append("%s@(%.1f,%.1f) h=%.2f" % [shot.id, x, z, h])
				z += 0.5
			x += 0.5
	check(checked > 100, "amostras suficientes (%d)" % checked)
	check(bad.is_empty(), "Theo oculto em %d pontos: %s" % [bad.size(), str(bad.slice(0, 8))])
	_free(p)


func _walkable(space: PhysicsDirectSpaceState3D, pos: Vector3) -> bool:
	var q := PhysicsShapeQueryParameters3D.new()
	var s := CapsuleShape3D.new()
	s.radius = PlayerTheo.RADIUS
	s.height = PlayerTheo.HEIGHT
	q.shape = s
	q.transform = Transform3D(Basis.IDENTITY, pos + Vector3(0, PlayerTheo.HEIGHT / 2.0 + 0.05, 0))
	q.collision_mask = 1
	return space.intersect_shape(q, 1).is_empty()


func _blocked(space: PhysicsDirectSpaceState3D, from: Vector3, to: Vector3) -> bool:
	var q := PhysicsRayQueryParameters3D.create(from, to)
	q.collision_mask = 1
	var hit := space.intersect_ray(q)
	if hit.is_empty():
		return false
	return from.distance_to(hit["position"]) < from.distance_to(to) - 0.3


func test_foco_e_prompt_do_casaco() -> void:
	var p := await _new_phase()
	p.player.teleport(Vector3(-2.5, 0, 2.2), 0.0)
	await _physics(3)
	p.interaction.refresh()
	check(p.interaction.focus != null, "há foco perto do casaco")
	if p.interaction.focus:
		check_eq(p.interaction.focus.id, "coat", "foco no casaco")
	# garagem só é interativa depois da escolha correta
	p.player.teleport(Vector3(6.2, 0, 1.4), 0.0)
	await _physics(3)
	p.interaction.refresh()
	check(p.interaction.focus == null, "interativos da garagem começam desabilitados")
	_free(p)


func test_exame_registra_flag() -> void:
	var p := await _new_phase()
	p.player.teleport(Vector3(-2.5, 0, 2.2), 0.0)
	await _physics(3)
	p.interaction.refresh()
	var done := func() -> bool: return not p.busy
	p.interaction.activate()
	check(p.busy, "interação ocupa o jogador")
	var ok := await _drive(p, 0, done)
	check(ok, "diálogo concluído")
	check(GameState.has_flag("saw_mother_coat"), "flag saw_mother_coat")
	check(GameState.has_flag("examined_coat"), "registro examined_coat")
	_free(p)


func test_rota_correta_garagem_pista_save_e_transicao() -> void:
	var p := await _new_phase()
	var finished_with: Array = []
	p.finished.connect(func(n: int) -> void: finished_with.append(n))
	var door_item: Interactable = p.refs["interactables"]["door_garagem"]
	p.player.teleport(Vector3(1.0, 0, -1.0), deg_to_rad(-90.0))
	p.busy = false
	p._on_activated(door_item)
	var got_choice := await _drive(p, 1, func() -> bool: return not p.busy and p.chosen != "")
	check(got_choice, "escolha resolvida")
	check_eq(p.chosen, "b", "garagem escolhida")
	check(GameState.has_clue("tire_mark"), "pista tire_mark registrada")
	check(GameState.has_flag("phase_1_correct"), "flag phase_1_correct")
	check_eq(GameState.state["errors"], 0, "sem erros")
	check((p.refs["doors"]["door_garagem"] as DoorNode).is_open, "porta da garagem abriu")
	check((p.refs["interactables"]["photo"] as Interactable).enabled, "garagem interativa")
	check(not (p.refs["interactables"]["door_quarto"] as Interactable).enabled, "outras portas travadas após a escolha")
	# save gravado com a escolha
	var saved := SaveSystem.load_game()
	check_eq(saved.get("clues", []), ["tire_mark"], "save contém a pista")
	check_eq(saved["choices"].get("1", ""), "b", "save contém a escolha")
	# explora a garagem: marca de pneu e fotografia
	p.player.teleport(Vector3(6.2, 0, 1.6), 0.0)
	await _physics(3)
	p.interaction.refresh()
	check_eq(p.interaction.focus.id if p.interaction.focus else "", "garage_tire", "foco na marca de pneu")
	p.interaction.activate()
	await _drive(p, 0, func() -> bool: return not p.busy)
	check(GameState.has_flag("saw_tire_mark"), "flag saw_tire_mark")
	p.player.teleport(Vector3(9.2, 0, 0.2), 0.0)
	await _physics(3)
	p.interaction.refresh()
	check_eq(p.interaction.focus.id if p.interaction.focus else "", "photo", "foco na fotografia")
	p.interaction.activate()
	var fin := await _drive(p, 0, func() -> bool: return not finished_with.is_empty(), 1500)
	check(fin, "fase terminou")
	check_eq(finished_with, [2], "próxima fase = 2")
	check(GameState.has_flag("found_photo_symbol"), "flag found_photo_symbol")
	check_eq(GameState.state["currentPhase"], 2, "currentPhase = 2")
	check_eq(SaveSystem.load_game().get("currentPhase", 0), 2, "save aponta para a fase 2")
	# recarrega
	GameState.reset()
	check(SaveSystem.continue_game(), "continuar carrega o save")
	check(GameState.has_clue("tire_mark"), "pista sobrevive ao recarregar")
	_free(p)


func test_rotas_erradas_registram_erro_e_avancam() -> void:
	for spec in [["door_quarto", 0, "a"], ["door_cozinha", 2, "c"]]:
		var p := await _new_phase()
		var finished_with: Array = []
		p.finished.connect(func(n: int) -> void: finished_with.append(n))
		p.player.teleport(Vector3(-3.0, 0, -3.0), 0.0)
		p._on_activated(p.refs["interactables"][spec[0]])
		var fin := await _drive(p, spec[1], func() -> bool: return not finished_with.is_empty(), 1500)
		check(fin, "fase avança na rota %s" % spec[2])
		check_eq(p.chosen, spec[2], "escolha %s" % spec[2])
		check_eq(GameState.state["errors"], 1, "erro registrado (%s)" % spec[2])
		check(GameState.has_flag("phase_1_wrong"), "flag phase_1_wrong (%s)" % spec[2])
		check(not GameState.has_clue("tire_mark"), "sem pista na rota errada (%s)" % spec[2])
		check_eq(GameState.state["currentPhase"], 2, "avançou (%s)" % spec[2])
		_free(p)


func test_animacao_placeholder_pernas_alternam() -> void:
	var p := await _new_phase()
	p.player.teleport(Vector3(-3.0, 0, 1.5), 0.0)
	p.cameras.snap()
	p.player.controllable = true
	await _physics(3)
	check(p.player.rig.loaded, "placeholder GLB com esqueleto carregado")
	var max_diff := 0.0
	var max_knee := 0.0
	Input.action_press("move_left")
	for i in 90:
		await tree.physics_frame
		await tree.process_frame
		var tl := p.player.rig.bone_pose_x("thigh_L")
		var tr := p.player.rig.bone_pose_x("thigh_R")
		max_diff = maxf(max_diff, absf(tl - tr))
		max_knee = maxf(max_knee, absf(p.player.rig.bone_pose_x("shin_L")))
	Input.action_release("move_left")
	check(max_diff > 0.5, "coxas alternadas (diff %.2f)" % max_diff)
	check(max_knee > 0.3, "joelho dobra (%.2f)" % max_knee)
	_free(p)


func test_frente_do_modelo_aponta_para_a_direcao() -> void:
	## O marcador "nose" do GLB precisa ficar à frente do Theo na direção em que ele olha.
	var p := await _new_phase()
	p.player.teleport(Vector3(-3.0, 0, 1.5), 0.0)  # yaw 0 → olha para -Z
	await tree.process_frame
	var head := p.player.rig.head_global_position()
	var fwd := p.player.facing()
	var d := p.player.rig.nose_global_position() - head
	d.y = 0
	check(d.length() > 0.05, "marcador do nariz distinto da cabeça")
	check(d.normalized().dot(fwd) > 0.5, "nariz à frente (dot %.2f)" % d.normalized().dot(fwd))
	_free(p)
