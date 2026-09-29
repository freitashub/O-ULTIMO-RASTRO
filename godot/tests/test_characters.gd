extends TestCase
## Personagens gerados da arte: esqueleto, escala, material, biblioteca de animações, BoneMap humanoide e locomoção.

const IDS := ["theo", "theo_t1", "theo_t2", "theo_t3", "theo_t4", "clara", "elias", "silas", "prisioneiro", "silas_troll", "troll_vigia", "troll_ferreiro", "troll_guardiao"]
const HEIGHTS := {
	"theo": 1.45, "theo_t1": 1.45, "theo_t2": 1.45, "theo_t3": 1.45, "theo_t4": 1.45, "clara": 1.66, "elias": 1.78, "silas": 1.82,
	"prisioneiro": 1.70, "silas_troll": 2.15, "troll_vigia": 1.62, "troll_ferreiro": 1.85, "troll_guardiao": 2.40,
}
const BONES := ["hips", "spine", "chest", "neck", "head", "shoulder_L", "upperarm_L", "forearm_L", "hand_L", "shoulder_R", "upperarm_R", "forearm_R", "hand_R", "thigh_L", "shin_L", "foot_L", "thigh_R", "shin_R", "foot_R"]


func _skeleton(n: Node) -> Skeleton3D:
	if n is Skeleton3D:
		return n
	for c in n.get_children():
		var r := _skeleton(c)
		if r:
			return r
	return null


func _meshes(n: Node, out: Array) -> void:
	if n is MeshInstance3D:
		out.append(n)
	for c in n.get_children():
		_meshes(c, out)


func test_esqueleto_escala_e_malha_de_todos() -> void:
	for id in IDS:
		var inst: Node3D = (load("res://assets/characters/%s/%s.glb" % [id, id]) as PackedScene).instantiate()
		tree.root.add_child(inst)
		var sk := _skeleton(inst)
		check(sk != null, "%s: tem Skeleton3D" % id)
		if sk == null:
			inst.queue_free()
			continue
		for b in BONES:
			check(sk.find_bone(b) >= 0, "%s: osso %s" % [id, b])
		check(sk.find_bone("nose") >= 0, "%s: marcador nose" % id)
		var meshes: Array = []
		_meshes(inst, meshes)
		check_eq(meshes.size(), 1, "%s: malha única e contínua" % id)
		var mi: MeshInstance3D = meshes[0]
		var arr := mi.mesh.surface_get_arrays(0)
		check(arr[Mesh.ARRAY_BONES] != null and arr[Mesh.ARRAY_WEIGHTS] != null, "%s: pesos de pele" % id)
		check(arr[Mesh.ARRAY_COLOR] != null and arr[Mesh.ARRAY_TEX_UV] != null, "%s: cor chapada + UV de projeção" % id)
		var h := mi.get_aabb().size.y
		check(absf(h - HEIGHTS[id]) / HEIGHTS[id] < 0.08, "%s: altura %.2f m (esperado %.2f)" % [id, h, HEIGHTS[id]])
		check(mi.get_aabb().position.y > -0.03, "%s: pés no chão (y=%.3f)" % [id, mi.get_aabb().position.y])
		inst.queue_free()


func test_biblioteca_de_animacoes_cobre_todos_os_esqueletos() -> void:
	var lib: AnimationLibrary = load("res://assets/animations/humanoid_library.res")
	for a in ["idle", "walk", "run", "talk", "interact"]:
		check(lib.has_animation(a), "animação %s existe" % a)
	for a in ["idle", "walk", "run", "talk"]:
		check_eq(lib.get_animation(a).loop_mode, Animation.LOOP_LINEAR, "%s em laço" % a)
	check_eq(lib.get_animation("interact").loop_mode, Animation.LOOP_NONE, "interact é one-shot")
	var bones_used := {}
	for a in lib.get_animation_list():
		var anim := lib.get_animation(a)
		for t in anim.get_track_count():
			bones_used[String(anim.track_get_path(t)).get_slice(":", 1)] = true
	for id in IDS:
		var inst: Node3D = (load("res://assets/characters/%s/%s.glb" % [id, id]) as PackedScene).instantiate()
		var sk := _skeleton(inst)
		for b in bones_used:
			check(sk.find_bone(b) >= 0, "%s: osso animado %s existe" % [id, b])
		check_eq(String(sk.get_path()).get_slice("/", -1) if sk.is_inside_tree() else sk.name, "Skeleton3D", "%s: nó chama Skeleton3D" % id)
		inst.free()


func test_bonemap_humanoide_valido() -> void:
	var bm: BoneMap = load("res://assets/characters/humanoid_bone_map.tres")
	check(bm != null and bm.profile is SkeletonProfileHumanoid, "BoneMap com perfil humanoide")
	var mapped := 0
	for i in bm.profile.bone_size:
		var pname := bm.profile.get_bone_name(i)
		if bm.get_skeleton_bone_name(pname) != &"":
			mapped += 1
	check_eq(mapped, 19, "19 ossos do perfil humanoide mapeados")
	for id in ["theo", "silas_troll", "troll_guardiao"]:
		var inst: Node3D = (load("res://assets/characters/%s/%s.glb" % [id, id]) as PackedScene).instantiate()
		var sk := _skeleton(inst)
		for i in bm.profile.bone_size:
			var mapped_name := bm.get_skeleton_bone_name(bm.profile.get_bone_name(i))
			if mapped_name != &"":
				check(sk.find_bone(mapped_name) >= 0, "%s: %s → osso existe" % [id, mapped_name])
		inst.free()


func test_locomocao_e_estados_de_animacao() -> void:
	for id in ["theo", "clara", "silas_troll", "troll_vigia", "troll_guardiao"]:
		var rig := CharacterRig.new()
		rig.character_id = id
		tree.root.add_child(rig)
		await tree.process_frame
		check(rig.loaded, "%s: rig carregado" % id)
		rig.set_locomotion(0.54, false)
		var maxdiff := 0.0
		var maxknee := 0.0
		for i in 70:
			await tree.process_frame
			maxdiff = maxf(maxdiff, absf(rig.bone_pose_x("thigh_L") - rig.bone_pose_x("thigh_R")))
			maxknee = maxf(maxknee, absf(rig.bone_pose_x("shin_L")))
		check(maxdiff > 0.5, "%s: coxas alternam (%.2f)" % [id, maxdiff])
		check(maxknee > 0.3, "%s: joelho dobra (%.2f)" % [id, maxknee])
		rig.set_locomotion(0.0, false)
		await tree.create_timer(0.8).timeout
		check(absf(rig.bone_pose_x("thigh_L")) < 0.15, "%s: parado volta ao repouso (%.2f)" % [id, rig.bone_pose_x("thigh_L")])
		rig.set_talking(true)
		await tree.create_timer(0.5).timeout
		check_eq(rig.current_state(), "Talk", "%s: estado Talk" % id)
		rig.set_talking(false)
		await tree.create_timer(0.5).timeout
		check_eq(rig.current_state(), "Locomotion", "%s: volta a Locomotion" % id)
		rig.play_interact()
		await tree.create_timer(0.3).timeout
		check_eq(rig.current_state(), "Interact", "%s: estado Interact" % id)
		await tree.create_timer(1.6).timeout
		check_eq(rig.current_state(), "Locomotion", "%s: Interact termina e volta" % id)
		rig.queue_free()


func test_variantes_de_transformacao_do_theo() -> void:
	check_eq(Transformation.theo_variant(1, 0), "theo", "nível 0")
	check_eq(Transformation.theo_variant(1, 3), "theo", "nenhuma alteração antes da fase 7 (mesmo com nível alto)")
	check_eq(Transformation.theo_variant(7, 1), "theo_t1", "fase 7 nível 1")
	check_eq(Transformation.theo_variant(11, 2), "theo_t2", "fase 11 nível 2")
	check_eq(Transformation.theo_variant(14, 3), "theo_t3", "fase 14 nível 3")
	check_eq(Transformation.theo_variant(17, 4), "theo_t4", "fase 17 nível 4")
	check_eq(Transformation.theo_variant(20, 5), "theo_t4", "fase 20 nível 5")
	check_eq(Transformation.theo_variant(11, 1), "theo_t1", "nível manda: fase 11 com nível 1 = t1")
	check(not Transformation.effect_visible(6, 5), "efeito invisível antes da fase 7")
	check(Transformation.effect_visible(7, 1), "efeito visível na fase 7 com nível 1")
